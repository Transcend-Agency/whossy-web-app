// Runs scripts/data-repair.cjs against the Firestore emulator on documents
// shaped like the ones the 2026-10-04 audit found in the live project.
//
// The fixtures are synthetic: no production export was available on the
// machine that wrote this, so this proves each repair on the shapes we know
// about, not that those are the only shapes in production. Run the script's
// dry run against the real project and read its log before applying it.

const test = require("node:test");
const assert = require("node:assert/strict");

process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "demo-whossy";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const admin = require("../functions/node_modules/firebase-admin");
const { run, report } = require("../scripts/data-repair.cjs");

const app = admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const db = app.firestore();
const PHOTOS = ["a.jpg", "b.jpg"];

const snapshotAll = async () => {
  const out = {};
  for (const col of await db.listCollections()) {
    for (const doc of (await col.get()).docs) out[doc.ref.path] = doc.data();
  }
  for (const doc of (await db.collectionGroup("private").get()).docs) out[doc.ref.path] = doc.data();
  return out;
};
const get = async (path) => (await db.doc(path).get()).data();
const quiet = () => {};

async function seed() {
  const docs = {
    // Healthy, modern account: nothing may change.
    "users/ok": { uid: "ok", is_approved: true, is_banned: false, is_premium: false, credit_balance: 12, credits_on_hold: 1,
      photos: PHOTOS, has_completed_onboarding: true, face_verification: { status: "approved", photo: "s.jpg", reviewed_by: "admin" },
      amount_paid_in_total: { naira: 500, kenyan_shillings: 0 }, paystack: { reference: "r1" } },
    // Pre-credits account with none of the server fields.
    "users/old": { uid: "old", is_approved: false, photos: PHOTOS, has_completed_onboarding: true },
    // Approved from the dashboard: selfie on file, never reviewed.
    "users/legacyApproved": { uid: "legacyApproved", is_approved: true, is_banned: false, is_premium: false, credit_balance: 40, credits_on_hold: 0,
      photos: PHOTOS, has_completed_onboarding: true, face_verification: { retake_photo: false, photo: "s.jpg" } },
    // Approved with no verification record at all.
    "users/approvedNoSelfie": { uid: "approvedNoSelfie", is_approved: true, is_banned: false, is_premium: false, credit_balance: 0, credits_on_hold: 0, photos: PHOTOS },
    "users/badAmountString": { uid: "badAmountString", ...base(), amount_paid_in_total: "5000" },
    "users/badAmountNumber": { uid: "badAmountNumber", ...base(), amount_paid_in_total: 300 },
    "users/rawPayload": { uid: "rawPayload", ...base(), is_premium: true,
      paystack: { reference: "r2", charge_success: { authorization: { authorization_code: "AUTH_x" } }, subscription_create: { email_token: "tok" } } },
    "users/stray": { uid: "stray", ...base(), isPremium: false },
    "users/shortPhotos": { uid: "shortPhotos", ...base(), has_completed_onboarding: true, photos: ["a.jpg"] },
    "users/noUidField": { email: "x@example.test" },

    "likes/a_b": { liker_id: "a", liked_id: "b" },
    "likes/a_null": { liker_id: "a", liked_id: null },
    "likes/random-id": { liker_id: "a", liked_id: "c" },
    "dislikes/a_b": { disliker_id: "a", disliked_id: "b" },
    "dislikes/a_": { disliker_id: "a", disliked_id: null },

    "chats/bob_alice": { last_message: "hi" },
    "chats/alice_carol": { participants: ["carol", "alice"], last_message: "yo" },
    "chats/notapair": { last_message: "?" },

    "deletePicQueue/old": { uid: "old" },
    "userchats/x": { chats: [] },
  };
  await Promise.all(Object.entries(docs).map(([path, data]) => db.doc(path).set(data)));
}
function base() {
  return { is_approved: false, is_banned: false, is_premium: false, credit_balance: 0, credits_on_hold: 0, photos: PHOTOS };
}

test.after(() => app.delete());

