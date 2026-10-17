import { createHmac, timingSafeEqual } from "node:crypto";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const db = () => admin.firestore();

// Naira and Kenyan shillings run on two separate Paystack integrations,
// each with its own key. A request, and a webhook signature, has to use the
// key of the integration the money went through.
const PAYSTACK_SECRET_KEY_NGN = defineSecret("PAYSTACK_SECRET_KEY_NGN");
const PAYSTACK_SECRET_KEY_KES = defineSecret("PAYSTACK_SECRET_KEY_KES");
const PAYSTACK_SECRETS = [PAYSTACK_SECRET_KEY_NGN, PAYSTACK_SECRET_KEY_KES];

function paystackKey(currency: Currency): string {
  return (currency === "kes" ? PAYSTACK_SECRET_KEY_KES : PAYSTACK_SECRET_KEY_NGN).value();
}
const NOMBA_CLIENT_SECRET = defineSecret("NOMBA_CLIENT_SECRET");
const APP_FRONTEND_URL = defineString("APP_FRONTEND_URL");

const NOMBA_CLIENT_ID = "cd43380e-d783-4572-a9e7-5d67c3f3f479";
const NOMBA_ACCOUNT_ID = "5909f326-c021-4fa9-b1d4-f5e5e83936f3";

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const NOMBA_BASE_URL = "https://api.nomba.com";

const CREDIT_OPTIONS = [
  { credits: 50, usd: 10, ngn: 10000, kes: 800 },
  { credits: 100, usd: 20, ngn: 20000, kes: 1600 },
  { credits: 200, usd: 30, ngn: 30000, kes: 2400 },
  { credits: 1000, usd: 40, ngn: 40000, kes: 3200 },
] as const;

// Mirrors SubscriptionPlanModal.tsx. KES has no plan yet (the client
// currently shows "Plan for kenyan shellings hasn't been created" — same
// restriction enforced here).
const SUBSCRIPTION_PLANS = {
  ngn: { amount: 50000, plan: "PLN_pmtergy4o4vv216" },
  usd: { amount: 30 },
} as const;

type Currency = "ngn" | "kes" | "usd";
type Purpose = "credits" | "subscription";
type Provider = "paystack" | "nomba";

function providerFor(currency: Currency): Provider {
  return currency === "usd" ? "nomba" : "paystack";
}

function frontendUrl(): string {
  const url = APP_FRONTEND_URL.value();
  if (!url) {
    throw new HttpsError(
      "failed-precondition",
      "APP_FRONTEND_URL is not configured for this function."
    );
  }
  return url;
}

interface PaymentDoc {
  uid: string;
  purpose: Purpose;
  provider: Provider;
  currency: Currency;
  amount: number; // major units (naira, KES, or dollars) — matches what the provider is charged
  credits?: number;
  status: "pending" | "completed" | "failed";
  created_at: FieldValue;
  verified_at?: FieldValue;
}

const AMOUNT_PAID_KEY: Record<Currency, string> = {
  ngn: "naira",
  kes: "kenyan_shillings",
  usd: "usd",
};

const DAY_MS = 24 * 60 * 60 * 1000;
// Used until the provider tells us the real renewal date, and for Nomba,
// which has no renewal: premium lapses unless the user pays again.
const DEFAULT_PREMIUM_DAYS = 31;
// Slack past the renewal date so a charge that settles a little late does
// not drop a paying subscriber.
const RENEWAL_GRACE_DAYS = 3;

// Server-only: no rule matches users/{uid}/private or paystack_customers,
// so clients can neither read nor write them. They hold what the webhook
// and cancelSubscription need to tie a Paystack customer to a user without
// trusting anything the client can edit.
function billingRef(uid: string) {
  return db().collection("users").doc(uid).collection("private").doc("billing");
}

function paystackCustomerRef(customerCode: string) {
  return db().collection("paystack_customers").doc(customerCode);
}

