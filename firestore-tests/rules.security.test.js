// Emulator tests for the audited firestore.rules (plan sections 1 and 4).
//
// Two kinds of test, named for the plan row they cover:
//   R-rows  an attack that the first draft of the rules let through.
//   W/M-rows a write a real client makes that must keep working.
//
// Client writes are reproduced from the code as read; nothing here drives
// the actual web or mobile app, so a passing test proves the rule accepts
// that shape of write, not that the screen works end to end.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const {
  doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, collection, query, where, or, and, limit,
  deleteField, serverTimestamp, writeBatch, Timestamp,
} = require("firebase/firestore");

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-whossy-rules",
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8"),
    },
  });
});

test.after(async () => {
  await testEnv.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
});

const PHOTOS = ["https://example.com/a.jpg", "https://example.com/b.jpg"];

const VERIFIED = {
  is_approved: true, is_banned: false, is_premium: false,
  credit_balance: 5, credits_on_hold: 0,
  photos: PHOTOS, has_completed_onboarding: true,
  face_verification: { status: "approved", photo: "https://example.com/s.jpg", reviewed_by: "admin", reviewed_at: 1 },
};

const as = (uid) => testEnv.authenticatedContext(uid).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

async function seed(pathStr, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), pathStr), data);
  });
}
const seedUser = (uid, data = {}) => seed(`users/${uid}`, { uid, ...VERIFIED, ...data });
const chatIdOf = (a, b) => [a, b].sort().join("_");
const inFuture = () => Timestamp.fromMillis(Date.now() + 3600_000);
const inPast = () => Timestamp.fromMillis(Date.now() - 3600_000);
const message = (sender) => ({ id: "m1", sender_id: sender, message: "hi", status: "sent", timestamp: Date.now() });

// ---------------------------------------------------------------- users

test("R1: a banned user cannot unban themselves by deleting is_banned", async () => {
  await seedUser("henry", { is_banned: true });
  await assertFails(updateDoc(doc(as("henry"), "users/henry"), { is_banned: deleteField() }));
  await assertFails(updateDoc(doc(as("henry"), "users/henry"), { is_banned: false }));
});

test("R1: a user cannot free their held credits by deleting credits_on_hold", async () => {
  await seedUser("henry", { credit_balance: 1, credits_on_hold: 1 });
  await assertFails(updateDoc(doc(as("henry"), "users/henry"), { credits_on_hold: deleteField() }));
});

test("R1: a full overwrite cannot drop or change server-owned fields", async () => {
  await seedUser("henry", { is_banned: true });
  await assertFails(setDoc(doc(as("henry"), "users/henry"), { uid: "henry", photos: PHOTOS }));
});

test("R2: premium, plan and expiry fields are not client-writable", async () => {
  await seedUser("alice");
  const me = doc(as("alice"), "users/alice");
  await assertFails(updateDoc(me, { is_premium: true }));
  await assertFails(updateDoc(me, { premium_expires_at: inFuture() }));
  await assertFails(updateDoc(me, { current_plan: "subscription_1months" }));
  await assertFails(updateDoc(me, { purchase_token: "forged" }));
  await assertFails(updateDoc(me, { isPremium: true }));
  await assertFails(updateDoc(me, { credit_balance: 999 }));
  await assertFails(updateDoc(me, { popularity_score_30d: 9000 }));
});

test("R2: uid, created_at and auth_provider cannot be changed after signup", async () => {
  await seedUser("alice", { created_at: 1, auth_provider: "local" });
  const me = doc(as("alice"), "users/alice");
  await assertFails(updateDoc(me, { uid: "someone-else" }));
  await assertFails(updateDoc(me, { created_at: serverTimestamp() }));
  await assertFails(updateDoc(me, { auth_provider: "google" }));
});

test("R3: a new account cannot be created already carrying server-owned state", async () => {
  const base = { uid: "new", is_approved: false, has_completed_onboarding: false };
  const mk = (extra) => setDoc(doc(as("new"), "users/new"), { ...base, ...extra });
  await assertFails(mk({ is_premium: true }));
  await assertFails(mk({ credit_balance: 100 }));
  await assertFails(mk({ premium_expires_at: inFuture() }));
  await assertFails(mk({ popularity_score_30d: 500 }));
  await assertFails(mk({ face_verification: { status: "approved" } }));
  await assertFails(mk({ uid: "someone-else" }));
});

