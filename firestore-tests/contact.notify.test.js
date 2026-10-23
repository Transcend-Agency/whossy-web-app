// Tests for functions/src/contact.ts, run against the Firestore emulator with
// the real compiled handler and a fake mailer. They cover that each contact
// message is emailed once, with the sender as Reply-To, that failures and the
// daily cap are recorded on the message, and that what a visitor typed
// cannot break out of the email's headers or HTML.
//
// Not covered here: the real whossy.com SMTP server. Send one real message
// through the form after deploying to confirm the SMTP_PASSWORD secret.
//
// Run via `npm run test:contact` (builds functions/ first, needs Java).

const test = require("node:test");
const assert = require("node:assert/strict");

process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "whossy-app";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

// functions/lib initialises the default Admin app itself, so the test must
// use that same firebase-admin copy rather than initialising a second one.
const fns = require("../functions/lib/index.js");
const contact = require("../functions/lib/contact.js");
const admin = require("../functions/node_modules/firebase-admin");
const { Timestamp } = require(require.resolve("firebase-admin/firestore", { paths: [`${__dirname}/../functions`] }));
const db = admin.firestore();

const NOW = new Date("2026-10-24T12:00:00Z");

async function clear() {
  for (const name of ["contactMessages", "contactMessageStats"]) {
    const snap = await db.collection(name).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
}

async function seedMessage(id, overrides = {}) {
  const ref = db.collection("contactMessages").doc(id);
  await ref.set({
    name: "Ada Obi",
    email: "ada@example.com",
    message: "Hello, I have a question about premium.",
    createdAt: Timestamp.fromDate(NOW),
    ...overrides,
  });
  return ref;
}

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
  assert.ok(fns.notifyOnContactMessage, "notifyOnContactMessage missing from functions/lib/index.js");
});

test("a new message is emailed once, with the sender as Reply-To", async () => {
  const ref = await seedMessage("m1");
  const mailer = fakeMailer();

  assert.equal(await contact.notifyContactMessage(ref, mailer.send, NOW), "sent");
  assert.equal(mailer.sent.length, 1);
  const [email] = mailer.sent;
  assert.deepEqual(email.replyTo, { name: "Ada Obi", address: "ada@example.com" });
  assert.equal(email.subject, "Contact form: Ada Obi");
  assert.match(email.text, /Hello, I have a question about premium\./);
  assert.match(email.text, /Message id: m1/);

  const notification = (await ref.get()).get("notification");
  assert.equal(notification.status, "sent");
  assert.equal(notification.to, "support@whossy.com");
  assert.equal((await db.doc(`contactMessageStats/2026-10-24`).get()).get("emailed"), 1);
});

test("a second delivery of the same event sends nothing", async () => {
  const ref = await seedMessage("m2");
  const mailer = fakeMailer();
  await contact.notifyContactMessage(ref, mailer.send, NOW);
  assert.equal(await contact.notifyContactMessage(ref, mailer.send, NOW), "duplicate");
  assert.equal(mailer.sent.length, 1);
});

test("a failed send is recorded on the message", async () => {
  const ref = await seedMessage("m3");
  const mailer = fakeMailer({ fail: "535 Incorrect authentication data" });
  assert.equal(await contact.notifyContactMessage(ref, mailer.send, NOW), "failed");
  const notification = (await ref.get()).get("notification");
  assert.equal(notification.status, "failed");
  assert.match(notification.error, /535/);
});

test("past the daily cap messages are kept but not emailed", async () => {
  await db.doc("contactMessageStats/2026-10-24").set({ emailed: contact.DAILY_EMAIL_CAP });
  const ref = await seedMessage("m4");
  const mailer = fakeMailer();
  assert.equal(await contact.notifyContactMessage(ref, mailer.send, NOW), "capped");
  assert.equal(mailer.sent.length, 0);
  const notification = (await ref.get()).get("notification");
  assert.equal(notification.status, "skipped");
  assert.equal(notification.reason, "daily_cap");
  // The cap is per UTC day.
  const next = await seedMessage("m5");
  assert.equal(await contact.notifyContactMessage(next, mailer.send, new Date("2026-10-25T00:30:00Z")), "sent");
});

test("what the visitor typed cannot break the headers or the HTML", () => {
  const email = contact.buildContactEmail("m6", {
    name: "Eve\r\nBcc: victim@example.com",
    email: '"x;y"@evil.example>, other@example.com',
    message: "<script>alert(1)</script> & <b>bold</b>",
    createdAt: Timestamp.fromDate(NOW),
  });
  assert.doesNotMatch(email.subject, /[\r\n]/);
  assert.equal(email.replyTo, undefined, "a non-plain address must not reach the Reply-To header");
  assert.doesNotMatch(email.html, /<script>|<b>bold/);
  assert.match(email.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &lt;b&gt;bold&lt;\/b&gt;/);
  assert.match(email.text, /Their address could not be used for Reply-To/);
});

test("a message deleted before the trigger runs is ignored", async () => {
  const ref = db.collection("contactMessages").doc("gone");
  const mailer = fakeMailer();
  assert.equal(await contact.notifyContactMessage(ref, mailer.send, NOW), "gone");
  assert.equal(mailer.sent.length, 0);
});