function premiumExpiry(nextPaymentDate?: string | null): Timestamp {
  const next = nextPaymentDate ? Date.parse(nextPaymentDate) : NaN;
  return Number.isNaN(next)
    ? Timestamp.fromMillis(Date.now() + DEFAULT_PREMIUM_DAYS * DAY_MS)
    : Timestamp.fromMillis(next + RENEWAL_GRACE_DAYS * DAY_MS);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function paystackFetch(currency: Currency, path: string, init: RequestInit): Promise<any> {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${paystackKey(currency)}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body: any = await res.json(); // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!res.ok || body?.status === false) {
    logger.error("Paystack request failed", { path, status: res.status, body });
    throw new HttpsError("internal", "Paystack request failed.");
  }
  return body;
}

async function nombaAccessToken(): Promise<string> {
  const res = await fetch(`${NOMBA_BASE_URL}/v1/auth/token/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accountId: NOMBA_ACCOUNT_ID,
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: NOMBA_CLIENT_ID,
      client_secret: NOMBA_CLIENT_SECRET.value(),
    }),
  });
  const body: any = await res.json(); // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!res.ok) {
    logger.error("Nomba auth failed", { status: res.status, body });
    throw new HttpsError("internal", "Nomba authentication failed.");
  }
  return body.data.access_token as string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function nombaFetch(path: string, init: RequestInit): Promise<any> {
  const token = await nombaAccessToken();
  const res = await fetch(`${NOMBA_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      accountId: NOMBA_ACCOUNT_ID,
      ...(init.headers ?? {}),
    },
  });
  const body: any = await res.json(); // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!res.ok) {
    logger.error("Nomba request failed", { path, status: res.status, body });
    throw new HttpsError("internal", "Nomba request failed.");
  }
  return body;
}

interface CreateTransactionRequest {
  purpose: Purpose;
  currency: Currency;
  creditOptionIndex?: number;
}

export const createTransaction = onCall<CreateTransactionRequest>(
  { secrets: [...PAYSTACK_SECRETS, NOMBA_CLIENT_SECRET] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to pay.");

    const { purpose, currency, creditOptionIndex } = request.data ?? {};
    if (purpose !== "credits" && purpose !== "subscription") {
      throw new HttpsError("invalid-argument", "purpose must be 'credits' or 'subscription'.");
    }
    if (currency !== "ngn" && currency !== "kes" && currency !== "usd") {
      throw new HttpsError("invalid-argument", "currency must be 'ngn', 'kes', or 'usd'.");
    }

    const userSnap = await db().collection("users").doc(uid).get();
    if (!userSnap.exists) throw new HttpsError("not-found", "User profile not found.");
    // The profile email is client-editable, so it is only a fallback for
    // accounts with no email on their sign-in (phone signups). It is used
    // as the receipt address and never to decide who owns a payment.
    const email = request.auth?.token.email ?? (userSnap.get("email") as string | undefined);
    if (!email) throw new HttpsError("failed-precondition", "Account has no email on file.");

    let amount: number;
    let credits: number | undefined;

    if (purpose === "credits") {
      const option = typeof creditOptionIndex === "number" ? CREDIT_OPTIONS[creditOptionIndex] : undefined;
      if (!option) throw new HttpsError("invalid-argument", "Invalid creditOptionIndex.");
      amount = option[currency];
      credits = option.credits;
    } else {
      if (currency === "kes") {
        throw new HttpsError("failed-precondition", "Plan for Kenyan shillings hasn't been created.");
      }
      amount = SUBSCRIPTION_PLANS[currency].amount;
    }

    const provider = providerFor(currency);
    const reference = `whossy_${uid}_${Date.now()}`;
    const callbackUrl = `${frontendUrl()}/payment-callback?reference=${reference}`;

    // Recorded before the provider is called: if this write fails, nothing
    // has been charged, and a payment can never exist without its record.
    const paymentRef = db().collection("payments").doc(reference);
    const paymentDoc: PaymentDoc = {
      uid,
      purpose,
      provider,
      currency,
      amount,
      status: "pending",
      created_at: FieldValue.serverTimestamp(),
      ...(credits !== undefined ? { credits } : {}),
    };
    await paymentRef.create(paymentDoc);

    try {
      return { checkoutUrl: await startCheckout(), reference };
    } catch (err) {
      await paymentRef.update({ status: "failed" });
      throw err;
    }

    async function startCheckout(): Promise<string> {

      if (provider === "paystack") {
        const initBody: Record<string, unknown> = {
          email,
          amount: amount * 100, // kobo/cents
          currency: currency.toUpperCase(),
          reference,
          callback_url: callbackUrl,
          metadata: { uid, purpose, ...(credits !== undefined ? { credits } : {}) },
        };
        if (purpose === "subscription" && currency === "ngn") {
          initBody.plan = SUBSCRIPTION_PLANS.ngn.plan;
        }
        const result = await paystackFetch(currency, "/transaction/initialize", {
          method: "POST",
          body: JSON.stringify(initBody),
        });
        return result.data.authorization_url as string;
      }

      const orderPath = purpose === "subscription" ? "/v1/checkout/tokenized-card-payment" : "/v1/checkout/order";
      const result = await nombaFetch(orderPath, {
        method: "POST",
        body: JSON.stringify({
          order: { amount, currency: "USD", callbackUrl, customerEmail: email },
          merchantTxRef: reference,
        }),
      });
      const checkoutLink = result.data?.checkoutLink ?? result.data?.data?.checkoutLink;
      if (!checkoutLink) {
        logger.error("Nomba response missing checkoutLink", { result });
        throw new HttpsError("internal", "Nomba did not return a checkout link.");
      }
      return checkoutLink as string;
    }
  }
);

