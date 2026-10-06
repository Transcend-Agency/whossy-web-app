// Tests for functions/src/payments.ts, run against the Firestore emulator
// with the real compiled functions and a stubbed provider API. They cover
// what cannot be seen from a typecheck: who a payment is granted to, that it
// is granted once, and that the webhook refuses anything it cannot
// authenticate.
//
// Not covered here: the real Paystack and Nomba APIs. The response shapes
// stubbed below are taken from their documentation and must still be
// confirmed against each provider's sandbox.
//
// Run via `npm run test:payments` (builds functions/ first, needs Java).

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const SECRET = "sk_test_emulator_only";
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "whossy-app";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.PAYSTACK_SECRET_KEY = SECRET;
process.env.NOMBA_CLIENT_SECRET = "nomba_emulator_only";
process.env.APP_FRONTEND_URL = "https://app.example.test";

// functions/lib initialises the default Admin app itself, so the test must
// use that same firebase-admin copy rather than initialising a second one.
const fns = require("../functions/lib/index.js");
const admin = require("../functions/node_modules/firebase-admin");
const db = admin.firestore();

const PLAN = "PLN_pmtergy4o4vv216";
const realFetch = global.fetch;
let paystack; // per-test stub of what Paystack would answer
let fetchCalls;

function stubFetch() {
  fetchCalls = [];
  global.fetch = async (url, init = {}) => {
    const path = String(url).replace("https://api.paystack.co", "");
    fetchCalls.push({ path, method: init.method });
    const respond = (body) => ({ ok: true, status: 200, json: async () => body });
    if (path === "/transaction/initialize") {
      return respond({ status: true, data: { authorization_url: "https://checkout.example.test/abc" } });
    }
    if (path.startsWith("/transaction/verify/")) return respond({ status: true, data: paystack.verify });
    if (path.startsWith("/customer/")) {
      paystack.customerLookups.push(decodeURIComponent(path.slice("/customer/".length)));
      return respond({ status: true, data: { subscriptions: paystack.subscriptions } });
    }
    if (path === "/subscription/disable") return respond({ status: true });
    throw new Error(`unexpected provider call: ${path}`);
  };
}

const callAs = (uid, email) => ({ auth: { uid, token: email ? { email } : {} } });

async function seedUser(uid, data = {}) {
  await db.collection("users").doc(uid).set({ uid, email: `${uid}@example.test`, credit_balance: 0, is_premium: false, ...data });
}

const user = async (uid) => (await db.collection("users").doc(uid).get()).data();

function webhookRequest(body, { signature } = {}) {
  const rawBody = Buffer.from(JSON.stringify(body));
  const validSignature = crypto.createHmac("sha512", SECRET).update(rawBody).digest("hex");
  const headers = { "x-paystack-signature": signature === undefined ? validSignature : signature };
  return {
    method: "POST",
    body,
    rawBody,
    headers,
    get: (name) => headers[name.toLowerCase()] ?? undefined,
    header: (name) => headers[name.toLowerCase()] ?? undefined,
  };
}

async function postWebhook(body, options) {
  const result = {};
  const res = {
    status(code) { result.status = code; return res; },
    send(text) { result.text = text; return res; },
    json(obj) { result.json = obj; return res; },
    setHeader() {},
    on() {},
  };
  await fns.paystackWebhook(webhookRequest(body, options), res);
  return result;
}

test.after(async () => {
  global.fetch = realFetch;
  await admin.app().delete();
});

test.beforeEach(async () => {
  for (const col of await db.listCollections()) {
    await Promise.all((await col.listDocuments()).map((d) => db.recursiveDelete(d)));
  }
  paystack = { verify: {}, subscriptions: [], customerLookups: [] };
  stubFetch();
});

test("P1: a subscription checkout starts, and its payment is recorded before the provider is called", async () => {
  await seedUser("alice");
  const out = await fns.createTransaction.run({
    ...callAs("alice", "alice@example.test"),
    data: { purpose: "subscription", currency: "ngn" },
  });

  assert.equal(out.checkoutUrl, "https://checkout.example.test/abc");
  const payment = (await db.collection("payments").doc(out.reference).get()).data();
  assert.equal(payment.status, "pending");
  assert.equal(payment.uid, "alice");
  assert.equal("credits" in payment, false);
});

