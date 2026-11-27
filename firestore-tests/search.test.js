// Tests for global name search (functions/src/search.ts): the trigger that
// keeps users/{uid}.search_prefixes in step with the name, and the
// searchUsers callable with its visibility rules and rate limit.
//
// The callable is invoked directly from the compiled code; the trigger is
// fired by writing to the emulator and waiting for the functions emulator.
//
// Run via `npm run test:server` (builds functions/ first, needs Java).

const test = require("node:test");
const assert = require("node:assert/strict");

const PROJECT = process.env.GCLOUD_PROJECT || "demo-whossy";
process.env.GCLOUD_PROJECT = PROJECT;
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= "127.0.0.1:9000";
process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= "127.0.0.1:9199";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
process.env.PAYSTACK_SECRET_KEY ||= "sk_test_emulator_only";
process.env.NOMBA_CLIENT_SECRET ||= "emulator_only";
process.env.VERIFICATION_REVIEW_SECRET ||= "emulator_only";
process.env.APP_FRONTEND_URL ||= "http://localhost:5173";
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: PROJECT,
  storageBucket: `${PROJECT}.appspot.com`,
  databaseURL: `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=${PROJECT}-default-rtdb`,
});

const fns = require("../functions/lib/index.js");
const { SEARCHES_PER_MINUTE } = require("../functions/lib/search.js");
const admin = require("../functions/node_modules/firebase-admin");
const db = admin.firestore();
const { Timestamp } = admin.firestore;

