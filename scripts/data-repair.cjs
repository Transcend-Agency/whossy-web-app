#!/usr/bin/env node
// One-off repair of live data ahead of the security-rules deploy (plan
// section 5). Each step fixes a shape the 2026-10-04 audit found in the
// whossy-app project and that the new rules or functions cannot live with.
//
//   node scripts/data-repair.cjs                    dry run: prints what would change
//   node scripts/data-repair.cjs --apply            makes the changes (writes a backup first)
//   node scripts/data-repair.cjs --only=defaults,reverifyDeadline --grace-days=14
//   node scripts/data-repair.cjs --restore=<backup file> [--apply]
//
// It is safe to run twice: every step looks for the broken shape and does
// nothing where it is already fixed. No balance is ever lowered. Values that
// are moved are kept under a _legacy key or in users/{uid}/private.
//
// Before anything is written, the full current content of every document the
// step will touch is appended to a backup file (outside the repo, owner-read
// only). --restore puts those documents back exactly, and removes any
// document the repair created. A run with --apply and no backup file refuses
// to start.
//
// paystackPayloads and reverifyDeadline are DEFERRED: they only run when
// named in --only. The first must wait until the new web app is live (the old
// site reads the data it moves) and the second until the new apps that show
// the deadline are out.
//
// Against the emulator it needs only FIRESTORE_EMULATOR_HOST. Against the
// real project it needs GOOGLE_APPLICATION_CREDENTIALS and, with --apply,
// --confirm-project=<project id> so it cannot be pointed at production by
// accident.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const admin = require("../functions/node_modules/firebase-admin");
const { FieldValue, Timestamp, GeoPoint, DocumentReference } = admin.firestore;

const DEFERRED = new Set(["paystackPayloads", "reverifyDeadline"]);

// Firestore values that JSON would flatten, tagged so restore can rebuild them.
function encode(value) {
  if (value instanceof Timestamp) return { __ts: [value.seconds, value.nanoseconds] };
  if (value instanceof GeoPoint) return { __geo: [value.latitude, value.longitude] };
  if (value instanceof DocumentReference) return { __ref: value.path };
  if (value instanceof Uint8Array) return { __bytes: Buffer.from(value).toString("base64") };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
  return value;
}

function decode(db, value) {
  if (Array.isArray(value)) return value.map((v) => decode(db, v));
  if (value && typeof value === "object") {
    if ("__ts" in value) return new Timestamp(value.__ts[0], value.__ts[1]);
    if ("__geo" in value) return new GeoPoint(value.__geo[0], value.__geo[1]);
    if ("__ref" in value) return db.doc(value.__ref);
    if ("__bytes" in value) return Buffer.from(value.__bytes, "base64");
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(db, v)]));
  }
  return value;
}

/** The document as it is now, or null if it does not exist. */
const image = (snap) => ({ path: snap.ref.path, data: snap.exists ? snap.data() : null });

const SERVER_DEFAULTS = { is_banned: false, is_premium: false, credit_balance: 0, credits_on_hold: 0 };
const PAIR_ID = /^[^_/]+_[^_/]+$/;

function parseArgs(argv) {
  const flag = (name) => argv.includes(`--${name}`);
  const value = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
  return {
    apply: flag("apply"),
    only: value("only")?.split(","),
    confirmProject: value("confirm-project"),
    backupFile: value("backup"),
    restore: value("restore"),
    graceDays: value("grace-days") ? Number(value("grace-days")) : undefined,
  };
}

/**
 * Every step returns the changes it wants as
 *   { path, reason, before, write: (batch) => void }
 * `before` lists the documents the change touches (as image() describes
 * them), so the dry run and the real run share one code path and the backup
 * is exactly what the change will overwrite.
 */
