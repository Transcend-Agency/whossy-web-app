// Tests for functions/src/signup.ts, run against the Firestore emulator with
// the real compiled handler and a fake mailer. They cover that a member is
// emailed to the admin once, only when their profile becomes complete, that
// the email leaves out phone, email and birth date, that failures and the
// daily cap are recorded, and that what a member typed cannot break out of the
// email's headers or HTML.
//
// Not covered here: the real whossy.com SMTP server (same SMTP_PASSWORD secret
// as the contact form) and the live trigger. After deploying, finish a test
// profile and check support@whossy.com.
//
// Run via `npm run test:signup` (builds functions/ first, needs Java).

const test = require("node:test");
const assert = require("node:assert/strict");

process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "whossy-app";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

// functions/lib initialises the default Admin app itself, so the test must
// use that same firebase-admin copy rather than initialising a second one.
const fns = require("../functions/lib/index.js");
const signup = require("../functions/lib/signup.js");
const admin = require("../functions/node_modules/firebase-admin");
const { Timestamp } = require(require.resolve("firebase-admin/firestore", { paths: [`${__dirname}/../functions`] }));
const db = admin.firestore();

const NOW = new Date("2026-11-25T12:00:00Z");

async function clear() {
  for (const name of ["signupNotifications", "signupNotificationStats"]) {
    const snap = await db.collection(name).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
}

const member = (overrides = {}) => ({
  first_name: "Ada",
  last_name: "Obi",
  gender: "Female",
  country_of_origin: "Nigeria",
  auth_provider: "phone",
  phone_number: "+2348000000000",
  email: "ada@example.com",
  date_of_birth: Timestamp.fromDate(new Date("1995-05-05")),
  created_at: Timestamp.fromDate(new Date("2026-11-25T11:30:00Z")),
  has_completed_onboarding: true,
  ...overrides,
});

function fakeMailer({ fail } = {}) {
  const sent = [];
  const send = async (email) => {
    if (fail) throw new Error(fail);
    sent.push(email);
  };
  return { sent, send };
}

test.beforeEach(clear);
test.after(async () => {
  await clear();
  await admin.app().delete();
});

test("the trigger is exported for deploy", () => {
  assert.ok(fns.notifyAdminOnSignup, "notifyAdminOnSignup missing from functions/lib/index.js");
});

test("only the write that completes the profile counts", () => {
  const f = signup.justCompletedOnboarding;
  assert.equal(f(undefined, { has_completed_onboarding: true }), true, "created already complete");
  assert.equal(f({ has_completed_onboarding: false }, { has_completed_onboarding: true }), true);
  assert.equal(f({}, { has_completed_onboarding: true }), true, "flag absent before");
  assert.equal(f({ has_completed_onboarding: true }, { has_completed_onboarding: true }), false, "unrelated update");
  assert.equal(f({ has_completed_onboarding: false }, { has_completed_onboarding: false }), false, "still incomplete");
  assert.equal(f({ has_completed_onboarding: true }, { has_completed_onboarding: false }), false, "reset");
  assert.equal(f({ has_completed_onboarding: false }, undefined), false, "deleted");
});

test("a new member is emailed once", async () => {
  const mailer = fakeMailer();
  assert.equal(await signup.notifySignup("u1", member(), mailer.send, NOW), "sent");
  assert.equal(mailer.sent.length, 1);

  const email = mailer.sent[0];
  assert.equal(email.subject, "New Whossy member: Ada Obi");
  for (const want of ["Ada Obi", "Female", "Nigeria", "phone", "u1"]) {
    assert.ok(email.text.includes(want), `text missing ${want}`);
    assert.ok(email.html.includes(want), `html missing ${want}`);
  }

  const record = (await db.collection("signupNotifications").doc("u1").get()).data();
  assert.equal(record.status, "sent");
  assert.equal(record.to, "support@whossy.com");
  assert.equal((await db.collection("signupNotificationStats").doc("2026-11-25").get()).get("emailed"), 1);
});

test("the email leaves out phone, email address and birth date", async () => {
  const mailer = fakeMailer();
  await signup.notifySignup("u1", member(), mailer.send, NOW);
  const { subject, text, html } = mailer.sent[0];
  for (const secret of ["+2348000000000", "ada@example.com", "1995"]) {
    assert.ok(!subject.includes(secret) && !text.includes(secret) && !html.includes(secret), `leaked ${secret}`);
  }
  assert.equal(mailer.sent[0].replyTo, undefined);
});

test("a re-delivered trigger or a later flag flip does not email twice", async () => {
  const mailer = fakeMailer();
  assert.equal(await signup.notifySignup("u1", member(), mailer.send, NOW), "sent");
  assert.equal(await signup.notifySignup("u1", member(), mailer.send, NOW), "duplicate");
  assert.equal(mailer.sent.length, 1);
});

test("a failed send is recorded on the member's record", async () => {
  const mailer = fakeMailer({ fail: "SMTP down" });
  assert.equal(await signup.notifySignup("u1", member(), mailer.send, NOW), "failed");
  const record = (await db.collection("signupNotifications").doc("u1").get()).data();
  assert.equal(record.status, "failed");
  assert.equal(record.error, "SMTP down");
});

test("past the daily cap members are recorded but not emailed", async () => {
  await db.collection("signupNotificationStats").doc("2026-11-25").set({ emailed: signup.DAILY_SIGNUP_EMAIL_CAP });
  const mailer = fakeMailer();
  assert.equal(await signup.notifySignup("u1", member(), mailer.send, NOW), "capped");
  assert.equal(mailer.sent.length, 0);
  const record = (await db.collection("signupNotifications").doc("u1").get()).data();
  assert.equal(record.status, "skipped");
  assert.equal(record.reason, "daily_cap");

  // The next day the cap resets.
  const tomorrow = new Date("2026-11-26T09:00:00Z");
  assert.equal(await signup.notifySignup("u2", member(), mailer.send, tomorrow), "sent");
});

test("what a member typed cannot break out of the subject or HTML", async () => {
  const mailer = fakeMailer();
  await signup.notifySignup(
    "u1",
    member({ first_name: 'Eve\r\nBcc: attacker@example.com', last_name: '<script>alert(1)</script>' }),
    mailer.send,
    NOW
  );
  const { subject, html } = mailer.sent[0];
  assert.ok(!/[\r\n]/.test(subject), "subject has a line break");
  assert.ok(!html.includes("<script>"), "html contains a raw script tag");
  assert.ok(html.includes("&lt;script&gt;"));
});

test("missing fields still produce a readable email", async () => {
  const mailer = fakeMailer();
  await signup.notifySignup("u1", { has_completed_onboarding: true }, mailer.send, NOW);
  assert.equal(mailer.sent[0].subject, "New Whossy member: A new member");
  assert.ok(mailer.sent[0].text.includes("Country: not set"));
});
