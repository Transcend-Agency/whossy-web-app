/**
 * Whossy Cloud Functions — global name search on Explore.
 *
 *  - indexUserSearchName (trigger)  keeps users/{uid}.search_prefixes in step
 *                                   with first_name/last_name
 *  - searchUsers         (callable) finds people by first and/or last name
 *
 * Search runs on the server, not as a client query, so the visibility rules
 * hold no matter which client asks: banned, unapproved and unfinished
 * profiles, people who switched off "Public search", and blocks in either
 * direction never come back. Only what a result card needs is returned (no
 * last name, no profile document), and each account is rate-limited so name
 * search can't be used to walk the whole user base.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  MAX_PREFIX,
  MIN_PREFIX,
  nameMatches,
  nameWords,
  queryWords,
  needsReindex,
  searchPrefixes,
} from "./searchIndex";

// Lazy — see the comment in notifications.ts.
const db = () => admin.firestore();

/** Results returned per search. */
export const SEARCH_RESULT_LIMIT = 20;
/** Documents read per search before filtering. Bounds the cost of a short,
 *  common prefix; typing more letters narrows it. */
const CANDIDATE_LIMIT = 200;
/** Longest query accepted, in characters. */
const MAX_QUERY_LENGTH = 60;

/** Per-account limits. Generous for someone typing, tight for a script. */
export const SEARCHES_PER_MINUTE = 30;
export const SEARCHES_PER_DAY = 500;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

// gRPC status codes the Admin SDK reports on a failed precondition.
const NOT_FOUND = 5;
const FAILED_PRECONDITION = 9;

export interface SearchResult {
  uid: string;
  first_name: string;
  age: number | null;
  photo: string | null;
}

/** Recomputes search_prefixes whenever a profile is written. Most writes to
 *  users/{uid} don't touch the name, so the common case returns without a
 *  read or write. */
export const indexUserSearchName = onDocumentWritten("users/{uid}", async (event) => {
  const after = event.data?.after;
  if (!after?.exists) return;
  const data = after.data() ?? {};

  const prefixes = searchPrefixes(data.first_name, data.last_name);
  if (!needsReindex(data.search_prefixes, prefixes)) return;

  try {
    // Only if the profile is still as this event saw it. If it has changed
    // since, a newer event is on its way and will index the newer name; if
    // it has been deleted, there's nothing to index. Either way an older,
    // late-running event can't overwrite newer prefixes.
    await after.ref.update({ search_prefixes: prefixes }, { lastUpdateTime: after.updateTime });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === NOT_FOUND || code === FAILED_PRECONDITION) return;
    logger.error(`indexUserSearchName: failed for ${event.params.uid}`, err);
  }
});

function ageFrom(dob: unknown, now: Date): number | null {
  let birth: Date | null = null;
  if (dob instanceof Timestamp) birth = dob.toDate();
  else if (dob instanceof Date) birth = dob;
  if (!birth || Number.isNaN(birth.getTime())) return null;

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Fixed one-minute and one-day windows, counted in a server-only document. */
async function consumeSearchQuota(uid: string): Promise<boolean> {
  const ref = db().collection("users").doc(uid).collection("private").doc("search_rate");
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const d = snap.exists ? snap.data() ?? {} : {};

    const minuteFresh = typeof d.minute_start === "number" && now - d.minute_start < MINUTE_MS;
    const dayFresh = typeof d.day_start === "number" && now - d.day_start < DAY_MS;
    const minuteCount = minuteFresh ? (d.minute_count as number) ?? 0 : 0;
    const dayCount = dayFresh ? (d.day_count as number) ?? 0 : 0;

    if (minuteCount >= SEARCHES_PER_MINUTE || dayCount >= SEARCHES_PER_DAY) return false;

    tx.set(ref, {
      minute_start: minuteFresh ? d.minute_start : now,
      minute_count: minuteCount + 1,
      day_start: dayFresh ? d.day_start : now,
      day_count: dayCount + 1,
    });
    return true;
  });
}

/** Best matches first: a whole-word first-name hit, then a first-name prefix,
 *  then a last-name-only match; alphabetical within each group. */
function rank(words: string[], firstName: string): number {
  const first = nameWords(firstName);
  if (words.some((q) => first.includes(q))) return 0;
  if (words.some((q) => first.some((w) => w.startsWith(q)))) return 1;
  return 2;
}

export const searchUsers = onCall<{ query?: unknown }>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to search.");

  const raw = request.data?.query;
  if (typeof raw !== "string" || raw.length > MAX_QUERY_LENGTH) {
    throw new HttpsError("invalid-argument", `Search for a name of up to ${MAX_QUERY_LENGTH} characters.`);
  }
  const words = queryWords(raw);
  if (words.length === 0) {
    throw new HttpsError("invalid-argument", `Type at least ${MIN_PREFIX} letters.`);
  }

  const meSnap = await db().collection("users").doc(uid).get();
  if (!meSnap.exists) {
    throw new HttpsError("failed-precondition", "Finish setting up your profile to search.");
  }
  if (meSnap.get("is_banned") === true) {
    throw new HttpsError("permission-denied", "This account can't search.");
  }

  if (!(await consumeSearchQuota(uid))) {
    throw new HttpsError("resource-exhausted", "Too many searches. Try again in a minute.");
  }

  // Query on the longest word: it is the most selective.
  const key = [...words].sort((a, b) => b.length - a.length)[0].slice(0, MAX_PREFIX);
  const snap = await db()
    .collection("users")
    .where("search_prefixes", "array-contains", key)
    .where("has_completed_onboarding", "==", true)
    .where("is_approved", "==", true)
    .limit(CANDIDATE_LIMIT)
    .get();

  const myBlocks = new Set<string>((meSnap.get("blockedIds") as string[] | undefined) ?? []);
  const now = new Date();

  const matches: Array<SearchResult & { rank: number }> = [];
  for (const doc of snap.docs) {
    if (doc.id === uid || myBlocks.has(doc.id)) continue;
    const d = doc.data();
    if (d.is_banned === true) continue;
    if (d.user_settings?.public_search === false) continue;
    if (Array.isArray(d.blockedIds) && d.blockedIds.includes(uid)) continue;
    if (!nameMatches(words, d.first_name, d.last_name)) continue;

    const firstName = typeof d.first_name === "string" ? d.first_name.trim() : "";
    if (!firstName) continue;

    matches.push({
      uid: doc.id,
      first_name: firstName,
      age: ageFrom(d.date_of_birth, now),
      photo: Array.isArray(d.photos) && typeof d.photos[0] === "string" ? d.photos[0] : null,
      rank: rank(words, firstName),
    });
  }

  matches.sort((a, b) => a.rank - b.rank || a.first_name.localeCompare(b.first_name));
  const results: SearchResult[] = matches
    .slice(0, SEARCH_RESULT_LIMIT)
    .map(({ uid: id, first_name, age, photo }) => ({ uid: id, first_name, age, photo }));

  return { results };
});
