// Seeds the emulators with a few accounts for clicking through the web app
// locally (see src/firebase/index.ts, VITE_USE_EMULATORS). Emulator only: it
// refuses to run without the emulator hosts set. The generated password is
// written to .emulator-credentials.local, which is gitignored.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

for (const host of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST"]) {
  if (!process.env[host]) throw new Error(`${host} is not set; this script only seeds the emulators.`);
}
process.env.GCLOUD_PROJECT = "demo-whossy";

const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-whossy" });
const db = admin.firestore();
const { Timestamp } = admin.firestore;

// The login form insists on a special character and a digit.
const password = `${crypto.randomBytes(9).toString("base64url")}!7a`;
const photo = (n) => `https://picsum.photos/seed/whossy${n}/400/600`;
const tour = { explore: true, "swipe-and-match": true, matches: true, chat: true, "user-profile": true, notification: true };

const profile = (uid, email, first, extra = {}) => ({
  uid, email, first_name: first, last_name: "Test", auth_provider: "local", phone_number: "+15550000000",
  gender: "Male", country_of_origin: "Nigeria", date_of_birth: Timestamp.fromDate(new Date("1995-05-05")),
  bio: `${first} is an emulator test account.`, interests: ["Music", "Travel"], meet: 2, preference: 0, distance: 50,
  drink: 0, smoke: 0, workout: 0, pets: 0, education: 0,
  photos: [photo(uid + 1), photo(uid + 2)], blockedIds: [],
  has_completed_account_creation: true, has_completed_onboarding: true,
  is_approved: true, is_banned: false, is_premium: false, credit_balance: 3, credits_on_hold: 0,
  face_verification: { status: "approved", photo: photo(uid + "s"), reviewed_by: "seed", reviewed_at: Timestamp.now() },
  user_settings: { online_status: true, public_search: true, read_receipts: true },
  tour_guide: tour, created_at: Timestamp.now(),
  ...extra,
});

const accounts = [
  profile("tester", "tester@example.test", "Tessa", { gender: "Female" }),
  profile("bob", "bob@example.test", "Bob"),
  profile("carol", "carol@example.test", "Carol", { gender: "Female" }),
  profile("shorty", "shorty@example.test", "Shorty", { photos: [photo("shorty1")] }),
  profile("legacy", "legacy@example.test", "Legacy", { face_verification: { retake_photo: false, photo: photo("legacys") } }),
  { uid: "fresh", email: "fresh@example.test", first_name: "Fresh", last_name: "Test", auth_provider: "local",
    phone_number: "+15550000001", gender: "Male", country_of_origin: "Nigeria",
    has_completed_account_creation: true, has_completed_onboarding: false, is_approved: false, created_at: Timestamp.now() },
];

(async () => {
  for (const account of accounts) {
    await admin.auth().createUser({ uid: account.uid, email: account.email, password, emailVerified: true }).catch((err) => {
      if (err.code !== "auth/uid-already-exists") throw err;
    });
    await admin.auth().updateUser(account.uid, { password });
    await db.collection("users").doc(account.uid).set(account);
    await db.collection("filters").doc(account.uid).set({ age_range: { min: 18, max: 60 }, meet: 2, distance: 50 });
    await db.collection("advancedSearchPreferences").doc(account.uid).set({ gender: "", age_range: { min: 18, max: 100 }, country: "" });
  }
  // Bob has already liked the tester, so a like back should produce a match.
  await db.doc("likes/bob_tester").set({ uid: "bob_tester", liker_id: "bob", liked_id: "tester", timestamp: Timestamp.now() });
  await db.doc("Challenges/c1").set({ active: true, instruction: "Raise one hand", image_url: photo("pose") });

  fs.writeFileSync(path.join(__dirname, ".emulator-credentials.local"),
    `# Emulator-only test accounts. Regenerated on every seed.\npassword=${password}\n` +
    accounts.map((a) => `email=${a.email}`).join("\n") + "\n");
  console.log(`Seeded ${accounts.length} accounts. Password is in firestore-tests/.emulator-credentials.local`);
  await admin.app().delete();
})();