test("signup: web and mobile account creation shapes are accepted", async () => {
  // web CreateAccount.tsx
  await assertSucceeds(setDoc(doc(as("web1"), "users/web1"), {
    uid: "web1", auth_provider: "local", email: "w@example.test", first_name: "", last_name: "",
    is_approved: false, created_at: "2026-10-06", has_completed_account_creation: false, has_completed_onboarding: false,
  }));
  // mobile setBaseData (AppUser.toJson)
  await assertSucceeds(setDoc(doc(as("mob1"), "users/mob1"), {
    uid: "mob1", email: "m@example.test", auth_provider: "apple",
    has_completed_account_creation: false, has_completed_onboarding: false,
    is_approved: false, is_banned: false, is_premium: false, credit_balance: 0,
    user_settings: { online_status: true }, blockedIds: [], face_verification: { retake_photo: false },
    created_at: serverTimestamp(),
  }, { merge: true }));
});

test("W1: web onboarding saves its profile once the server-owned keys and the placeholder are gone", async () => {
  await seed("users/web1", { uid: "web1", is_approved: false, has_completed_onboarding: false });
  await assertSucceeds(updateDoc(doc(as("web1"), "users/web1"), {
    uid: "web1", bio: "hello", photos: PHOTOS, interests: ["a"], blockedIds: [],
    user_settings: { public_search: true }, tour_guide: {},
  }));
  await assertSucceeds(updateDoc(doc(as("web1"), "users/web1"), {
    has_completed_onboarding: true,
    face_verification: { status: "pending_review", photo: "https://example.com/s.jpg" },
  }));
});

test("W1: the write web onboarding makes today is rejected (it introduces server-owned fields)", async () => {
  await seed("users/web1", { uid: "web1", is_approved: false, has_completed_onboarding: false });
  await assertFails(updateDoc(doc(as("web1"), "users/web1"), {
    photos: PHOTOS, is_premium: false, credit_balance: 0, is_banned: false,
    amount_paid_in_total: { naira: 0, kenyan_shillings: 0 }, paystack: {},
  }));
});

test("ordinary profile edits work on an old account that lacks the newer fields", async () => {
  await seed("users/old", { uid: "old", is_approved: true, photos: PHOTOS, has_completed_onboarding: true });
  const me = doc(as("old"), "users/old");
  await assertSucceeds(updateDoc(me, { bio: "new bio" }));
  await assertSucceeds(updateDoc(me, { user_settings: { public_search: false } }));
  await assertSucceeds(updateDoc(me, { tokens: ["fcm-token"] }));
  await assertSucceeds(setDoc(me, { latitude: 6.5, longitude: 3.3, geohash: "s14" }, { merge: true }));
});

test("R4/D3: an onboarded account short of photos can still do everything except shrink them", async () => {
  await seed("users/short", { uid: "short", is_approved: false, photos: [], has_completed_onboarding: true });
  const me = doc(as("short"), "users/short");
  await assertSucceeds(updateDoc(me, { tokens: ["fcm-token"] }));
  await assertSucceeds(updateDoc(me, { photos: ["https://example.com/a.jpg"] }));
  await assertSucceeds(updateDoc(me, { photos: PHOTOS }));
  await assertFails(updateDoc(me, { photos: ["https://example.com/a.jpg"] }));
});

test("onboarding cannot be completed with fewer than two photos", async () => {
  await seed("users/n", { uid: "n", is_approved: false, photos: ["https://example.com/a.jpg"], has_completed_onboarding: false });
  await assertFails(updateDoc(doc(as("n"), "users/n"), { has_completed_onboarding: true }));
});

test("verification: a client cannot approve itself, by flag or by status", async () => {
  await seedUser("eve", { is_approved: false, face_verification: { status: "pending_review", photo: "x" } });
  const me = doc(as("eve"), "users/eve");
  await assertFails(updateDoc(me, { is_approved: true }));
  await assertFails(updateDoc(me, { "face_verification.status": "approved" }));
  await assertFails(updateDoc(me, { is_approved: deleteField() }));
});

test("M7: mobile can resubmit after a rejection even though its merge keeps the old reason", async () => {
  await seedUser("mob", {
    is_approved: false,
    face_verification: { status: "rejected", photo: "old", rejection_reason: "blurry", reviewed_by: "admin", reviewed_at: 1 },
  });
  await assertSucceeds(setDoc(doc(as("mob"), "users/mob"), {
    face_verification: { status: "pending_review", photo: "new", retake_photo: false },
  }, { merge: true }));
});

