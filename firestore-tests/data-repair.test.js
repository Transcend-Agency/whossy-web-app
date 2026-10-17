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

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const admin = require("../functions/node_modules/firebase-admin");
const { run, restore, report, refuseReason, STEPS } = require("../scripts/data-repair.cjs");
const { Timestamp, GeoPoint } = admin.firestore;
const ALL_STEPS = Object.keys(STEPS);
const backupPath = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "repair-test-")), "backup.ndjson");

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
    // Carries a Timestamp and a GeoPoint so the backup has to round-trip them.
    "users/old": { uid: "old", is_approved: false, photos: PHOTOS, has_completed_onboarding: true,
      created_at: Timestamp.fromMillis(1700000000123), location: new GeoPoint(6.5, 3.3) },
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
    // Real people, wrong document id: moved, not deleted.
    "dislikes/random-dislike": { uid: "random-dislike", disliker_id: "a", disliked_id: "c", timestamp: "2026-01-01" },
    // Wrong id, but the right one already exists: the duplicate is dropped.
    "dislikes/dup": { disliker_id: "a", disliked_id: "b" },

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
  const everything = await run(db, { apply: false, only: ALL_STEPS }, quiet);

  assert.deepEqual(await snapshotAll(), before);
  // The two deferred steps are left out unless asked for by name.
  assert.deepEqual(summary, {
    defaults: 2, amountPaidShape: 2,
    strayPremiumFlag: 1, malformedReactions: 4, chatParticipants: 1, stalePhotoQueue: 1,
  });
  assert.equal(everything.reverifyDeadline, 1);
  assert.equal(everything.paystackPayloads, 1);
});

test("applying repairs each known shape and leaves a healthy account untouched", async () => {
  const healthyBefore = await get("users/ok");
  await run(db, { apply: true, only: ALL_STEPS, backupFile: backupPath() }, quiet);

  assert.deepEqual(await get("users/ok"), healthyBefore);

  const old = await get("users/old");
  assert.deepEqual([old.is_banned, old.is_premium, old.credit_balance, old.credits_on_hold], [false, false, 0, 0]);

  // Selfie on file, never reviewed: untouched, left for a reviewer.
  const legacy = await get("users/legacyApproved");
  assert.equal(legacy.is_approved, true);
  assert.equal("reverify_by" in legacy, false);
  assert.equal("status" in legacy.face_verification, false);
  // No selfie at all: still approved, with about 14 days to verify.
  const noSelfie = await get("users/approvedNoSelfie");
  assert.equal(noSelfie.is_approved, true);
  const daysLeft = (noSelfie.reverify_by.toMillis() - Date.now()) / 86400000;
  assert.ok(daysLeft > 13.9 && daysLeft <= 14, `deadline was ${daysLeft} days out`);
  assert.equal((await get("users/ok")).reverify_by, undefined);

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
  // Deleted: no target at all.
  for (const gone of ["likes/a_null", "dislikes/a_"]) assert.equal(await get(gone), undefined, gone);
  // A like with the wrong id is left alone (saving it again would notify people).
  assert.deepEqual(await get("likes/random-id"), { liker_id: "a", liked_id: "c" });
  // A dislike with the wrong id keeps its meaning under the right one.
  assert.equal(await get("dislikes/random-dislike"), undefined);
  assert.deepEqual(await get("dislikes/a_c"), { uid: "a_c", disliker_id: "a", disliked_id: "c", timestamp: "2026-01-01" });
  // A duplicate of an existing dislike just goes.
  assert.equal(await get("dislikes/dup"), undefined);
  assert.deepEqual(await get("dislikes/a_b"), { disliker_id: "a", disliked_id: "b" });

  assert.deepEqual((await get("chats/bob_alice")).participants, ["alice", "bob"]);
  assert.deepEqual((await get("chats/alice_carol")).participants, ["carol", "alice"]); // already had one: left as is
  assert.equal("participants" in (await get("chats/notapair")), false);

  assert.equal(await get("deletePicQueue/old"), undefined);
});

test("a second run finds nothing left to do", async () => {
  await run(db, { apply: true, only: ALL_STEPS, backupFile: backupPath() }, quiet);
  const after = await snapshotAll();

  const summary = await run(db, { apply: true, only: ALL_STEPS, backupFile: backupPath() }, quiet);

  assert.deepEqual(Object.values(summary).filter((n) => n !== 0), []);
  assert.deepEqual(await snapshotAll(), after);
});

test("--only limits the run to the named steps", async () => {
  await run(db, { apply: true, only: ["stalePhotoQueue"], backupFile: backupPath() }, quiet);
  assert.equal(await get("deletePicQueue/old"), undefined);
  assert.equal("reverify_by" in (await get("users/approvedNoSelfie")), false);
});

