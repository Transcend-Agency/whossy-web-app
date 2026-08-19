// Integration test for the C1 presence mirror (functions/src/presence.ts),
// run against the Realtime Database + Firestore + Functions emulators with
// the real compiled function loaded. Presence writes go to RTDB
// `users/{uid}/presence`; every read site expects a Firestore `status`
// field. Nothing bridged the two before this trigger — this proves the
// bridge actually fires and writes the shape both apps read.
//
// Requires: `npm run build` in functions/ first (this reads functions/lib),
// and Java for the emulators. Run via `npm run test:triggers` from this
// directory, which wraps this in `firebase emulators:exec`.

const test = require("node:test");
const assert = require("node:assert/strict");
const admin = require("firebase-admin");

process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "whossy-app";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_DATABASE_EMULATOR_HOST =
  process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";

const app = admin.initializeApp({
  projectId: process.env.GCLOUD_PROJECT,
  databaseURL: `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=${process.env.GCLOUD_PROJECT}-default-rtdb`,
});
const db = app.firestore();
const rtdb = app.database();

async function waitFor(fn, { timeoutMs = 15000, intervalMs = 250 } = {}) {
  const start = Date.now();
  for (;;) {
    const result = await fn();
    if (result) return result;
    if (Date.now() - start > timeoutMs) throw new Error("waitFor: timed out");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function statusFor(uid) {
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists ? snap.data().status ?? null : null;
}

// See notifications.test.js — without closing the app explicitly, node
// --test hangs after all tests pass instead of exiting.
test.after(async () => {
  await app.delete();
});

test.beforeEach(async () => {
  const collections = await db.listCollections();
  for (const col of collections) {
    const docs = await col.listDocuments();
    await Promise.all(docs.map((d) => db.recursiveDelete(d)));
  }
  await rtdb.ref("users").remove();
});

test("going online in RTDB mirrors a numeric-lastSeen status onto the Firestore user doc", async () => {
  const lastSeen = Date.now();
  await rtdb.ref("users/marge/presence").set({ online: true, lastSeen });

  const status = await waitFor(async () => {
    const s = await statusFor("marge");
    return s ?? null;
  });

  assert.equal(status.online, true);
  assert.equal(typeof status.lastSeen, "number");
  assert.equal(status.lastSeen, lastSeen);
});

test("disconnecting flips the mirrored status to offline", async () => {
  await rtdb.ref("users/homer/presence").set({ online: true, lastSeen: Date.now() });
  await waitFor(async () => (await statusFor("homer"))?.online === true ? true : null);

  const offlineAt = Date.now();
  await rtdb.ref("users/homer/presence").set({ online: false, lastSeen: offlineAt });

  const status = await waitFor(async () => {
    const s = await statusFor("homer");
    return s && s.online === false ? s : null;
  });

  assert.equal(status.online, false);
  assert.equal(status.lastSeen, offlineAt);
});