test("users: nobody can write another user's document, and nobody can delete one", async () => {
  await seedUser("alice");
  await seedUser("mallory");
  await assertFails(updateDoc(doc(as("mallory"), "users/alice"), { bio: "defaced" }));
  await assertFails(deleteDoc(doc(as("alice"), "users/alice")));
  await assertFails(getDoc(doc(as("alice"), "users/alice/private/billing")));
});

test("W2/W3/M5: a signed-out client cannot look users up by email or phone", async () => {
  await seedUser("alice", { email: "alice@example.test" });
  await assertFails(getDocs(query(collection(anon(), "users"), where("email", "==", "alice@example.test"))));
});

// ---------------------------------------------------------- likes, dislikes

test("R5: a banned user cannot like or message, even though still approved", async () => {
  await seedUser("banned", { is_banned: true });
  await seedUser("bob");
  const id = chatIdOf("banned", "bob");
  await seed(`chats/${id}`, { participants: ["banned", "bob"], credit_status: "pending", initiator_id: "banned" });
  await assertFails(setDoc(doc(as("banned"), "likes/banned_bob"), { liker_id: "banned", liked_id: "bob" }));
  await assertFails(setDoc(doc(as("banned"), `chats/${id}/messages/m1`), message("banned")));
});

test("R6: a like must use the liker_liked id, so one user cannot like the same person repeatedly", async () => {
  await seedUser("alice");
  await assertSucceeds(setDoc(doc(as("alice"), "likes/alice_bob"), { uid: "alice_bob", liker_id: "alice", liked_id: "bob", timestamp: 1 }));
  await assertFails(setDoc(doc(as("alice"), "likes/spam-1"), { liker_id: "alice", liked_id: "bob" }));
  await assertFails(setDoc(doc(as("alice"), "likes/alice_carol"), { liker_id: "alice", liked_id: "bob" }));
  await assertFails(setDoc(doc(as("alice"), "likes/alice_alice"), { liker_id: "alice", liked_id: "alice" }));
  await assertFails(setDoc(doc(as("alice"), "likes/alice_null"), { liker_id: "alice", liked_id: null }));
  await assertFails(setDoc(doc(as("alice"), "likes/bob_alice"), { liker_id: "bob", liked_id: "alice" }));
});

test("R7: likes are readable only by the two people involved", async () => {
  await seedUser("alice"); await seedUser("bob"); await seedUser("mallory");
  await seed("likes/alice_bob", { liker_id: "alice", liked_id: "bob" });
  await assertFails(getDoc(doc(as("mallory"), "likes/alice_bob")));
  await assertFails(getDocs(collection(as("mallory"), "likes")));
  await assertFails(getDocs(query(collection(as("mallory"), "likes"), where("liked_id", "==", "bob"))));
  await assertSucceeds(getDocs(query(collection(as("bob"), "likes"), where("liked_id", "==", "bob"))));
  await assertSucceeds(getDocs(query(collection(as("alice"), "likes"), where("liker_id", "==", "alice"))));
  // The reciprocity check both apps do: a lookup of a like that may not exist.
  await assertSucceeds(getDoc(doc(as("bob"), "likes/bob_alice")));
});

test("R7: dislikes are readable only by the person who made them", async () => {
  await seed("dislikes/alice_bob", { disliker_id: "alice", disliked_id: "bob" });
  await assertFails(getDoc(doc(as("bob"), "dislikes/alice_bob")));
  await assertSucceeds(getDocs(query(collection(as("alice"), "dislikes"), where("disliker_id", "==", "alice"))));
});

test("M1/R8: mobile's like flow works: deleting a dislike that does not exist, then liking", async () => {
  await seedUser("alice");
  await assertSucceeds(deleteDoc(doc(as("alice"), "dislikes/alice_bob")));
  await assertSucceeds(setDoc(doc(as("alice"), "likes/alice_bob"), { liked_id: "bob", liker_id: "alice", timestamp: 1, uid: "alice_bob" }));
});