test.beforeEach(async () => {
  for (const col of await db.listCollections()) {
    await Promise.all((await col.listDocuments()).map((d) => db.recursiveDelete(d)));
  }
  await seed();
});

test("a dry run reports the changes and writes nothing", async () => {
  const before = await snapshotAll();
  const summary = await run(db, { apply: false }, quiet);

  assert.deepEqual(await snapshotAll(), before);
  assert.deepEqual(summary, {
    defaults: 2, legacyApproval: 2, amountPaidShape: 2, paystackPayloads: 1,
    strayPremiumFlag: 1, malformedReactions: 3, chatParticipants: 1, stalePhotoQueue: 1,
  });
});

test("applying repairs each known shape and leaves a healthy account untouched", async () => {
  const healthyBefore = await get("users/ok");
  await run(db, { apply: true }, quiet);

  assert.deepEqual(await get("users/ok"), healthyBefore);

  const old = await get("users/old");
  assert.deepEqual([old.is_banned, old.is_premium, old.credit_balance, old.credits_on_hold], [false, false, 0, 0]);

  const legacy = await get("users/legacyApproved");
  assert.equal(legacy.is_approved, false);
  assert.equal(legacy.face_verification.status, "revoked");
  assert.equal(legacy.face_verification.photo, "s.jpg");
  assert.equal(legacy.credit_balance, 40); // a real balance is never touched
  const noSelfie = await get("users/approvedNoSelfie");
  assert.equal(noSelfie.is_approved, false);
  assert.equal("face_verification" in noSelfie, false);

  const s = await get("users/badAmountString");
  assert.deepEqual(s.amount_paid_in_total, { naira: 0, kenyan_shillings: 0 });
  assert.equal(s.amount_paid_in_total_legacy, "5000");
  assert.equal((await get("users/badAmountNumber")).amount_paid_in_total_legacy, 300);

  const raw = await get("users/rawPayload");
  assert.deepEqual(raw.paystack, { reference: "r2" });
  assert.equal(raw.is_premium, true);
  const moved = await get("users/rawPayload/private/billing_legacy");
  assert.equal(moved.charge_success.authorization.authorization_code, "AUTH_x");
  assert.equal(moved.subscription_create.email_token, "tok");

  assert.equal("isPremium" in (await get("users/stray")), false);

  assert.ok(await get("likes/a_b"));
  assert.ok(await get("dislikes/a_b"));
  for (const gone of ["likes/a_null", "likes/random-id", "dislikes/a_"]) assert.equal(await get(gone), undefined, gone);

  assert.deepEqual((await get("chats/bob_alice")).participants, ["alice", "bob"]);
  assert.deepEqual((await get("chats/alice_carol")).participants, ["carol", "alice"]); // already had one: left as is
  assert.equal("participants" in (await get("chats/notapair")), false);

  assert.equal(await get("deletePicQueue/old"), undefined);
});

test("a second run finds nothing left to do", async () => {
  await run(db, { apply: true }, quiet);
  const after = await snapshotAll();

  const summary = await run(db, { apply: true }, quiet);

  assert.deepEqual(Object.values(summary).filter((n) => n !== 0), []);
  assert.deepEqual(await snapshotAll(), after);
});

test("--only limits the run to the named steps", async () => {
  await run(db, { apply: true, only: ["stalePhotoQueue"] }, quiet);
  assert.equal(await get("deletePicQueue/old"), undefined);
  assert.equal((await get("users/legacyApproved")).is_approved, true);
});

test("the report lists what needs a human decision and changes nothing", async () => {
  const before = await snapshotAll();
  const kinds = Object.fromEntries((await report(db)).map((line) => [line.kind, line.ids.sort()]));

  assert.deepEqual(kinds.premium_without_expiry, ["rawPayload"]);
  assert.deepEqual(kinds.onboarded_short_of_photos, ["shortPhotos"]);
  assert.deepEqual(kinds.profile_without_uid_field, ["noUidField"]);
  assert.deepEqual(kinds.chat_with_unusable_id, ["notapair"]);
  assert.deepEqual(kinds.userchats_collection, ["x"]);
  assert.deepEqual(await snapshotAll(), before);
});