const STEPS = {
  // Accounts created by older builds lack these. Functions and Retool treat
  // "missing" and "zero" differently in places; this makes them the same.
  async defaults(db) {
    const changes = [];
    for (const doc of (await db.collection("users").get()).docs) {
      const missing = Object.fromEntries(Object.entries(SERVER_DEFAULTS).filter(([key]) => !(key in doc.data())));
      if (Object.keys(missing).length === 0) continue;
      changes.push({
        path: doc.ref.path,
        reason: `add missing ${Object.keys(missing).join(", ")}`,
        before: [image(doc)],
        write: (batch) => batch.update(doc.ref, missing),
      });
    }
    return changes;
  },

  // Decision D4 (revised 2026-10-07): accounts approved from the admin
  // dashboard with no selfie on file get a date to verify by, not an
  // immediate lockout. enforceReverification ends the approval if the date
  // passes; the apps show the deadline. Accounts that do have a selfie on
  // file are left alone here: a reviewer clears those in Retool without the
  // user doing anything (see `report`).
  async reverifyDeadline(db, { graceDays = 14 } = {}) {
    const changes = [];
    const deadline = Timestamp.fromMillis(Date.now() + graceDays * 24 * 60 * 60 * 1000);
    for (const doc of (await db.collection("users").where("is_approved", "==", true).get()).docs) {
      const fv = doc.get("face_verification");
      if (fv?.status || fv?.photo || doc.get("reverify_by")) continue;
      changes.push({
        path: doc.ref.path,
        reason: `approved with no selfie on file: must verify within ${graceDays} days`,
        before: [image(doc)],
        write: (batch) => batch.update(doc.ref, { reverify_by: deadline }),
      });
    }
    return changes;
  },

  // Two documents hold a bare string or number here. The payment functions
  // increment amount_paid_in_total.<currency>, which fails on a non-map.
  async amountPaidShape(db) {
    const changes = [];
    for (const doc of (await db.collection("users").get()).docs) {
      const value = doc.get("amount_paid_in_total");
      if (value === undefined || (value !== null && typeof value === "object")) continue;
      changes.push({
        path: doc.ref.path,
        reason: `amount_paid_in_total is a ${value === null ? "null" : typeof value}: reset to a map, original kept`,
        before: [image(doc)],
        write: (batch) => batch.update(doc.ref, {
          amount_paid_in_total: { naira: 0, kenyan_shillings: 0 },
          amount_paid_in_total_legacy: value,
        }),
      });
    }
    return changes;
  },

  // The old webhook stored whole Paystack payloads (card authorisation
  // included) on the user document, which every signed-in user can read.
  async paystackPayloads(db) {
    const changes = [];
    for (const doc of (await db.collection("users").get()).docs) {
      const paystack = doc.get("paystack");
      if (!paystack || typeof paystack !== "object") continue;
      const sensitive = Object.fromEntries(
        Object.entries(paystack).filter(([key]) => key === "charge_success" || key === "subscription_create")
      );
      if (Object.keys(sensitive).length === 0) continue;
      const removal = Object.fromEntries(Object.keys(sensitive).map((key) => [`paystack.${key}`, FieldValue.delete()]));
      const legacyRef = doc.ref.collection("private").doc("billing_legacy");
      changes.push({
        path: doc.ref.path,
        reason: `move raw Paystack payload (${Object.keys(sensitive).join(", ")}) off the readable profile`,
        before: [image(doc), image(await legacyRef.get())],
        write: (batch) => {
          batch.set(legacyRef, sensitive, { merge: true });
          batch.update(doc.ref, removal);
        },
      });
    }
    return changes;
  },

  // A camelCase flag one document picked up from the old premium job. The
  // apps read is_premium; this one is now a server-only key in the rules.
  async strayPremiumFlag(db) {
    const docs = (await db.collection("users").get()).docs.filter((doc) => "isPremium" in doc.data());
    return docs.map((doc) => ({
      path: doc.ref.path,
      reason: "remove stray isPremium field",
      before: [image(doc)],
      write: (batch) => batch.update(doc.ref, { isPremium: FieldValue.delete() }),
    }));
  },

  // Likes and dislikes with no target cannot be shown, matched or counted:
  // those are deleted. A dislike with real people on it but the wrong
  // document id is moved to the right id, because it still records who
  // passed on whom and deleting it would put that person back in the deck.
  // A like with the wrong id is only reported: saving it again would fire
  // "someone liked you" notifications and match checks for old activity.
  async malformedReactions(db) {
    const changes = [];
    for (const [collection, from, to] of [["likes", "liker_id", "liked_id"], ["dislikes", "disliker_id", "disliked_id"]]) {
      for (const doc of (await db.collection(collection).get()).docs) {
        const a = doc.get(from);
        const b = doc.get(to);
        const hasBoth = typeof a === "string" && a && typeof b === "string" && b;
        if (!hasBoth) {
          changes.push({
            path: doc.ref.path,
            reason: `no ${typeof b !== "string" || !b ? to : from}: deleted`,
            before: [image(doc)],
            write: (batch) => batch.delete(doc.ref),
          });
          continue;
        }
        const rightId = `${a}_${b}`;
        if (doc.id === rightId || collection === "likes") continue;

        const rightRef = db.collection(collection).doc(rightId);
        const right = await rightRef.get();
        changes.push({
          path: doc.ref.path,
          reason: right.exists
            ? `wrong id; ${rightId} already exists, so this duplicate is removed`
            : `wrong id: moved to ${rightId}`,
          before: [image(doc), image(right)],
          write: (batch) => {
            if (!right.exists) batch.set(rightRef, { ...doc.data(), uid: rightId });
            batch.delete(doc.ref);
          },
        });
      }
    }
    return changes;
  },

  // The chat list query filters on participants; a chat without it is
  // invisible to both people. The id is the two uids, so it can be rebuilt.
  async chatParticipants(db) {
    const changes = [];
    for (const doc of (await db.collection("chats").get()).docs) {
      if (Array.isArray(doc.get("participants")) || !PAIR_ID.test(doc.id)) continue;
      const participants = doc.id.split("_").sort();
      changes.push({
        path: doc.ref.path,
        reason: "rebuild missing participants from the chat id",
        before: [image(doc)],
        write: (batch) => batch.update(doc.ref, { participants }),
      });
    }
    return changes;
  },

  // Left behind by the old photo clean-up function, which did not clear its
  // queue when there was nothing to delete. A leftover entry stops the
  // clean-up ever firing again for that user.
  async stalePhotoQueue(db) {
    return (await db.collection("deletePicQueue").get()).docs.map((doc) => ({
      path: doc.ref.path,
      reason: "clear stale photo clean-up request",
      before: [image(doc)],
      write: (batch) => batch.delete(doc.ref),
    }));
  },
};

