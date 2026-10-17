// Integration test for C5's cursor pagination on the `users` collection
// (useProfileFetcher.tsx's Discover/Online/New members/Looking to date
// branches, and SwipingAndMatching.tsx's deck fetch) — both paginate with
// plain limit()/startAfter() against `created_at`. This proves page 1 and
// page 2 don't overlap and exhaustion is reported correctly, the two
// invariants a broken cursor would violate silently.
//
// Requires: Java for the emulators. Run via `npm run test:triggers` from
// this directory, which wraps this in `firebase emulators:exec`.

const test = require("node:test");
const assert = require("node:assert/strict");
const admin = require("firebase-admin");

process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "whossy-app";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT }, "pagination-test");
const db = app.firestore();

const PAGE_SIZE = 24;

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
});

test("page 1 and page 2 don't overlap, and exhaustion is reported once the last page is short", async () => {
  const total = PAGE_SIZE + 10; // one full page, one partial page
  const batch = db.batch();
  for (let i = 0; i < total; i++) {
    const ref = db.collection("users").doc(`user${String(i).padStart(3, "0")}`);
    batch.set(ref, {
      has_completed_onboarding: true,
      gender: "Female",
      // Stagger by a second each so createdAt ordering is deterministic —
      // same-millisecond writes would make page boundaries nondeterministic.
      created_at: admin.firestore.Timestamp.fromMillis(1700000000000 + i * 1000),
    });
  }
  await batch.commit();

  const baseQuery = () =>
    db.collection("users")
      .where("has_completed_onboarding", "==", true)
      .where("gender", "==", "Female")
      .orderBy("created_at");

  const page1 = await baseQuery().limit(PAGE_SIZE).get();
  assert.equal(page1.docs.length, PAGE_SIZE, "first page should be full");

  const cursor = page1.docs[page1.docs.length - 1];
  const page2 = await baseQuery().startAfter(cursor).limit(PAGE_SIZE).get();
  assert.equal(page2.docs.length, total - PAGE_SIZE, "second page holds the remainder");
  assert.ok(page2.docs.length < PAGE_SIZE, "a short page signals exhaustion");

  const page1Ids = new Set(page1.docs.map((d) => d.id));
  const page2Ids = new Set(page2.docs.map((d) => d.id));
  const overlap = [...page1Ids].filter((id) => page2Ids.has(id));
  assert.deepEqual(overlap, [], "pages must not overlap");

  const cursor2 = page2.docs[page2.docs.length - 1];
  const page3 = await baseQuery().startAfter(cursor2).limit(PAGE_SIZE).get();
  assert.equal(page3.docs.length, 0, "no more pages once every profile has been returned");
});
