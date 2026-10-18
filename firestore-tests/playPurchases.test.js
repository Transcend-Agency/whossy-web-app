// Tests for functions/src/playPurchases.ts against the Firestore emulator,
// with the real compiled functions and a stubbed Google Play API.
//
// They cover what a typecheck cannot: that credits and premium are granted
// only for a purchase Google reports as complete, from the server's own price
// table, once per purchase token, and never to a second account.
//
// Not covered: the real Play Developer API. The response shapes stubbed below
// follow Google's reference (purchases.products and purchases.subscriptionsv2)
// and must be confirmed with a real test purchase from an internal-testing
// install once the Play Console API access is set up.
//
// Run via `npm run test:play` (builds functions/ first, needs Java).

const test = require("node:test");
const assert = require("node:assert/strict");

process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "whossy-app";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.APP_FRONTEND_URL = "https://app.example.test";
process.env.PAYSTACK_SECRET_KEY_NGN = "sk_test_emulator_only_ngn";
process.env.PAYSTACK_SECRET_KEY_KES = "sk_test_emulator_only_kes";
process.env.NOMBA_CLIENT_SECRET = "nomba_emulator_only";

const fns = require("../functions/lib/index.js");
const play = require("../functions/lib/playPurchases.js");
const admin = require("../functions/node_modules/firebase-admin");
const db = admin.firestore();

const realFetch = global.fetch;
let playState; // what Google would answer, per test
let playCalls;

play.playAuth.token = async () => "test-access-token";

function stubFetch() {
  playCalls = [];
  global.fetch = async (url, init = {}) => {
    const u = String(url);
    playCalls.push({ url: u, auth: init.headers?.Authorization });
    if (playState.status && playState.status !== 200) return { ok: false, status: playState.status, json: async () => ({}) };
    if (u.includes("/purchases/products/")) return { ok: true, status: 200, json: async () => playState.product };
    if (u.includes("/purchases/subscriptionsv2/")) return { ok: true, status: 200, json: async () => playState.subscription };
    throw new Error(`unexpected call: ${u}`);
  };
}

const callAs = (uid, data) => ({ auth: { uid, token: {} }, data });
const user = async (uid) => (await db.collection("users").doc(uid).get()).data();
const seedUser = (uid, extra = {}) =>
  db.collection("users").doc(uid).set({ uid, credit_balance: 0, is_premium: false, ...extra });
const rejects = (promise, code) =>
  assert.rejects(promise, (e) => (code ? e.code === code : true));

test.after(async () => {
  global.fetch = realFetch;
  await admin.app().delete();
});

test.beforeEach(async () => {
  for (const col of await db.listCollections()) {
    await Promise.all((await col.listDocuments()).map((d) => db.recursiveDelete(d)));
  }
  playState = { product: { purchaseState: 0, orderId: "GPA.1" }, subscription: {} };
  stubFetch();
});

test("a completed credit purchase grants the pack's credits once, however often it is re-sent", async () => {
  await seedUser("a");
  const req = callAs("a", { productId: "credits_10_usd", purchaseToken: "token-1" });
  const first = await fns.verifyPlayPurchase.run(req);
  assert.equal(first.credits, 10);
  assert.equal(first.alreadyGranted, false);
  const again = await fns.verifyPlayPurchase.run(req);
  assert.equal(again.alreadyGranted, true);
  assert.equal((await user("a")).credit_balance, 10);
});

test("the credits come from the server's table: an unknown product grants nothing", async () => {
  await seedUser("a");
  await rejects(fns.verifyPlayPurchase.run(callAs("a", { productId: "credits_100000_usd", purchaseToken: "t" })), "invalid-argument");
  await rejects(fns.verifyPlayPurchase.run(callAs("a", { productId: "anything_else", purchaseToken: "t" })), "invalid-argument");
  assert.equal((await user("a")).credit_balance, 0);
  assert.equal(playCalls.length, 0, "no Google call is made for a product we do not sell");
});

test("a purchase that Google reports as pending or cancelled grants nothing", async () => {
  await seedUser("a");
  for (const purchaseState of [1, 2]) {
    playState.product = { purchaseState };
    await rejects(fns.verifyPlayPurchase.run(callAs("a", { productId: "credits_5_usd", purchaseToken: `t${purchaseState}` })), "failed-precondition");
  }
  assert.equal((await user("a")).credit_balance, 0);
});

test("a purchase token Google does not recognise grants nothing", async () => {
  await seedUser("a");
  playState.status = 404;
  await rejects(fns.verifyPlayPurchase.run(callAs("a", { productId: "credits_5_usd", purchaseToken: "forged" })), "failed-precondition");
  assert.equal((await user("a")).credit_balance, 0);
});

test("when Google cannot be reached nothing is granted and the app is told to retry", async () => {
  await seedUser("a");
  playState.status = 503;
  await rejects(fns.verifyPlayPurchase.run(callAs("a", { productId: "credits_5_usd", purchaseToken: "t" })), "unavailable");
  assert.equal((await user("a")).credit_balance, 0);
  assert.equal((await db.collection("playPurchases").get()).size, 0, "nothing recorded, so a retry can still succeed");
});

