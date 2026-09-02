// Emulator tests for firestore.rules (pre-launch plan A6, launch-gate items).
//
// Not runnable in every environment — needs Java for the Firestore/Storage
// emulators. Written but unexecuted here (no Java on this machine); run
// `npm test` from this directory before deploying firestore.rules.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { doc, setDoc, updateDoc } = require("firebase/firestore");

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "whossy-rules-test",
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

const APPROVED_USER = {
  is_approved: true,
  is_banned: false,
  is_premium: false,
  credit_balance: 0,
  credits_on_hold: 0,
  photos: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
  has_completed_onboarding: true,
  face_verification: { status: "approved", photo: "https://example.com/selfie.jpg" },
};

const UNVERIFIED_USER = {
  is_approved: false,
  is_banned: false,
  is_premium: false,
  credit_balance: 0,
  credits_on_hold: 0,
  photos: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
  has_completed_onboarding: true,
  face_verification: { status: "pending_review", photo: "https://example.com/selfie.jpg" },
};

async function seedUser(uid, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users", uid), data);
  });
}

test("signup cannot complete without the 2-photo minimum (A2)", async () => {
  const alice = testEnv.authenticatedContext("alice").firestore();
  await assertFails(
    setDoc(doc(alice, "users", "alice"), {
      is_approved: false, is_banned: false, is_premium: false,
      credit_balance: 0, credits_on_hold: 0,
      photos: ["https://example.com/only-one.jpg"],
      has_completed_onboarding: true,
    })
  );
});

test("signup completes fine with 2+ photos", async () => {
  const alice = testEnv.authenticatedContext("alice").firestore();
  await assertSucceeds(
    setDoc(doc(alice, "users", "alice"), {
      is_approved: false, is_banned: false, is_premium: false,
      credit_balance: 0, credits_on_hold: 0,
      photos: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
      has_completed_onboarding: true,
    })
  );
});

test("resubmitting after a rejection is allowed even though it clears reviewed_by/reviewed_at (both clients write the whole map)", async () => {
  await seedUser("mallory", {
    ...UNVERIFIED_USER,
    face_verification: {
      status: "rejected",
      photo: "https://example.com/old-selfie.jpg",
      reviewed_by: "admin-1",
      reviewed_at: Date.now(),
      rejection_reason: "blurry",
    },
  });
  const mallory = testEnv.authenticatedContext("mallory").firestore();
  await assertSucceeds(
    updateDoc(doc(mallory, "users", "mallory"), {
      face_verification: {
        status: "pending_review",
        photo: "https://example.com/new-selfie.jpg",
        challenge_id: "c1",
        challenge_image_url: "https://example.com/pose.jpg",
        rejection_reason: null,
      },
    })
  );
});

test("a like from an unverified account is rejected server-side (launch gate)", async () => {
  await seedUser("bob", UNVERIFIED_USER);
  const bob = testEnv.authenticatedContext("bob").firestore();
  await assertFails(
    setDoc(doc(bob, "likes", "bob_carol"), { liker_id: "bob", liked_id: "carol", timestamp: Date.now() })
  );
});

test("a like from a verified account succeeds", async () => {
  await seedUser("dave", APPROVED_USER);
  const dave = testEnv.authenticatedContext("dave").firestore();
  await assertSucceeds(
    setDoc(doc(dave, "likes", "dave_carol"), { liker_id: "dave", liked_id: "carol", timestamp: Date.now() })
  );
});

test("a hand-crafted write setting is_approved: true directly is rejected", async () => {
  await seedUser("eve", UNVERIFIED_USER);
  const eve = testEnv.authenticatedContext("eve").firestore();
  await assertFails(updateDoc(doc(eve, "users", "eve"), { is_approved: true }));
});

test("a hand-crafted write setting face_verification.status: 'approved' directly is rejected", async () => {
  await seedUser("frank", UNVERIFIED_USER);
  const frank = testEnv.authenticatedContext("frank").firestore();
  await assertFails(
    updateDoc(doc(frank, "users", "frank"), {
      face_verification: { ...UNVERIFIED_USER.face_verification, status: "approved" },
    })
  );
});

test("self-revoke after a main-photo change is allowed (A4) — approved -> revoked, is_approved -> false", async () => {
  await seedUser("grace", APPROVED_USER);
  const grace = testEnv.authenticatedContext("grace").firestore();
  await assertSucceeds(
    updateDoc(doc(grace, "users", "grace"), {
      photos: ["https://example.com/new-main.jpg", "https://example.com/b.jpg"],
      is_approved: false,
      face_verification: { ...APPROVED_USER.face_verification, status: "revoked" },
    })
  );
});

test("self-cancel a pending review after a main-photo change is allowed — pending_review -> null", async () => {
  await seedUser("iris", UNVERIFIED_USER);
  const iris = testEnv.authenticatedContext("iris").firestore();
  await assertSucceeds(
    updateDoc(doc(iris, "users", "iris"), {
      photos: ["https://example.com/new-main.jpg", "https://example.com/b.jpg"],
      face_verification: null,
    })
  );
});

test("a hand-crafted write clearing an approved badge via null (bypassing self-revoke) is rejected", async () => {
  await seedUser("jack", APPROVED_USER);
  const jack = testEnv.authenticatedContext("jack").firestore();
  await assertFails(
    updateDoc(doc(jack, "users", "jack"), {
      photos: ["https://example.com/new-main.jpg", "https://example.com/b.jpg"],
      face_verification: null,
    })
  );
});

test("a user cannot un-ban or un-revoke themselves via credit_balance/is_banned writes", async () => {
  await seedUser("henry", { ...UNVERIFIED_USER, is_banned: true });
  const henry = testEnv.authenticatedContext("henry").firestore();
  await assertFails(updateDoc(doc(henry, "users", "henry"), { is_banned: false }));
  await assertFails(updateDoc(doc(henry, "users", "henry"), { credit_balance: 999 }));
});

test("a client cannot set chats.credit_status directly", async () => {
  const iris = testEnv.authenticatedContext("iris").firestore();
  const chatId = ["iris", "jack"].sort().join("_");
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "chats", chatId), { participants: ["iris", "jack"] });
  });
  await assertFails(
    updateDoc(doc(iris, "chats", chatId), { credit_status: "connected", expiration_time: null })
  );
});

test("a message from an unverified account is rejected server-side (launch gate)", async () => {
  await seedUser("kate", UNVERIFIED_USER);
  await seedUser("liam", APPROVED_USER);
  const chatId = ["kate", "liam"].sort().join("_");
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "chats", chatId), { participants: ["kate", "liam"] });
  });
  const kate = testEnv.authenticatedContext("kate").firestore();
  await assertFails(
    setDoc(doc(kate, "chats", chatId, "messages", "m1"), {
      sender_id: "kate", message: "hi", timestamp: Date.now(), status: "sent",
    })
  );
});