/** Things a person has to decide. Listed, never changed. */
async function report(db) {
  const users = (await db.collection("users").get()).docs;
  const lines = [];
  const add = (kind, docs, note) => docs.length && lines.push({ kind, count: docs.length, ids: docs.map((d) => d.id), note });

  const unreviewed = users.filter((d) => d.get("is_approved") === true && !d.get("face_verification.status") && d.get("face_verification.photo"));
  add("selfie_on_file_never_reviewed", unreviewed,
    "Review these in Retool through reviewVerification. No action needed from the user; they stay approved meanwhile.");
  add("paying_accounts_needing_verification",
    users.filter((d) => d.get("is_approved") === true && d.get("face_verification.status") !== "approved"
      && (d.get("is_premium") === true || (d.get("credit_balance") ?? 0) > 0)),
    "Review or contact these first: they have paid and lose liking and messaging if their approval ends.");
  add("likes_with_wrong_id",
    (await db.collection("likes").get()).docs.filter((d) => {
      const [a, b] = [d.get("liker_id"), d.get("liked_id")];
      return typeof a === "string" && a && typeof b === "string" && b && d.id !== `${a}_${b}`;
    }),
    "Left as they are: saving them again would send old 'someone liked you' notifications. The apps still show them by their liker_id and liked_id fields; they just do not count towards a match check by id.");
  add("premium_without_expiry", users.filter((d) => d.get("is_premium") === true && !d.get("premium_expires_at")),
    "Stays premium indefinitely: expirePremium only ends premium that has an expiry. Decide per account.");
  add("onboarded_short_of_photos", users.filter((d) => d.get("has_completed_onboarding") === true && (d.get("photos") ?? []).length < 2),
    "Will see the add-photos screen on next open.");
  add("profile_without_uid_field", users.filter((d) => d.get("uid") !== d.id),
    "Not matched by the apps' own-profile lookups. Probably a test document.");
  add("chat_with_unusable_id", (await db.collection("chats").get()).docs.filter((d) => !Array.isArray(d.get("participants")) && !PAIR_ID.test(d.id)),
    "Cannot be repaired from its id.");
  add("userchats_collection", (await db.collection("userchats").get()).docs, "No code reads or writes this collection.");
  return lines;
}