test("one purchase cannot be claimed by two accounts", async () => {
  await seedUser("a");
  await seedUser("b");
  const data = { productId: "credits_20_usd", purchaseToken: "shared-token" };
  await fns.verifyPlayPurchase.run(callAs("a", data));
  await rejects(fns.verifyPlayPurchase.run(callAs("b", data)), "permission-denied");
  assert.equal((await user("a")).credit_balance, 20);
  assert.equal((await user("b")).credit_balance, 0);
});

test("the credit-pack check calls Google with the product, the token and a bearer token", async () => {
  await seedUser("a");
  await fns.verifyPlayPurchase.run(callAs("a", { productId: "credits_1_usd", purchaseToken: "tok/with+chars" }));
  assert.equal(playCalls.length, 1);
  assert.match(playCalls[0].url, /applications\/com\.whossy\.whossy_app\/purchases\/products\/credits_1_usd\/tokens\/tok%2Fwith%2Bchars$/);
  assert.equal(playCalls[0].auth, "Bearer test-access-token");
});

test("an active subscription makes the account premium until Google's expiry and records the token", async () => {
  await seedUser("a");
  const expiry = new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString();
  playState.subscription = {
    subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
    lineItems: [{ productId: "subscription_1months", expiryTime: expiry }],
  };
  const out = await fns.verifyPlayPurchase.run(callAs("a", { productId: "subscription_1months", purchaseToken: "sub-1" }));
  assert.equal(out.kind, "subscription");
  const u = await user("a");
  assert.equal(u.is_premium, true);
  assert.equal(u.current_plan, "subscription_1months");
  assert.equal(u.payment_platform, "mobile");
  assert.equal(u.purchase_token, "sub-1");
  assert.equal(u.premium_expires_at.toDate().toISOString(), expiry);
});

test("an expired, on-hold or wrong-product subscription does not make the account premium", async () => {
  await seedUser("a");
  const future = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
  const past = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const cases = [
    { subscriptionState: "SUBSCRIPTION_STATE_EXPIRED", lineItems: [{ productId: "subscription_1months", expiryTime: past }] },
    { subscriptionState: "SUBSCRIPTION_STATE_ON_HOLD", lineItems: [{ productId: "subscription_1months", expiryTime: future }] },
    { subscriptionState: "SUBSCRIPTION_STATE_ACTIVE", lineItems: [{ productId: "subscription_1year_usd", expiryTime: future }] },
    { subscriptionState: "SUBSCRIPTION_STATE_ACTIVE", lineItems: [{ productId: "subscription_1months", expiryTime: past }] },
  ];
  for (const [i, subscription] of cases.entries()) {
    playState.subscription = subscription;
    await rejects(fns.verifyPlayPurchase.run(callAs("a", { productId: "subscription_1months", purchaseToken: `s${i}` })), "failed-precondition");
  }
  assert.equal((await user("a")).is_premium, false);
});

test("a cancelled subscription that is paid up keeps premium until it runs out", async () => {
  await seedUser("a");
  const expiry = new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString();
  playState.subscription = {
    subscriptionState: "SUBSCRIPTION_STATE_CANCELED",
    lineItems: [{ productId: "subscription_3months_usd", expiryTime: expiry }],
  };
  await fns.verifyPlayPurchase.run(callAs("a", { productId: "subscription_3months_usd", purchaseToken: "sub-c" }));
  assert.equal((await user("a")).is_premium, true);
});

test("a subscription token already used by another account is refused", async () => {
  await seedUser("a");
  await seedUser("b");
  playState.subscription = {
    subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
    lineItems: [{ productId: "subscription_1months", expiryTime: new Date(Date.now() + 86400000).toISOString() }],
  };
  const data = { productId: "subscription_1months", purchaseToken: "sub-shared" };
  await fns.verifyPlayPurchase.run(callAs("a", data));
  await rejects(fns.verifyPlayPurchase.run(callAs("b", data)), "permission-denied");
  assert.equal((await user("b")).is_premium, false);
});

test("signed-out callers and malformed requests are refused before any Google call", async () => {
  await rejects(fns.verifyPlayPurchase.run({ data: { productId: "credits_5_usd", purchaseToken: "t" } }), "unauthenticated");
  await seedUser("a");
  await rejects(fns.verifyPlayPurchase.run(callAs("a", { productId: "credits_5_usd" })), "invalid-argument");
  await rejects(fns.verifyPlayPurchase.run(callAs("a", {})), "invalid-argument");
  assert.equal(playCalls.length, 0);
});

test("the purchase records are not readable or writable by a signed-in client", async () => {
  const { initializeTestEnvironment, assertFails } = require("@firebase/rules-unit-testing");
  const fs = require("node:fs");
  const path = require("node:path");
  const { doc, getDoc, setDoc } = require("firebase/firestore");
  const env = await initializeTestEnvironment({
    projectId: "whossy-play-rules",
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8"),
      host: process.env.FIRESTORE_EMULATOR_HOST.split(":")[0],
      port: Number(process.env.FIRESTORE_EMULATOR_HOST.split(":")[1]),
    },
  });
  const client = env.authenticatedContext("a").firestore();
  await assertFails(getDoc(doc(client, "playPurchases", "x")));
  await assertFails(setDoc(doc(client, "playPurchases", "x"), { uid: "a" }));
  await env.cleanup();
});
