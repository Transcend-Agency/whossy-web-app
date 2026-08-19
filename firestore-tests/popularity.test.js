// Integration tests for the C2 "Popular in my area" backend
// (functions/src/popularity.ts): a new like increments the liked user's
// rolling 30-day score exactly once, and the daily sweep ages out
// contributions older than the window while leaving fresh ones alone.
//
// Requires: `npm run build` in functions/ first (this reads functions/lib),
// and Java for the emulators. Run via `npm run test:triggers` from this
// directory, which wraps this in `firebase emulators:exec`.

const test = require("node:test");
const assert = require("node:assert/strict");
const admin = require("firebase-admin");

process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "whossy-app";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const db = app.firestore();

async function waitFor(fn, { timeoutMs = 15000, intervalMs = 250 } = {}) {
  const start = Date.now();
  for (;;) {
    const result = await fn();
    if (result) return result;
    if (Date.now() - start > timeoutMs) throw new Error("waitFor: timed out");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function popularityFor(uid) {
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists ? snap.data().popularity_score_30d ?? 0 : 0;
}

async function seedUser(uid, data = {}) {
  await db.collection("users").doc(uid).set({ first_name: "Test", photos: [], ...data });
}

test.beforeEach(async () => {
  const collections = await db.listCollections();
  for (const col of collections) {
    const docs = await col.listDocuments();
    await Promise.all(docs.map((d) => db.recursiveDelete(d)));
  }
});

test("a new like increments the liked user's popularity score exactly once", async () => {
  await seedUser("nina");
  await seedUser("oscar");

  await db.collection("likes").doc("nina_oscar").set({
    liker_id: "nina", liked_id: "oscar", timestamp: Date.now(),
  });

  const score = await waitFor(async () => {
    const s = await popularityFor("oscar");
    return s > 0 ? s : null;
  });
  assert.equal(score, 1);

  const ledgerDocs = await db
    .collection("users").doc("oscar").collection("popularity_ledger").get();
  assert.equal(ledgerDocs.size, 1);
  assert.equal(ledgerDocs.docs[0].id, "nina_oscar");
});

test("pruning removes contributions older than 30 days and decrements the score", async () => {
  await seedUser("paul", { popularity_score_30d: 2 });

  const staleTimestamp = admin.firestore.Timestamp.fromMillis(
    Date.now() - 31 * 24 * 60 * 60 * 1000
  );
  const freshTimestamp = admin.firestore.Timestamp.now();

  const ledger = db.collection("users").doc("paul").collection("popularity_ledger");
  await ledger.doc("stale_like").set({ timestamp: staleTimestamp });
  await ledger.doc("fresh_like").set({ timestamp: freshTimestamp });

  // The Functions emulator exposes onSchedule functions as a manually
  // invokable HTTPS endpoint precisely for this (see Firebase's "Trigger
  // scheduled functions" docs) — this actually runs prunePopularityScores
  // rather than just asserting the query it's built on.
  const functionsHost = process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1:5001";
  const region = process.env.FUNCTIONS_REGION || "us-central1";
  const res = await fetch(
    `http://${functionsHost}/${process.env.GCLOUD_PROJECT}/${region}/prunePopularityScores`,
    { method: "POST" }
  );
  assert.ok(res.ok, `manual trigger failed: ${res.status} ${await res.text()}`);

  const score = await waitFor(async () => {
    const s = await popularityFor("paul");
    return s === 1 ? s : null;
  });
  assert.equal(score, 1, "stale contribution should be pruned, fresh one kept");

  assert.equal((await ledger.doc("stale_like").get()).exists, false);
  assert.equal((await ledger.doc("fresh_like").get()).exists, true);
});
