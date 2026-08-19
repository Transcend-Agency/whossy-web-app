// Integration tests for the Track B notification triggers
// (functions/src/notifications.ts), run against the Firestore + Functions
// emulators with the real compiled functions loaded — not a rules check,
// an actual trigger-fires-and-writes-the-right-document test.
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

async function notificationsFor(uid) {
  const snap = await db.collection("users").doc(uid).collection("notifications").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function seedUser(uid, data) {
  await db.collection("users").doc(uid).set({ first_name: "Test", photos: [], ...data });
}

// Without this, the Admin SDK's open gRPC connections keep the event loop
// alive indefinitely after every assertion has already passed — `node
// --test` never reports a summary or exits (discovered running this suite
// for the first time; it had never actually been run before, no Java on
// the machine that wrote it).
test.after(async () => {
  await app.delete();
});

test.beforeEach(async () => {
  // Emulator-only project — clearing the whole thing between tests is safe.
  const collections = await db.listCollections();
  for (const col of collections) {
    const docs = await col.listDocuments();
    await Promise.all(docs.map((d) => db.recursiveDelete(d)));
  }
});

test("a new like writes a notification for the liked user", async () => {
  await seedUser("alice", { first_name: "Alice" });
  await seedUser("bob", { first_name: "Bob" });

  await db.collection("likes").doc("alice_bob").set({
    liker_id: "alice", liked_id: "bob", timestamp: Date.now(),
  });

  const notes = await waitFor(async () => {
    const n = await notificationsFor("bob");
    return n.length > 0 ? n : null;
  });

  assert.equal(notes.length, 1);
  assert.equal(notes[0].type, "like");
  assert.equal(notes[0].likerId, "alice");
  assert.equal(notes[0].likerName, "Alice");
  assert.equal(notes[0].seen, false);
});

test("a new match writes a notification for both participants", async () => {
  await seedUser("carol", { first_name: "Carol" });
  await seedUser("dave", { first_name: "Dave" });

  await db.collection("matches").doc("carol_dave").set({
    user1_id: "carol", user2_id: "dave", timestamp: Date.now(),
  });

  const [carolNotes, daveNotes] = await Promise.all([
    waitFor(async () => { const n = await notificationsFor("carol"); return n.length > 0 ? n : null; }),
    waitFor(async () => { const n = await notificationsFor("dave"); return n.length > 0 ? n : null; }),
  ]);

  assert.equal(carolNotes[0].type, "match");
  assert.equal(carolNotes[0].body, "You matched with Dave.");
  assert.equal(daveNotes[0].body, "You matched with Carol.");
});

test("a new message notifies only the recipient, not the sender", async () => {
  await seedUser("erin", { first_name: "Erin" });
  await seedUser("frank", { first_name: "Frank" });
  const chatId = ["erin", "frank"].sort().join("_");
  await db.collection("chats").doc(chatId).set({ participants: ["erin", "frank"] });

  await db.collection("chats").doc(chatId).collection("messages").doc("m1").set({
    sender_id: "erin", message: "hi there", timestamp: Date.now(), status: "sent",
  });

  const frankNotes = await waitFor(async () => {
    const n = await notificationsFor("frank");
    return n.length > 0 ? n : null;
  });
  const erinNotes = await notificationsFor("erin");

  assert.equal(frankNotes.length, 1);
  assert.equal(frankNotes[0].type, "message");
  assert.equal(frankNotes[0].chatId, chatId);
  assert.equal(frankNotes[0].senderName, "Erin");
  assert.equal(erinNotes.length, 0, "sender should not notify themselves");
});

test("a message from a blocked sender does not notify", async () => {
  await seedUser("gina", { first_name: "Gina" });
  await seedUser("hank", { first_name: "Hank" });
  const chatId = ["gina", "hank"].sort().join("_");
  await db.collection("chats").doc(chatId).set({ participants: ["gina", "hank"] });

  await db.collection("chats").doc(chatId).collection("messages").doc("m1").set({
    sender_id: "gina", sender_id_blocked: true, message: "hi", timestamp: Date.now(), status: "sent",
  });

  // Negative assertion — give the trigger a beat to (not) fire, then check.
  await new Promise((r) => setTimeout(r, 3000));
  assert.equal((await notificationsFor("hank")).length, 0);
});

test("verification approval notifies the submitter", async () => {
  await seedUser("iris", {
    first_name: "Iris",
    face_verification: { status: "pending_review", photo: "https://example.com/s.jpg" },
  });

  await db.collection("users").doc("iris").update({
    "face_verification.status": "approved",
    is_approved: true,
  });

  const notes = await waitFor(async () => {
    const n = await notificationsFor("iris");
    return n.length > 0 ? n : null;
  });

  assert.equal(notes[0].type, "verification");
  assert.equal(notes[0].verificationStatus, "approved");
});

test("verification rejection includes the reason", async () => {
  await seedUser("jack", {
    first_name: "Jack",
    face_verification: { status: "pending_review", photo: "https://example.com/s.jpg" },
  });

  await db.collection("users").doc("jack").update({
    "face_verification.status": "rejected",
    "face_verification.rejection_reason": "Face not clearly visible",
    is_approved: false,
  });

  const notes = await waitFor(async () => {
    const n = await notificationsFor("jack");
    return n.length > 0 ? n : null;
  });

  assert.equal(notes[0].verificationStatus, "rejected");
  assert.match(notes[0].body, /Face not clearly visible/);
});

test("a self-revoke (approved -> revoked) does not notify — that's the user's own action", async () => {
  await seedUser("kim", {
    first_name: "Kim",
    face_verification: { status: "approved", photo: "https://example.com/s.jpg" },
  });

  await db.collection("users").doc("kim").update({
    "face_verification.status": "revoked",
    is_approved: false,
  });

  await new Promise((r) => setTimeout(r, 3000));
  assert.equal((await notificationsFor("kim")).length, 0);
});

test("an unrelated profile-field edit does not spuriously notify", async () => {
  await seedUser("liam", { first_name: "Liam" });
  await db.collection("users").doc("liam").update({ bio: "just editing my bio" });

  await new Promise((r) => setTimeout(r, 3000));
  assert.equal((await notificationsFor("liam")).length, 0);
});