async function waitFor(fn, { timeoutMs = 20000, intervalMs = 250 } = {}) {
  const start = Date.now();
  for (;;) {
    const result = await fn();
    if (result) return result;
    if (Date.now() - start > timeoutMs) throw new Error("waitFor: timed out");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
const settle = (ms = 3000) => new Promise((r) => setTimeout(r, ms));

const VISIBLE = {
  is_approved: true, is_banned: false, has_completed_onboarding: true,
  photos: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
  user_settings: { public_search: true }, blockedIds: [],
};
const user = async (uid) => (await db.collection("users").doc(uid).get()).data();

/** Seeds a profile and waits for the trigger to index its name. */
async function seedIndexed(uid, data = {}) {
  await db.collection("users").doc(uid).set({ uid, ...VISIBLE, ...data });
  await waitFor(async () => Array.isArray((await user(uid))?.search_prefixes));
}

const search = (uid, query) => fns.searchUsers.run({ auth: { uid, token: {} }, data: { query } });
const uidsFor = async (uid, query) => (await search(uid, query)).results.map((r) => r.uid);

test.after(async () => {
  await admin.app().delete();
});

test.beforeEach(async () => {
  for (const col of await db.listCollections()) {
    await Promise.all((await col.listDocuments()).map((d) => db.recursiveDelete(d)));
  }
  // Deleting user documents fires cleanUpUserData; let it finish before the
  // next test reuses the ids.
  await settle();
});

// ------------------------------------------------------------ the index

test("the trigger indexes the first and last name and follows a rename", async () => {
  await seedIndexed("u1", { first_name: "Adaeze", last_name: "Obi" });
  assert.deepEqual((await user("u1")).search_prefixes, ["ad", "ada", "adae", "adaez", "adaeze", "ob", "obi"]);

  await db.doc("users/u1").update({ first_name: "Émeka" });
  const renamed = await waitFor(async () => {
    const p = (await user("u1")).search_prefixes;
    return p.includes("em") ? p : null;
  });
  assert.deepEqual(renamed, ["em", "eme", "emek", "emeka", "ob", "obi"]);
});

// ------------------------------------------------------------ searchUsers

test("finds people by first name, last name or both, in any order, without exposing the last name", async () => {
  await seedIndexed("me", { first_name: "Searcher" });
  await seedIndexed("ada", {
    first_name: "Adaeze", last_name: "Obi",
    date_of_birth: Timestamp.fromDate(new Date(Date.UTC(1995, 0, 1))),
  });
  await seedIndexed("other", { first_name: "Tunde", last_name: "Bello" });

  assert.deepEqual(await uidsFor("me", "ada"), ["ada"]);
  assert.deepEqual(await uidsFor("me", "OBI"), ["ada"]);
  assert.deepEqual(await uidsFor("me", "obi adae"), ["ada"]);
  assert.deepEqual(await uidsFor("me", "ada bello"), []);

  const [hit] = (await search("me", "adaeze")).results;
  assert.deepEqual(Object.keys(hit).sort(), ["age", "first_name", "photo", "uid"]);
  assert.equal(hit.first_name, "Adaeze");
  assert.equal(hit.photo, "https://example.com/a.jpg");
  assert.ok(hit.age >= 30 && hit.age <= 32, `age was ${hit.age}`);
});

test("leaves out the searcher, hidden, banned, unapproved, unfinished and blocked profiles", async () => {
  await seedIndexed("me", { first_name: "Kemi Searcher", blockedIds: ["iblocked"] });
  await seedIndexed("visible", { first_name: "Kemi" });
  await seedIndexed("noSetting", { first_name: "Kemi", user_settings: {} });
  await seedIndexed("hidden", { first_name: "Kemi", user_settings: { public_search: false } });
  await seedIndexed("banned", { first_name: "Kemi", is_banned: true });
  await seedIndexed("unapproved", { first_name: "Kemi", is_approved: false });
  await seedIndexed("unfinished", { first_name: "Kemi", has_completed_onboarding: false });
  await seedIndexed("iblocked", { first_name: "Kemi" });
  await seedIndexed("blockedme", { first_name: "Kemi", blockedIds: ["me"] });

  assert.deepEqual((await uidsFor("me", "kemi")).sort(), ["noSetting", "visible"]);
});

test("ranks a whole first-name match first, then first-name prefixes, then last names", async () => {
  await seedIndexed("me", { first_name: "Searcher" });
  await seedIndexed("surname", { first_name: "Zara", last_name: "Adams" });
  await seedIndexed("prefix", { first_name: "Adaeze" });
  await seedIndexed("exact", { first_name: "Ada" });

  assert.deepEqual(await uidsFor("me", "ada"), ["exact", "prefix", "surname"]);
});

test("rejects signed-out callers, too-short or too-long queries, and banned or unknown searchers", async () => {
  await seedIndexed("me", { first_name: "Searcher" });
  await seedIndexed("bad", { first_name: "Bad", is_banned: true });

  await assert.rejects(fns.searchUsers.run({ auth: undefined, data: { query: "ada" } }), /Sign in/);
  await assert.rejects(search("me", "a"), /at least 2 letters/);
  await assert.rejects(search("me", " - "), /at least 2 letters/);
  await assert.rejects(search("me", "x".repeat(61)), /up to 60/);
  await assert.rejects(search("me", 42), /up to 60/);
  await assert.rejects(search("bad", "ada"), /can't search/);
  await assert.rejects(search("ghost", "ada"), /Finish setting up/);
});

test("rate-limits each account per minute and resets after the window", async () => {
  await seedIndexed("me", { first_name: "Searcher" });
  const rate = db.doc("users/me/private/search_rate");

  await rate.set({ minute_start: Date.now(), minute_count: SEARCHES_PER_MINUTE, day_start: Date.now(), day_count: SEARCHES_PER_MINUTE });
  await assert.rejects(search("me", "ada"), /Too many searches/);

  await rate.set({ minute_start: Date.now() - 61_000, minute_count: SEARCHES_PER_MINUTE, day_start: Date.now(), day_count: SEARCHES_PER_MINUTE });
  await search("me", "ada");
  const after = (await rate.get()).data();
  assert.equal(after.minute_count, 1);
  assert.equal(after.day_count, SEARCHES_PER_MINUTE + 1);
});