test("W11: disliking someone again, and undoing a dislike, both work; touching someone else's does not", async () => {
  const d = { uid: "alice_bob", disliker_id: "alice", disliked_id: "bob", timestamp: 1 };
  await assertSucceeds(setDoc(doc(as("alice"), "dislikes/alice_bob"), d));
  await assertSucceeds(setDoc(doc(as("alice"), "dislikes/alice_bob"), { ...d, timestamp: 2 }));
  await assertFails(deleteDoc(doc(as("bob"), "dislikes/alice_bob")));
  await assertSucceeds(deleteDoc(doc(as("alice"), "dislikes/alice_bob")));
});

// ----------------------------------------------------------------- matches

test("3.2: a client cannot create a match, with or without a reciprocal like", async () => {
  await seedUser("mallory");
  await assertFails(setDoc(doc(as("mallory"), "matches/mallory_victim"), { user1_id: "mallory", user2_id: "victim", timestamp: 1 }));
});

test("matches are readable only by their two participants", async () => {
  await seed("matches/alice_bob", { user1_id: "alice", user2_id: "bob" });
  await assertSucceeds(getDoc(doc(as("alice"), "matches/alice_bob")));
  await assertSucceeds(getDocs(query(collection(as("bob"), "matches"), where("user2_id", "==", "bob"))));
  await assertFails(getDoc(doc(as("mallory"), "matches/alice_bob")));
});

test("the match queries both apps run still work: either-side OR, and the pair lookup", async () => {
  await seed("matches/alice_bob", { user1_id: "alice", user2_id: "bob" });
  await seed("matches/carol_alice", { user1_id: "carol", user2_id: "alice" });
  const mine = (uid) => query(collection(as(uid), "matches"), or(where("user1_id", "==", uid), where("user2_id", "==", uid)));
  assert.equal((await assertSucceeds(getDocs(mine("alice")))).size, 2);
  assert.equal((await assertSucceeds(getDocs(mine("bob")))).size, 1);
  // mobile isMutualMatch
  await assertSucceeds(getDocs(query(collection(as("alice"), "matches"), or(
    and(where("user1_id", "==", "alice"), where("user2_id", "==", "bob")),
    and(where("user1_id", "==", "bob"), where("user2_id", "==", "alice")),
  ), limit(1))));
  // Not your own pair.
  await assertFails(getDocs(query(collection(as("mallory"), "matches"), or(where("user1_id", "==", "alice"), where("user2_id", "==", "alice")))));
});

test("mobile's old reciprocity query (likes where uid == pair id) is refused; the lookup by id that replaces it works", async () => {
  await seed("likes/bob_alice", { uid: "bob_alice", liker_id: "bob", liked_id: "alice" });
  await assertFails(getDocs(query(collection(as("alice"), "likes"), where("uid", "==", "bob_alice"), limit(1))));
  assert.equal((await assertSucceeds(getDoc(doc(as("alice"), "likes/bob_alice")))).exists(), true);
  assert.equal((await assertSucceeds(getDoc(doc(as("alice"), "likes/carol_alice")))).exists(), false);
});

// ------------------------------------------------------------------- chats

test("R9: a verified user cannot message without credits by writing straight into a chat", async () => {
  await seedUser("alice"); await seedUser("bob");
  const id = chatIdOf("alice", "bob");
  // The shell a client is allowed to create carries no credit state...
  await assertSucceeds(setDoc(doc(as("alice"), `chats/${id}`), { participants: ["alice", "bob"], status: "inactive" }));
  // ...so nothing can be sent into it until initiateChat has run.
  await assertFails(setDoc(doc(as("alice"), `chats/${id}/messages/m1`), message("alice")));
});

test("R9: a client cannot hand itself an open chat", async () => {
  await seedUser("alice");
  const id = chatIdOf("alice", "bob");
  const mk = (extra) => setDoc(doc(as("alice"), `chats/${id}`), { participants: ["alice", "bob"], ...extra });
  await assertFails(mk({ credit_status: "connected", expiration_time: inFuture() }));
  await assertFails(mk({ credit_status: "pending", initiator_id: "alice" }));
  await assertFails(mk({ is_unlocked: true, expiration_time: inFuture() }));
  await assertFails(mk({ expiration_time: inFuture() })); // W4: what web's createOrFetchChat writes today
  await seed(`chats/${id}`, { participants: ["alice", "bob"] });
  await assertFails(updateDoc(doc(as("alice"), `chats/${id}`), { credit_status: "connected", expiration_time: inFuture() }));
  await assertFails(updateDoc(doc(as("alice"), `chats/${id}`), { is_unlocked: true }));
});