/**
 * Whether the script may write to where it is pointed. Returns a message to
 * refuse with, or null. Writing to a real project needs the project to be
 * known and named again on the command line, so a wrong credentials file or
 * a pasted command cannot reach production by accident.
 */
function refuseReason({ apply, emulated, projectId, confirmProject }) {
  if (!apply || emulated) return null;
  if (!projectId) return "Cannot tell which project these credentials are for, so will not write to it.";
  if (confirmProject !== projectId) return `Refusing to change a real project without --confirm-project=${projectId}.`;
  return null;
}

function openBackup(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  return fs.openSync(file, "a", 0o600);
}

async function run(db, { apply = false, only, backupFile, ...options } = {}, log = console.log) {
  if (apply && !backupFile) throw new Error("Refusing to apply without a backup file (--backup=<file>).");
  const fd = apply ? openBackup(backupFile) : null;
  const summary = {};
  try {
    for (const [step, plan] of Object.entries(STEPS)) {
      if (only ? !only.includes(step) : DEFERRED.has(step)) continue;
      const changes = await plan(db, options);
      summary[step] = changes.length;
      for (const change of changes) log(JSON.stringify({ step, applied: apply, path: change.path, reason: change.reason }));

      if (!apply || changes.length === 0) continue;

      // The backup is on disk before the first write of this step.
      for (const change of changes) {
        for (const before of change.before) {
          fs.writeSync(fd, JSON.stringify({ step, path: before.path, before: encode(before.data) }) + "\n");
        }
      }
      fs.fsyncSync(fd);

      // Batches of 200: a change can carry two writes and the limit is 500.
      for (let i = 0; i < changes.length; i += 200) {
        const batch = db.batch();
        changes.slice(i, i + 200).forEach((change) => change.write(batch));
        await batch.commit();
      }
    }
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
  return summary;
}

/** Puts every documented image back, newest first, and deletes what the repair created. */
async function restore(db, file, { apply = false } = {}, log = console.log) {
  const entries = fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)).reverse();
  for (const entry of entries) {
    log(JSON.stringify({ restore: true, applied: apply, path: entry.path, action: entry.before === null ? "delete" : "set" }));
  }
  if (apply) {
    for (let i = 0; i < entries.length; i += 400) {
      const batch = db.batch();
      for (const entry of entries.slice(i, i + 400)) {
        const ref = db.doc(entry.path);
        if (entry.before === null) batch.delete(ref);
        else batch.set(ref, decode(db, entry.before));
      }
      await batch.commit();
    }
  }
  return entries.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const app = admin.initializeApp();
  let projectId = app.options.projectId ?? process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
  // A service-account key names its own project; initializeApp() does not
  // surface that, so read it from the file.
  if (!projectId && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try { projectId = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8")).project_id; } catch { /* unreadable: left undefined */ }
  }
  const emulated = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  const refusal = refuseReason({ apply: args.apply, emulated, projectId, confirmProject: args.confirmProject });
  if (refusal) {
    console.error(refusal);
    process.exit(2);
  }

  const db = admin.firestore();
  console.error(`${args.apply ? "APPLYING to" : "Dry run against"} ${emulated ? "the emulator" : projectId ?? "an unknown project"}`);

  if (args.restore) {
    const count = await restore(db, args.restore, args);
    console.error(`\n${args.apply ? "Restored" : "Would restore"} ${count} document(s) from ${args.restore}`);
    await app.delete();
    return;
  }

  if (args.apply && !args.backupFile) {
    args.backupFile = path.join(os.homedir(), "whossy-repair-backups", `repair-${new Date().toISOString().replace(/[:.]/g, "-")}.ndjson`);
  }
  if (args.apply) console.error(`Backup file: ${args.backupFile}`);
  const summary = await run(db, args);
  console.error("\nChanges per step:", summary);
  console.error("\nNeeds a decision (not changed):");
  for (const line of await report(db)) console.error(" ", JSON.stringify(line));
  await app.delete();
}

if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { run, restore, report, refuseReason, STEPS };