test("the grace period is configurable", async () => {
  await run(db, { apply: true, only: ["reverifyDeadline"], graceDays: 3, backupFile: backupPath() }, quiet);
  const daysLeft = ((await get("users/approvedNoSelfie")).reverify_by.toMillis() - Date.now()) / 86400000;
  assert.ok(daysLeft > 2.9 && daysLeft <= 3);
});

test("the report lists what needs a human decision and changes nothing", async () => {
  const before = await snapshotAll();
  const kinds = Object.fromEntries((await report(db)).map((line) => [line.kind, line.ids.sort()]));

  assert.deepEqual(kinds.selfie_on_file_never_reviewed, ["legacyApproved"]);
  assert.deepEqual(kinds.paying_accounts_needing_verification, ["legacyApproved"]);
  assert.deepEqual(kinds.premium_without_expiry, ["rawPayload"]);
  assert.deepEqual(kinds.onboarded_short_of_photos, ["shortPhotos"]);
  assert.deepEqual(kinds.profile_without_uid_field, ["noUidField"]);
  assert.deepEqual(kinds.chat_with_unusable_id, ["notapair"]);
  assert.deepEqual(kinds.userchats_collection, ["x"]);
  assert.deepEqual(kinds.likes_with_wrong_id, ["random-id"]);
  assert.deepEqual(await snapshotAll(), before);
});

test("without --only, the two deferred steps do not run even when applying", async () => {
  const summary = await run(db, { apply: true, backupFile: backupPath() }, quiet);

  assert.equal("paystackPayloads" in summary, false);
  assert.equal("reverifyDeadline" in summary, false);
  assert.ok((await get("users/rawPayload")).paystack.charge_success);
  assert.equal("reverify_by" in (await get("users/approvedNoSelfie")), false);
});

test("applying without a backup file refuses to start and writes nothing", async () => {
  const before = await snapshotAll();
  await assert.rejects(run(db, { apply: true }, quiet), /without a backup file/);
  assert.deepEqual(await snapshotAll(), before);
});

test("the backup holds the current content of every document touched, readable only by its owner", async () => {
  const file = backupPath();
  await run(db, { apply: true, only: ALL_STEPS, backupFile: file }, quiet);

  const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const byPath = Object.fromEntries(lines.map((l) => [l.path, l.before]));

  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  // What a document looked like before, including a type JSON would flatten.
  assert.equal(byPath["users/old"].is_banned, undefined);
  assert.deepEqual(byPath["users/old"].created_at, { __ts: [1700000000, 123000000] });
  assert.deepEqual(byPath["users/old"].location, { __geo: [6.5, 3.3] });
  // A document that did not exist yet is recorded as such, so restore can delete it.
  assert.equal(byPath["users/rawPayload/private/billing_legacy"], null);
  assert.equal(byPath["dislikes/a_c"], null);
  assert.deepEqual(byPath["dislikes/random-dislike"].disliked_id, "c");
});

test("restoring from the backup puts everything back exactly, including created documents", async () => {
  const original = await snapshotAll();
  const file = backupPath();
  await run(db, { apply: true, only: ALL_STEPS, backupFile: file }, quiet);
  assert.notDeepEqual(await snapshotAll(), original);

  const dry = await restore(db, file, { apply: false }, quiet);
  assert.ok(dry > 0);
  assert.notDeepEqual(await snapshotAll(), original); // a dry restore changes nothing

  await restore(db, file, { apply: true }, quiet);
  assert.deepEqual(await snapshotAll(), original);
  const old = await get("users/old");
  assert.ok(old.created_at instanceof Timestamp && old.created_at.toMillis() === 1700000000123);
  assert.ok(old.location instanceof GeoPoint && old.location.latitude === 6.5);
});

test("the script only writes to a real project when it knows which one and is told its name again", () => {
  const real = { apply: true, emulated: false, projectId: "whossy-app" };
  assert.match(refuseReason({ ...real, confirmProject: undefined }), /--confirm-project=whossy-app/);
  assert.match(refuseReason({ ...real, confirmProject: "some-other-project" }), /--confirm-project=whossy-app/);
  // Not knowing the project must not pass just because nothing was typed either.
  assert.match(refuseReason({ apply: true, emulated: false, projectId: undefined, confirmProject: undefined }), /Cannot tell which project/);
  assert.equal(refuseReason({ ...real, confirmProject: "whossy-app" }), null);
  // Reading is always allowed, and so is writing to the emulator.
  assert.equal(refuseReason({ apply: false, emulated: false, projectId: undefined }), null);
  assert.equal(refuseReason({ apply: true, emulated: true, projectId: undefined }), null);
});