test("messages flow once the server has opened the chat, and stop when the window closes", async () => {
  await seedUser("alice"); await seedUser("bob");
  const id = chatIdOf("alice", "bob");

  await seed(`chats/${id}`, { participants: ["alice", "bob"], credit_status: "pending", initiator_id: "alice" });
  await assertSucceeds(setDoc(doc(as("alice"), `chats/${id}/messages/m1`), message("alice")));
  await assertSucceeds(setDoc(doc(as("bob"), `chats/${id}/messages/m2`), message("bob"))); // the reply that connects

  await seed(`chats/${id}`, { participants: ["alice", "bob"], credit_status: "connected", expiration_time: inFuture() });
  await assertSucceeds(setDoc(doc(as("bob"), `chats/${id}/messages/m3`), message("bob")));

  await seed(`chats/${id}`, { participants: ["alice", "bob"], credit_status: "connected", expiration_time: inPast() });
  await assertFails(setDoc(doc(as("alice"), `chats/${id}/messages/m4`), message("alice")));

  await seed(`chats/${id}`, { participants: ["alice", "bob"], credit_status: "idle" });
  await assertFails(setDoc(doc(as("alice"), `chats/${id}/messages/m5`), message("alice")));
});

test("a message cannot be sent in someone else's name, or by an unverified user", async () => {
  await seedUser("alice"); await seedUser("bob", { is_approved: false });
  const id = chatIdOf("alice", "bob");
  await seed(`chats/${id}`, { participants: ["alice", "bob"], credit_status: "pending", initiator_id: "alice" });
  await assertFails(setDoc(doc(as("alice"), `chats/${id}/messages/m1`), message("bob")));
  await assertFails(setDoc(doc(as("bob"), `chats/${id}/messages/m2`), message("bob")));
});

test("R10: a third party cannot create, read or write a chat between two other users", async () => {
  await seedUser("mallory");
  const id = chatIdOf("alice", "bob");
  await assertFails(setDoc(doc(as("mallory"), `chats/${id}`), { participants: ["mallory", "alice"] }));
  await assertFails(setDoc(doc(as("alice"), `chats/${id}`), { participants: ["alice", "mallory"] }));
  await seed(`chats/${id}`, { participants: ["alice", "bob"], credit_status: "pending", initiator_id: "alice" });
  await seed(`chats/${id}/messages/m1`, message("alice"));
  await assertFails(getDoc(doc(as("mallory"), `chats/${id}`)));
  await assertFails(getDocs(collection(as("mallory"), `chats/${id}/messages`)));
  await assertFails(setDoc(doc(as("mallory"), `chats/${id}/messages/m9`), message("mallory")));
  await assertFails(updateDoc(doc(as("mallory"), `chats/${id}`), { last_message: "x" }));
});

test("W5/M4: a participant can read and listen to a chat that does not exist yet", async () => {
  const id = chatIdOf("alice", "bob");
  await assertSucceeds(getDoc(doc(as("alice"), `chats/${id}`)));
  await assertSucceeds(getDocs(collection(as("alice"), `chats/${id}/messages`)));
  await assertFails(getDoc(doc(as("mallory"), `chats/${id}`)));
});

test("the chat list query works for a participant and for nobody else", async () => {
  await seed("chats/alice_bob", { participants: ["alice", "bob"] });
  await assertSucceeds(getDocs(query(collection(as("alice"), "chats"), where("participants", "array-contains", "alice"))));
  await assertFails(getDocs(collection(as("alice"), "chats")));
  await assertFails(getDocs(query(collection(as("mallory"), "chats"), where("participants", "array-contains", "alice"))));
});

test("M2: mobile's send batch works for both users, though each writes participants in its own order", async () => {
  await seedUser("alice"); await seedUser("bob");
  const id = chatIdOf("alice", "bob");
  await seed(`chats/${id}`, { participants: ["alice", "bob"], credit_status: "pending", initiator_id: "alice" });

  for (const [me, other, mid] of [["alice", "bob", "m1"], ["bob", "alice", "m2"]]) {
    const db = as(me);
    const batch = writeBatch(db);
    batch.set(doc(db, `chats/${id}/messages/${mid}`), { ...message(me), id: mid });
    batch.set(doc(db, `chats/${id}`), {
      participants: [me, other], last_message: "hi", last_message_id: mid,
      last_sender_id: me, last_message_timestamp: serverTimestamp(), status: "sent",
    }, { merge: true });
    await assertSucceeds(batch.commit());
  }
  // The same door does not let participants be rewritten to someone else.
  await assertFails(updateDoc(doc(as("alice"), `chats/${id}`), { participants: ["alice", "mallory"] }));
});