interface SettleResult {
  status: "success" | "completed";
  purpose: Purpose;
  credits: number | null;
}

/**
 * The single place a payment turns into credits or premium. Both the
 * callback page (verifyTransaction) and the Paystack webhook call it, so it
 * has to be safe to run twice for the same reference: the grant and the
 * `completed` flag are written in one transaction.
 *
 * `expectedUid` is the caller for the callable path and omitted for the
 * webhook, which has no user and relies on the server-written payment doc.
 */
async function settlePayment(reference: string, expectedUid?: string): Promise<SettleResult> {
  const paymentRef = db().collection("payments").doc(reference);
  const paymentSnap = await paymentRef.get();
  if (!paymentSnap.exists) throw new HttpsError("not-found", "Unknown payment reference.");
  const payment = paymentSnap.data() as PaymentDoc;

  if (expectedUid !== undefined && payment.uid !== expectedUid) {
    throw new HttpsError("permission-denied", "This payment does not belong to you.");
  }
  const result = { purpose: payment.purpose, credits: payment.credits ?? null };
  if (payment.status === "completed") return { status: "completed", ...result };

  let paid = false;
  let amountPaid = payment.amount;
  let paystackCustomerCode: string | null = null;

  if (payment.provider === "paystack") {
    const verified = await paystackFetch(
      payment.currency,
      `/transaction/verify/${encodeURIComponent(reference)}`,
      { method: "GET" }
    );
    const data = verified.data;
    // A transaction initialised with a plan is charged the plan's own
    // amount, not the one we sent, so a subscription is matched on the
    // plan code instead and the amount actually charged is recorded.
    const isPlanCharge = payment.purpose === "subscription" && payment.currency === "ngn";
    const planCode = typeof data?.plan === "string" ? data.plan : data?.plan_object?.plan_code;
    const chargeMatches = isPlanCharge
      ? planCode === SUBSCRIPTION_PLANS.ngn.plan
      : data?.amount === payment.amount * 100;
    paid =
      data?.status === "success" &&
      chargeMatches &&
      data?.currency === payment.currency.toUpperCase();
    if (paid && isPlanCharge) amountPaid = Number(data.amount) / 100;
    paystackCustomerCode = (data?.customer?.customer_code as string | undefined) ?? null;
  } else {
    const verified = await nombaFetch(`/v1/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
    const data = verified.data;
    paid = (data?.status === "SUCCESS" || data?.status === "success") && Number(data?.amount) === payment.amount;
  }

  if (!paid) {
    throw new HttpsError("failed-precondition", "Payment could not be verified as successful.");
  }

  const userRef = db().collection("users").doc(payment.uid);
  await db().runTransaction(async (tx) => {
    const freshPaymentSnap = await tx.get(paymentRef);
    if ((freshPaymentSnap.data() as PaymentDoc).status === "completed") return; // race guard

    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new HttpsError("not-found", "User profile not found.");

    const amountPaidField = `amount_paid_in_total.${AMOUNT_PAID_KEY[payment.currency]}`;

    if (payment.purpose === "credits") {
      tx.update(userRef, {
        credit_balance: FieldValue.increment(payment.credits ?? 0),
        [amountPaidField]: FieldValue.increment(amountPaid),
      });
    } else {
      tx.update(userRef, {
        is_premium: true,
        premium_expires_at: premiumExpiry(),
        [amountPaidField]: FieldValue.increment(amountPaid),
        paystack: payment.provider === "paystack" ? { reference } : {},
      });
      tx.set(
        billingRef(payment.uid),
        {
          provider: payment.provider,
          reference,
          paystack_customer_code: paystackCustomerCode,
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      if (paystackCustomerCode) {
        tx.set(paystackCustomerRef(paystackCustomerCode), { uid: payment.uid });
      }
    }

    tx.update(paymentRef, {
      status: "completed",
      amount_paid: amountPaid,
      verified_at: FieldValue.serverTimestamp(),
    });
  });

  return { status: "success", ...result };
}

export const verifyTransaction = onCall<{ reference?: string }>(
  { secrets: [...PAYSTACK_SECRETS, NOMBA_CLIENT_SECRET] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to verify a payment.");

    const reference = request.data?.reference;
    if (typeof reference !== "string" || !reference) {
      throw new HttpsError("invalid-argument", "reference is required.");
    }

    return settlePayment(reference, uid);
  }
);

function hasValidPaystackSignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
  if (!rawBody || !signature) return false;
  const given = Buffer.from(signature, "utf8");
  // Either integration may be the sender; the signature is made with its key.
  return PAYSTACK_SECRETS.some((secret) => {
    const wanted = Buffer.from(createHmac("sha512", secret.value()).update(rawBody).digest("hex"), "utf8");
    return given.length === wanted.length && timingSafeEqual(given, wanted);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uidForPaystackCustomer(data: any): Promise<string | null> {
  const customerCode = data?.customer?.customer_code;
  if (typeof customerCode !== "string" || !customerCode) return null;
  const snap = await paystackCustomerRef(customerCode).get();
  return (snap.get("uid") as string | undefined) ?? null;
}

/**
 * A renewal charge has a reference Paystack generated, so there is no
 * payments doc for it. The user is found through the customer code we
 * stored when their first payment was settled, never through anything in
 * the event's metadata.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordRenewal(reference: string, data: any): Promise<void> {
  const planCode = typeof data?.plan === "string" ? data.plan : data?.plan?.plan_code ?? data?.plan_object?.plan_code;
  if (planCode !== SUBSCRIPTION_PLANS.ngn.plan) {
    logger.warn("paystackWebhook: charge with no matching payment or plan", { reference });
    return;
  }
  const uid = await uidForPaystackCustomer(data);
  if (!uid) {
    logger.warn("paystackWebhook: renewal for an unknown customer", { reference });
    return;
  }

  const amountPaid = Number(data.amount) / 100;
  const paymentRef = db().collection("payments").doc(reference);
  await db().runTransaction(async (tx) => {
    if ((await tx.get(paymentRef)).exists) return; // redelivered event
    tx.create(paymentRef, {
      uid,
      purpose: "subscription",
      provider: "paystack",
      currency: "ngn",
      amount: amountPaid,
      amount_paid: amountPaid,
      status: "completed",
      renewal: true,
      created_at: FieldValue.serverTimestamp(),
      verified_at: FieldValue.serverTimestamp(),
    });
    tx.update(db().collection("users").doc(uid), {
      is_premium: true,
      premium_expires_at: premiumExpiry(),
      [`amount_paid_in_total.${AMOUNT_PAID_KEY.ngn}`]: FieldValue.increment(amountPaid),
    });
  });
}

/**
 * Paystack calls this server-to-server, so it is what grants a payment when
 * the customer never returns to the callback page, and what keeps a
 * subscription's expiry in step with its renewals.
 *
 * Nothing in the body is trusted until the signature has been checked
 * against the raw bytes: without that, anyone who finds the URL can post a
 * "charge.success" and grant themselves premium.
 */
export const paystackWebhook = onRequest(
  { secrets: PAYSTACK_SECRETS, cors: false },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    if (!hasValidPaystackSignature(req.rawBody, req.get("x-paystack-signature"))) {
      logger.warn("paystackWebhook: rejected a request with a missing or invalid signature");
      res.status(401).send("Invalid signature");
      return;
    }

    const event = req.body?.event as string | undefined;
    const data = req.body?.data;

    try {
      if (event === "charge.success") {
        const reference = data?.reference;
        if (typeof reference !== "string" || !reference) {
          res.status(200).send("Ignored");
          return;
        }
        const known = (await db().collection("payments").doc(reference).get()).exists;
        if (known) {
          await settlePayment(reference);
        } else {
          await recordRenewal(reference, data);
        }
      } else if (event === "subscription.create") {
        const uid = await uidForPaystackCustomer(data);
        if (uid) {
          await db().collection("users").doc(uid).update({
            premium_expires_at: premiumExpiry(data?.next_payment_date),
          });
          await billingRef(uid).set(
            {
              paystack_subscription_code: data?.subscription_code ?? null,
              subscription_status: "active",
              updated_at: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      } else if (event === "subscription.disable" || event === "subscription.not_renew") {
        // Premium is left to run out at premium_expires_at: the user has
        // paid for the current period.
        const uid = await uidForPaystackCustomer(data);
        if (uid) {
          await billingRef(uid).set(
            { subscription_status: "cancelled", updated_at: FieldValue.serverTimestamp() },
            { merge: true }
          );
        }
      }
      res.status(200).send("OK");
    } catch (err) {
      if (err instanceof HttpsError && err.code === "failed-precondition") {
        // Paystack says the charge did not succeed; a retry will not change that.
        logger.warn("paystackWebhook: event did not verify", { event, reference: data?.reference });
        res.status(200).send("Not verified");
        return;
      }
      // Anything else is ours to fix; a non-2xx makes Paystack redeliver.
      logger.error("paystackWebhook: failed to process event", { event, err });
      res.status(500).send("Internal error");
    }
  }
);

/**
 * Ends premium once the paid period is over. Accounts with no
 * premium_expires_at are left alone: they predate expiry tracking and are
 * handled by hand, not swept up here.
 */
export const expirePremium = onSchedule("every 24 hours", async () => {
  const lapsed = await db()
    .collection("users")
    .where("premium_expires_at", "<=", Timestamp.now())
    .limit(300)
    .get();

  for (const docSnap of lapsed.docs) {
    if (docSnap.get("is_premium") !== true) continue;
    await docSnap.ref.update({ is_premium: false, paystack: {} });
    logger.info(`expirePremium: premium ended for ${docSnap.id}`);
  }
});

export const cancelSubscription = onCall(
  { secrets: [PAYSTACK_SECRET_KEY_NGN] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to manage your subscription.");

    const userRef = db().collection("users").doc(uid);
    const billingSnap = await billingRef(uid).get();

    // Looked up by the customer code Paystack gave us at purchase, or by the
    // email on the sign-in token for subscriptions that predate that record.
    // Never by the profile email: it is client-editable, so it would let one
    // user cancel another's subscription.
    const customerKey =
      (billingSnap.get("paystack_customer_code") as string | undefined) ?? request.auth?.token.email;
    if (!customerKey) throw new HttpsError("not-found", "No subscription found for this account.");

    // Subscriptions exist only on the Naira integration.
    const customer = await paystackFetch("ngn", `/customer/${encodeURIComponent(customerKey)}`, { method: "GET" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptions: any[] = customer?.data?.subscriptions ?? [];
    const subscription = subscriptions.find((s) => s?.status === "active");
    if (!subscription) throw new HttpsError("not-found", "No active subscription found.");

    await paystackFetch("ngn", "/subscription/disable", {
      method: "POST",
      body: JSON.stringify({
        code: subscription.subscription_code,
        token: subscription.email_token,
      }),
    });

    await userRef.update({ is_premium: false, paystack: {} });

    return { status: "cancelled" };
  }
);
