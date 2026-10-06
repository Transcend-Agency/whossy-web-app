// Tests for the server-side rebuild (plan section 3 and the functions that
// replace the unsourced deployed ones): account deletion, chat gating, the
// match trigger, message status, storage clean-up and the presence guard.
//
// Callables are invoked directly from the compiled code; triggers are fired
// by writing to the emulators and waiting for the functions emulator to act.
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
process.env.APP_FRONTEND_URL ||= "http://localhost:5173";
// What a deployed function is given; the Admin SDK reads the default bucket
// and database from it.
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: PROJECT,
  storageBucket: `${PROJECT}.appspot.com`,
  databaseURL: `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=${PROJECT}-default-rtdb`,
});

const fns = require("../functions/lib/index.js");
const admin = require("../functions/node_modules/firebase-admin");
const db = admin.firestore();
const bucket = admin.storage().bucket();
const rtdb = admin.database();

async function waitFor(fn, { timeoutMs = 20000, intervalMs = 250 } = {}) {
  const start = Date.now();
  for (;;) {
    const result = await fn();
    if (result) return result;
    if (Date.now() - start > timeoutMs) throw new Error("waitFor: timed out");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
const settle = (ms = 4000) => new Promise((r) => setTimeout(r, ms));

const VERIFIED = { is_approved: true, is_banned: false, is_premium: false, credit_balance: 3, credits_on_hold: 0, blockedIds: [] };
const seedUser = (uid, data = {}) => db.collection("users").doc(uid).set({ uid, first_name: uid, photos: [], ...VERIFIED, ...data });
const user = async (uid) => (await db.collection("users").doc(uid).get()).data();
const exists = async (path) => (await db.doc(path).get()).exists;
const callAs = (uid, authTime = Math.floor(Date.now() / 1000)) => ({ auth: { uid, token: { auth_time: authTime } } });
const upload = (path) => bucket.file(path).save("x", { contentType: "image/jpeg" });
const filesUnder = async (prefix) => (await bucket.getFiles({ prefix }))[0].map((f) => f.name);

test.after(async () => {
  await admin.app().delete();
});

test.beforeEach(async () => {
  for (const col of await db.listCollections()) {
    await Promise.all((await col.listDocuments()).map((d) => db.recursiveDelete(d)));
  }
  await bucket.deleteFiles({ force: true });
  await rtdb.ref("users").remove();
  const { users } = await admin.auth().listUsers();
  await Promise.all(users.map((u) => admin.auth().deleteUser(u.uid)));
  // Clearing user documents fires cleanUpUserData for each of them in the
  // functions emulator. Let those purges finish before the next test seeds
  // users with the same ids, or a late purge deletes the new test's data.
  await settle(3000);
});

// ------------------------------------------------------------ deleteAccount

test("deleteAccount removes everything tied to the user and refunds a hold placed on them", async () => {
  await admin.auth().createUser({ uid: "alice" });
  await seedUser("alice");
  await seedUser("bob", { credit_balance: 2, credits_on_hold: 1 });
  await seedUser("carol");

  await db.doc("users/alice/notifications/n1").set({ title: "Like" });
  await db.doc("users/alice/private/billing").set({ paystack_customer_code: "CUS_a" });
  await db.doc("paystack_customers/CUS_a").set({ uid: "alice" });
  await db.doc("likes/alice_bob").set({ liker_id: "alice", liked_id: "bob" });
  await db.doc("likes/bob_alice").set({ liker_id: "bob", liked_id: "alice" });
  await db.doc("likes/bob_carol").set({ liker_id: "bob", liked_id: "carol" });
  await db.doc("dislikes/alice_carol").set({ disliker_id: "alice", disliked_id: "carol" });
  await db.doc("dislikes/carol_alice").set({ disliker_id: "carol", disliked_id: "alice" });
  await db.doc("matches/legacy_id").set({ user1_id: "bob", user2_id: "alice" });
  await db.doc("filters/alice").set({ meet: 1 });
  await db.doc("advancedSearchPreferences/alice").set({ country: "NG" });
  await db.doc("userReports/r1").set({ reporterId: "alice", reportedId: "bob" });
  await db.doc("userReports/r2").set({ reporterId: "bob", reportedId: "alice" });
  await db.doc("payments/ref1").set({ uid: "alice", status: "completed" });
  // Bob started a chat with Alice and has a credit on hold for her reply.
  await db.doc("chats/alice_bob").set({ participants: ["alice", "bob"], credit_status: "pending", credit_held: true, initiator_id: "bob" });
  await db.doc("chats/alice_bob/messages/m1").set({ sender_id: "bob", message: "hi" });
  await db.doc("chats/bob_carol").set({ participants: ["bob", "carol"] });
  await upload("users/alice/profile_pictures/a.jpg");
  await upload("users/alice/face_verification/selfie.png");
  await upload("users/bob/profile_pictures/b.jpg");
  await rtdb.ref("users/alice/presence").set({ online: true, lastSeen: 1 });

  const out = await fns.deleteAccount.run(callAs("alice"));
  assert.equal(out.status, "deleted");

  for (const gone of [
    "users/alice", "users/alice/notifications/n1", "users/alice/private/billing", "paystack_customers/CUS_a",
    "likes/alice_bob", "likes/bob_alice", "dislikes/alice_carol", "dislikes/carol_alice", "matches/legacy_id",
    "filters/alice", "advancedSearchPreferences/alice", "userReports/r1",
    "chats/alice_bob", "chats/alice_bob/messages/m1",
  ]) {
    assert.equal(await exists(gone), false, `${gone} should be deleted`);
  }
  for (const kept of ["users/bob", "likes/bob_carol", "chats/bob_carol", "userReports/r2", "payments/ref1"]) {
    assert.equal(await exists(kept), true, `${kept} should be kept`);
  }
  assert.deepEqual(await filesUnder("users/alice/"), []);
  assert.deepEqual(await filesUnder("users/bob/"), ["users/bob/profile_pictures/b.jpg"]);
  assert.equal((await rtdb.ref("users/alice").get()).exists(), false);
  await assert.rejects(admin.auth().getUser("alice"), /no user record/i);
  assert.equal((await user("bob")).credits_on_hold, 0);
  assert.equal((await user("bob")).credit_balance, 2);
});

test("deleteAccount refuses a session that did not sign in recently, and deletes nothing", async () => {
  await admin.auth().createUser({ uid: "alice" });
  await seedUser("alice");
  const anHourAgo = Math.floor(Date.now() / 1000) - 3600;

  await assert.rejects(fns.deleteAccount.run(callAs("alice", anHourAgo)), /RECENT_LOGIN_REQUIRED/);
  await assert.rejects(fns.deleteAccount.run({ auth: undefined }), /Sign in/);

  assert.equal(await exists("users/alice"), true);
  assert.equal((await admin.auth().getUser("alice")).uid, "alice");
});

test("a late purge does not delete a profile recreated under the same uid", async () => {
  await seedUser("phoenix");
  await db.doc("users/phoenix/notifications/n1").set({ title: "old" });
  await db.doc("users/phoenix").delete();
  await seedUser("phoenix", { first_name: "Reborn" });

  await settle();

  assert.equal((await user("phoenix")).first_name, "Reborn");
});

test("a build that deletes its own user document still gets the full purge", async () => {
  await seedUser("old");
  await db.doc("likes/old_bob").set({ liker_id: "old", liked_id: "bob" });
  await upload("users/old/profile_pictures/a.jpg");

  await db.doc("users/old").delete();

  await waitFor(async () => !(await exists("likes/old_bob")));
  await waitFor(async () => (await filesUnder("users/old/")).length === 0);
});

// ------------------------------------------------------------- initiateChat

test("initiateChat places a hold for a verified user and creates the chat with sorted participants", async () => {
  await seedUser("alice"); await seedUser("bob");
  const out = await fns.initiateChat.run({ ...callAs("bob"), data: { chatId: "alice_bob" } });

  assert.equal(out.status, "pending");
  assert.equal((await user("bob")).credits_on_hold, 1);
  const chat = (await db.doc("chats/alice_bob").get()).data();
  assert.deepEqual(chat.participants, ["alice", "bob"]);
  assert.equal(chat.initiator_id, "bob");
});

test("initiateChat refuses unverified, banned and blocked callers before any credit is held", async () => {
  await seedUser("alice");
  await seedUser("unverified", { is_approved: false });
  await seedUser("banned", { is_banned: true });
  await seedUser("blockedByAlice");
  await seedUser("blocker", { blockedIds: ["alice"] });
  await seedUser("gone", { is_banned: true });
  await db.doc("users/alice").update({ blockedIds: ["blockedByAlice"] });
  const start = (uid, other = "alice") =>
    fns.initiateChat.run({ ...callAs(uid), data: { chatId: [uid, other].sort().join("_") } });

  await assert.rejects(start("unverified"), /NOT_VERIFIED/);
  await assert.rejects(start("banned"), /ACCOUNT_BANNED/);
  await assert.rejects(start("blockedByAlice"), /BLOCKED/);
  await assert.rejects(start("blocker"), /BLOCKED/);
  await assert.rejects(start("alice", "gone"), /RECIPIENT_UNAVAILABLE/);
  await assert.rejects(start("alice", "nobody"), /RECIPIENT_UNAVAILABLE/);

  for (const uid of ["unverified", "banned", "blockedByAlice", "blocker", "alice"]) {
    assert.equal((await user(uid)).credits_on_hold, 0, `${uid} must have no hold`);
  }
  assert.equal((await db.collection("chats").get()).size, 0);
});

// ------------------------------------------------------------ match trigger
//
// The triggers below run in the functions emulator, asynchronously. Clearing
// the database between tests deletes user documents, which fires the purge
// for those uids a moment later, so each of these tests uses uids of its own.

let run = 0;
const uid = (name) => `${name}${run}`;
const pair = (a, b) => [a, b].sort().join("_");

test("a match is created when both likes exist, once, and not from a single like", async () => {
  run++;
  const [alice, bob, carol] = [uid("alice"), uid("bob"), uid("carol")];
  const matchesOf = async () => (await db.collection("matches").where("user_ids", "array-contains", alice).get()).docs;

  await db.doc(`likes/${bob}_${alice}`).set({ liker_id: bob, liked_id: alice });
  await db.doc(`likes/${carol}_${alice}`).set({ liker_id: carol, liked_id: alice });
  await settle();
  assert.equal((await matchesOf()).length, 0);

  await db.doc(`likes/${alice}_${bob}`).set({ liker_id: alice, liked_id: bob });
  await waitFor(() => exists(`matches/${pair(alice, bob)}`));
  await settle(2000);

  const all = await matchesOf();
  assert.equal(all.length, 1);
  assert.deepEqual([all[0].get("user1_id"), all[0].get("user2_id")], [alice, bob].sort());
});

test("no second match is created when an older build already wrote one under its own id", async () => {
  run++;
  const [alice, bob] = [uid("alice"), uid("bob")];
  await db.doc(`likes/${bob}_${alice}`).set({ liker_id: bob, liked_id: alice });
  await db.doc(`matches/${bob}_${alice}`).set({ user1_id: bob, user2_id: alice });

  await db.doc(`likes/${alice}_${bob}`).set({ liker_id: alice, liked_id: bob });
  await settle();

  assert.equal(await exists(`matches/${bob}_${alice}`), true);
  assert.equal(await exists(`matches/${alice}_${bob}`), false);
});

// ---------------------------------------------------------- message status

test("an undelivered message becomes sent, on the message and on the chat", async () => {
  run++;
  const chat = `chats/${pair(uid("alice"), uid("bob"))}`;
  await db.doc(chat).set({ participants: [uid("alice"), uid("bob")], last_message_id: "m1", status: "undelivered" });
  await db.doc(`${chat}/messages/m1`).set({ sender_id: uid("alice"), message: "hi", status: "undelivered" });
  await db.doc(`${chat}/messages/m2`).set({ sender_id: uid("alice"), message: "yo", status: "seen" });

  await waitFor(async () => (await db.doc(`${chat}/messages/m1`).get()).get("status") === "sent");
  await waitFor(async () => (await db.doc(chat).get()).get("status") === "sent");
  assert.equal((await db.doc(`${chat}/messages/m2`).get()).get("status"), "seen");
});

// ------------------------------------------------- reply capture (trigger)

// Runs inside the functions emulator, unlike the direct initiateChat calls
// above. That difference is the point: index.ts once read Timestamp off
// admin.firestore, which is undefined in that runtime, so every chat function
// threw there while the direct calls passed.
test("a reply to a pending chat captures the held credit and opens the window", async () => {
  run++;
  const [alice, bob] = [uid("alice"), uid("bob")];
  const chat = `chats/${pair(alice, bob)}`;
  await seedUser(alice, { credit_balance: 3, credits_on_hold: 1 });
  await seedUser(bob);
  await db.doc(chat).set({
    participants: [alice, bob].sort(), credit_status: "pending", credit_held: true,
    initiator_id: alice, hold_placed_at: admin.firestore.Timestamp.now(),
  });

  await db.doc(`${chat}/messages/reply`).set({ sender_id: bob, message: "hi back", status: "sent" });

  await waitFor(async () => (await db.doc(chat).get()).get("credit_status") === "connected");
  const after = (await db.doc(chat).get()).data();
  assert.ok(after.expiration_time.toMillis() > Date.now());
  assert.equal((await user(alice)).credit_balance, 2);
  assert.equal((await user(alice)).credits_on_hold, 0);
});

// ---------------------------------------------------------------- clean-up

test("photo clean-up removes files no longer on the profile and always clears the queue", async () => {
  run++;
  const A = uid("alice");
  await upload(`users/${A}/profile_pictures/keep.jpg`);
  await upload(`users/${A}/profile_pictures/removed.jpg`);
  await seedUser(A, {
    photos: [`https://firebasestorage.googleapis.com/v0/b/x/o/users%2F${A}%2Fprofile_pictures%2Fkeep.jpg?alt=media&token=t`],
  });

  await db.doc(`deletePicQueue/${A}`).set({ uid: A });
  await waitFor(async () => !(await exists(`deletePicQueue/${A}`)));
  assert.deepEqual(await filesUnder(`users/${A}/profile_pictures/`), [`users/${A}/profile_pictures/keep.jpg`]);

  // Nothing stale this time. The deployed function left the queue doc behind here.
  await db.doc(`deletePicQueue/${A}`).set({ uid: A });
  await waitFor(async () => !(await exists(`deletePicQueue/${A}`)));
  assert.deepEqual(await filesUnder(`users/${A}/profile_pictures/`), [`users/${A}/profile_pictures/keep.jpg`]);
});

test("only the newest verification selfie is kept", async () => {
  run++;
  const A = uid("alice");
  const G = uid("ghost");
  await upload(`users/${A}/face_verification/first.png`);
  await new Promise((r) => setTimeout(r, 1500));
  await upload(`users/${A}/face_verification/second.png`);
  await upload(`users/${A}/profile_pictures/untouched.jpg`);

  await waitFor(async () => (await filesUnder(`users/${A}/face_verification/`)).length === 1);
  assert.deepEqual(await filesUnder(`users/${A}/face_verification/`), [`users/${A}/face_verification/second.png`]);
  assert.deepEqual(await filesUnder(`users/${A}/profile_pictures/`), [`users/${A}/profile_pictures/untouched.jpg`]);
});

// ---------------------------------------------------------------- presence

test("a presence write for an account with no user document does not create one", async () => {
  run++;
  const A = uid("alice");
  const G = uid("ghost");
  await seedUser(A);
  await rtdb.ref(`users/${G}/presence`).set({ online: true, lastSeen: Date.now() });
  await rtdb.ref(`users/${A}/presence`).set({ online: true, lastSeen: Date.now() });

  await waitFor(async () => (await user(A)).status?.online === true);
  assert.equal(await exists(`users/${G}`), false);
});