test("M3: a sender can attach the uploaded image to their own message but cannot edit its text", async () => {
  const id = chatIdOf("alice", "bob");
  await seed(`chats/${id}`, { participants: ["alice", "bob"] });
  await seed(`chats/${id}/messages/m1`, { ...message("alice"), local_photo: "/device/path.jpg" });
  const m = doc(as("alice"), `chats/${id}/messages/m1`);
  await assertSucceeds(updateDoc(m, { photo: "https://example.com/p.jpg", local_photo: deleteField() }));
  await assertFails(updateDoc(m, { message: "edited" }));
  await assertFails(updateDoc(m, { status: "seen" }));
  await assertSucceeds(updateDoc(doc(as("bob"), `chats/${id}/messages/m1`), { status: "seen" }));
  await assertFails(deleteDoc(m));
});

// ------------------------------------------------------------ other paths

test("W9/M10: reporting the same user twice works; overwriting someone else's report does not", async () => {
  const r = { reporterId: "alice", reportedId: "bob", message: "spam", timestamp: 1 };
  await assertSucceeds(setDoc(doc(as("alice"), "userReports/alice_bob"), r));
  await assertSucceeds(setDoc(doc(as("alice"), "userReports/alice_bob"), { ...r, message: "again" }));
  await assertFails(setDoc(doc(as("bob"), "userReports/alice_bob"), { reporterId: "bob", reportedId: "alice", message: "x" }));
  await assertFails(getDoc(doc(as("alice"), "userReports/alice_bob")));
});

test("W6/M8: both apps' photo-delete queue writes work, and only on your own entry", async () => {
  // web: read, then set
  await assertSucceeds(getDoc(doc(as("alice"), "deletePicQueue/alice")));
  await assertSucceeds(setDoc(doc(as("alice"), "deletePicQueue/alice"), { uid: "alice" }));
  // mobile: batch delete then set
  const db = as("alice");
  const batch = writeBatch(db);
  batch.delete(doc(db, "deletePicQueue/alice"));
  batch.set(doc(db, "deletePicQueue/alice"), { uid: "alice" });
  await assertSucceeds(batch.commit());
  await assertFails(setDoc(doc(as("mallory"), "deletePicQueue/alice"), { uid: "alice" }));
});

test("P11: a payment record is readable by its owner only and never client-writable", async () => {
  await seed("payments/ref1", { uid: "alice", status: "pending", credits: 50 });
  await assertSucceeds(getDoc(doc(as("alice"), "payments/ref1")));
  await assertFails(getDoc(doc(as("mallory"), "payments/ref1")));
  await assertFails(updateDoc(doc(as("alice"), "payments/ref1"), { status: "completed" }));
  await assertFails(setDoc(doc(as("alice"), "payments/ref2"), { uid: "alice", status: "completed", credits: 1000 }));
  await assertFails(getDoc(doc(as("alice"), "paystack_customers/CUS_x")));
});

test("the minimum-version config is readable before sign-in and writable by no client", async () => {
  await seed("config/app", { min_build: 12 });
  await assertSucceeds(getDoc(doc(anon(), "config/app")));
  await assertFails(setDoc(doc(as("alice"), "config/app"), { min_build: 0 }));
});

test("notifications: the owner may only mark one seen; nobody may create or delete one", async () => {
  await seed("users/alice/notifications/n1", { title: "Like", seen: false });
  const n = doc(as("alice"), "users/alice/notifications/n1");
  await assertSucceeds(updateDoc(n, { seen: true }));
  await assertFails(updateDoc(n, { title: "edited" }));
  await assertFails(deleteDoc(n));
  await assertFails(setDoc(doc(as("mallory"), "users/alice/notifications/n2"), { title: "spam", seen: false }));
  await assertFails(getDoc(doc(as("mallory"), "users/alice/notifications/n1")));
});

test("a collection no rule mentions is closed", async () => {
  await assertFails(getDoc(doc(as("alice"), "userchats/alice")));
  await assertFails(setDoc(doc(as("alice"), "anything/x"), { a: 1 }));
});
