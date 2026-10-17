// Emulator tests for the 18+ rule on users/{uid}.date_of_birth.
//
// The rule compares against request.time, which is the real clock, so every
// date here is worked out from today in UTC instead of being hard-coded.
// Client writes are reproduced from the code as read (mobile
// onboarding_notifier.dart, web ShareASnapshot.tsx / TakeASelfie); a passing
// test proves the rule accepts that shape of write, not that the screen works.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { doc, setDoc, updateDoc, Timestamp } = require("firebase/firestore");

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-whossy-age-rules",
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

const as = (uid) => testEnv.authenticatedContext(uid).firestore();
const me = (uid) => doc(as(uid), `users/${uid}`);

async function seedUser(uid, data = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `users/${uid}`), { uid, ...data });
  });
}

// A user part-way through onboarding: signed up, photos uploaded, not complete.
const midOnboarding = { photos: PHOTOS, has_completed_onboarding: false };

const today = new Date();
const Y = today.getUTCFullYear();
const M = today.getUTCMonth();
const D = today.getUTCDate();
const born = (y, m, d) => Timestamp.fromDate(new Date(Date.UTC(y, m, d)));

const ADULT = born(1995, 4, 5);
const MINOR = born(Y - 10, 0, 1);

// 18 years back from 29 February does not exist in most years, so the two
// boundary tests below cannot say anything on that day.
const feb29 = M === 1 && D === 29;

test("an adult birth date can be written", async () => {
  await seedUser("amy", midOnboarding);
  await assertSucceeds(updateDoc(me("amy"), { date_of_birth: ADULT }));
});

test("a minor's birth date is refused", async () => {
  await seedUser("amy", midOnboarding);
  await assertFails(updateDoc(me("amy"), { date_of_birth: MINOR }));
});

test("turning 18 today is accepted", { skip: feb29 }, async () => {
  await seedUser("amy", midOnboarding);
  await assertSucceeds(updateDoc(me("amy"), { date_of_birth: born(Y - 18, M, D) }));
});

test("turning 18 tomorrow is refused", { skip: feb29 }, async () => {
  await seedUser("amy", midOnboarding);
  await assertFails(updateDoc(me("amy"), { date_of_birth: born(Y - 18, M, D + 1) }));
});

test("a birth year 18 years back but later in the year is refused", { skip: M === 11 }, async () => {
  // The year-only check the clients used to have let this through.
  await seedUser("amy", midOnboarding);
  await assertFails(updateDoc(me("amy"), { date_of_birth: born(Y - 18, 11, 31) }));
});

test("a birth date more than 100 years back is refused", async () => {
  await seedUser("amy", midOnboarding);
  await assertFails(updateDoc(me("amy"), { date_of_birth: born(Y - 101, 5, 5) }));
});

test("only a timestamp is accepted as a birth date", async () => {
  await seedUser("amy", midOnboarding);
  await assertFails(updateDoc(me("amy"), { date_of_birth: "1995-05-05" }));
  await assertFails(updateDoc(me("amy"), { date_of_birth: 799632000000 }));
  await assertFails(updateDoc(me("amy"), { date_of_birth: null }));
});

test("mobile completes onboarding in one write with the birth date in it", async () => {
  await seedUser("amy", midOnboarding);
  await assertSucceeds(updateDoc(me("amy"), {
    has_completed_onboarding: true,
    date_of_birth: ADULT,
    distance: 50,
  }));
});

test("web sets the birth date first, then completes onboarding without it", async () => {
  await seedUser("amy", midOnboarding);
  await assertSucceeds(updateDoc(me("amy"), { date_of_birth: ADULT, distance: 50 }));
  await assertSucceeds(updateDoc(me("amy"), { has_completed_onboarding: true }));
});

test("onboarding cannot be completed without a birth date", async () => {
  await seedUser("amy", midOnboarding);
  await assertFails(updateDoc(me("amy"), { has_completed_onboarding: true }));
});

test("onboarding cannot be completed with a minor's birth date", async () => {
  await seedUser("amy", midOnboarding);
  await assertFails(updateDoc(me("amy"), {
    has_completed_onboarding: true,
    date_of_birth: MINOR,
  }));
});

test("a minor's birth date already on the account does not carry onboarding through", async () => {
  // Written before the rule existed, say.
  await seedUser("amy", { ...midOnboarding, date_of_birth: MINOR });
  await assertFails(updateDoc(me("amy"), { has_completed_onboarding: true }));
});

test("an account that has no birth date can still make unrelated edits", async () => {
  // Accounts that completed onboarding before the rule existed.
  await seedUser("old", { photos: PHOTOS, has_completed_onboarding: true });
  await assertSucceeds(updateDoc(me("old"), { bio: "still editable" }));
});

test("resending an unchanged birth date is not a change", async () => {
  await seedUser("amy", { ...midOnboarding, date_of_birth: ADULT });
  await assertSucceeds(updateDoc(me("amy"), { date_of_birth: ADULT, bio: "hi" }));
});

test("a minor's birth date already on the account cannot be swapped for another minor's", async () => {
  await seedUser("amy", { ...midOnboarding, date_of_birth: MINOR });
  await assertSucceeds(updateDoc(me("amy"), { bio: "unrelated edit" }));
  await assertFails(updateDoc(me("amy"), { date_of_birth: born(Y - 12, 3, 3) }));
});

test("an account is created without a birth date, as both clients do at signup", async () => {
  await assertSucceeds(setDoc(me("amy"), { uid: "amy", email: "amy@example.com" }));
});

test("an account cannot be created with a minor's birth date", async () => {
  await assertFails(setDoc(me("amy"), { uid: "amy", date_of_birth: MINOR }));
});

test("an account can be created with an adult birth date", async () => {
  await assertSucceeds(setDoc(me("amy"), { uid: "amy", date_of_birth: ADULT }));
});

test("an account cannot be created already complete without a birth date", async () => {
  await assertFails(setDoc(me("amy"), {
    uid: "amy",
    photos: PHOTOS,
    has_completed_onboarding: true,
  }));
});

test("nobody else can write someone's birth date", async () => {
  await seedUser("amy", midOnboarding);
  await assertFails(updateDoc(doc(as("mallory"), "users/amy"), { date_of_birth: ADULT }));
});

test("date helpers agree with the clock this run used", () => {
  // Guards the relative dates above: if this fails the other results mean nothing.
  assert.equal(born(Y, M, D).toDate().getUTCDate(), D);
  assert.equal(born(Y - 18, M, D).toDate().getUTCFullYear(), Y - 18);
});