test("the client cannot choose the amount or the credits: both come from the server price table", async () => {
  await seedUser("alice");
  const out = await fns.createTransaction.run({
    ...callAs("alice", "alice@example.test"),
    data: { purpose: "credits", currency: "ngn", creditOptionIndex: 0, amount: 1, credits: 99999 },
  });
  const payment = (await db.collection("payments").doc(out.reference).get()).data();
  assert.equal(payment.amount, 10000);
  assert.equal(payment.credits, 50);
});

test("credits are granted only after the provider confirms, and only once", async () => {
  await seedUser("alice");
  const { reference } = await fns.createTransaction.run({
    ...callAs("alice", "alice@example.test"),
    data: { purpose: "credits", currency: "ngn", creditOptionIndex: 1 },
  });
  assert.equal((await user("alice")).credit_balance, 0);

  paystack.verify = { status: "success", amount: 20000 * 100, currency: "NGN" };
  const first = await fns.verifyTransaction.run({ ...callAs("alice"), data: { reference } });
  const second = await fns.verifyTransaction.run({ ...callAs("alice"), data: { reference } });

  assert.equal(first.status, "success");
  assert.equal(second.status, "completed");
  const alice = await user("alice");
  assert.equal(alice.credit_balance, 100);
  assert.equal(alice.amount_paid_in_total.naira, 20000);
});

test("a payment the provider reports as failed, or for the wrong amount, grants nothing", async () => {
  await seedUser("alice");
  const { reference } = await fns.createTransaction.run({
    ...callAs("alice", "alice@example.test"),
    data: { purpose: "credits", currency: "ngn", creditOptionIndex: 3 },
  });

  paystack.verify = { status: "failed", amount: 40000 * 100, currency: "NGN" };
  await assert.rejects(fns.verifyTransaction.run({ ...callAs("alice"), data: { reference } }), /could not be verified/);

  // Paid, but for the cheapest option while claiming the largest.
  paystack.verify = { status: "success", amount: 10000 * 100, currency: "NGN" };
  await assert.rejects(fns.verifyTransaction.run({ ...callAs("alice"), data: { reference } }), /could not be verified/);

  assert.equal((await user("alice")).credit_balance, 0);
});

test("one user cannot verify, and so claim, another user's payment", async () => {
  await seedUser("alice");
  await seedUser("mallory");
  const { reference } = await fns.createTransaction.run({
    ...callAs("alice", "alice@example.test"),
    data: { purpose: "credits", currency: "ngn", creditOptionIndex: 0 },
  });
  paystack.verify = { status: "success", amount: 10000 * 100, currency: "NGN" };

  await assert.rejects(fns.verifyTransaction.run({ ...callAs("mallory"), data: { reference } }), /does not belong to you/);
  assert.equal((await user("mallory")).credit_balance, 0);
  assert.equal((await user("alice")).credit_balance, 0);
});

test("a subscription is matched on the plan, records what was really charged, and gets an expiry", async () => {
  await seedUser("alice");
  const { reference } = await fns.createTransaction.run({
    ...callAs("alice", "alice@example.test"),
    data: { purpose: "subscription", currency: "ngn" },
  });
  // The plan's own price differs from the amount in our table.
  paystack.verify = {
    status: "success", amount: 45000 * 100, currency: "NGN", plan: PLAN,
    customer: { customer_code: "CUS_alice" },
  };
  await fns.verifyTransaction.run({ ...callAs("alice"), data: { reference } });

  const alice = await user("alice");
  assert.equal(alice.is_premium, true);
  assert.equal(alice.amount_paid_in_total.naira, 45000);
  assert.ok(alice.premium_expires_at.toMillis() > Date.now());
  const billing = (await db.doc("users/alice/private/billing").get()).data();
  assert.equal(billing.paystack_customer_code, "CUS_alice");
});

test("P2: editing your profile email to someone else's does not let you cancel their subscription", async () => {
  await seedUser("victim", { is_premium: true });
  await db.doc("users/victim/private/billing").set({ paystack_customer_code: "CUS_victim" });
  // Mallory has pointed her profile email at the victim.
  await seedUser("mallory", { email: "victim@example.test" });
  paystack.subscriptions = [];

  await assert.rejects(
    fns.cancelSubscription.run({ ...callAs("mallory", "mallory@example.test"), data: undefined }),
    /No active subscription/
  );

  assert.deepEqual(paystack.customerLookups, ["mallory@example.test"]);
  assert.equal((await user("victim")).is_premium, true);
});

test("cancelling uses the stored customer code and the active subscription, not the first listed", async () => {
  await seedUser("alice", { is_premium: true });
  await db.doc("users/alice/private/billing").set({ paystack_customer_code: "CUS_alice" });
  paystack.subscriptions = [
    { status: "cancelled", subscription_code: "SUB_old", email_token: "old" },
    { status: "active", subscription_code: "SUB_live", email_token: "live" },
  ];
  let disabled;
  const stubbed = global.fetch;
  global.fetch = async (url, init = {}) => {
    if (String(url).endsWith("/subscription/disable")) disabled = JSON.parse(init.body);
    return stubbed(url, init);
  };

  await fns.cancelSubscription.run({ ...callAs("alice", "alice@example.test"), data: undefined });

  assert.deepEqual(paystack.customerLookups, ["CUS_alice"]);
  assert.equal(disabled.code, "SUB_live");
  assert.equal((await user("alice")).is_premium, false);
});

test("webhook: a forged charge.success with no valid signature is rejected and grants nothing", async () => {
  await seedUser("alice");
  const forged = {
    event: "charge.success",
    data: { reference: "anything", amount: 5000000, currency: "NGN", metadata: { userId: "alice", uid: "alice" } },
  };

  const unsigned = await postWebhook(forged, { signature: null });
  const wrong = await postWebhook(forged, { signature: "0".repeat(128) });

  assert.equal(unsigned.status, 401);
  assert.equal(wrong.status, 401);
  assert.equal(fetchCalls.length, 0);
  assert.equal((await user("alice")).is_premium, false);
  assert.equal((await db.collection("payments").get()).size, 0);
});

test("webhook: a correctly signed event still cannot grant premium to a user named only in its metadata", async () => {
  await seedUser("alice");
  const res = await postWebhook({
    event: "charge.success",
    data: { reference: "made_up_ref", amount: 5000000, currency: "NGN", metadata: { userId: "alice", uid: "alice" } },
  });

  assert.equal(res.status, 200);
  assert.equal((await user("alice")).is_premium, false);
  assert.equal((await user("alice")).credit_balance, 0);
});

test("webhook: grants a real payment when the customer never returns to the callback page", async () => {
  await seedUser("alice");
  const { reference } = await fns.createTransaction.run({
    ...callAs("alice", "alice@example.test"),
    data: { purpose: "credits", currency: "ngn", creditOptionIndex: 0 },
  });
  paystack.verify = { status: "success", amount: 10000 * 100, currency: "NGN" };

  const res = await postWebhook({ event: "charge.success", data: { reference } });

  assert.equal(res.status, 200);
  assert.equal((await user("alice")).credit_balance, 50);
});

test("webhook and callback racing for the same payment credit it once", async () => {
  await seedUser("alice");
  const { reference } = await fns.createTransaction.run({
    ...callAs("alice", "alice@example.test"),
    data: { purpose: "credits", currency: "ngn", creditOptionIndex: 0 },
  });
  paystack.verify = { status: "success", amount: 10000 * 100, currency: "NGN" };

  await Promise.all([
    postWebhook({ event: "charge.success", data: { reference } }),
    fns.verifyTransaction.run({ ...callAs("alice"), data: { reference } }),
    postWebhook({ event: "charge.success", data: { reference } }),
  ]);

  assert.equal((await user("alice")).credit_balance, 50);
});

test("webhook: a renewal extends premium for the stored customer, once per reference", async () => {
  await seedUser("alice", { is_premium: true });
  await db.doc("paystack_customers/CUS_alice").set({ uid: "alice" });
  const renewal = {
    event: "charge.success",
    data: { reference: "T_renewal_1", amount: 45000 * 100, currency: "NGN", plan: { plan_code: PLAN }, customer: { customer_code: "CUS_alice" } },
  };

  await postWebhook(renewal);
  await postWebhook(renewal); // Paystack redelivers

  const alice = await user("alice");
  assert.equal(alice.amount_paid_in_total.naira, 45000);
  assert.ok(alice.premium_expires_at.toMillis() > Date.now());
});

test("expirePremium ends lapsed premium and leaves accounts with no expiry alone", async () => {
  const past = admin.firestore.Timestamp.fromMillis(Date.now() - 1000);
  const future = admin.firestore.Timestamp.fromMillis(Date.now() + 86400000);
  await seedUser("lapsed", { is_premium: true, premium_expires_at: past });
  await seedUser("current", { is_premium: true, premium_expires_at: future });
  await seedUser("legacy", { is_premium: true });

  await fns.expirePremium.run({});

  assert.equal((await user("lapsed")).is_premium, false);
  assert.equal((await user("current")).is_premium, true);
  assert.equal((await user("legacy")).is_premium, true);
});
