

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

const db = () => admin.firestore();

const PAYSTACK_SECRET_KEY = defineSecret("PAYSTACK_SECRET_KEY");
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
  status: "pending" | "completed";
  created_at: admin.firestore.FieldValue;
  verified_at?: admin.firestore.FieldValue;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function paystackFetch(path: string, init: RequestInit): Promise<any> {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY.value()}`,
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
  { secrets: [PAYSTACK_SECRET_KEY, NOMBA_CLIENT_SECRET] },
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
    const email = userSnap.get("email") as string | undefined;
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

    let checkoutUrl: string;

    if (provider === "paystack") {
      const initBody: Record<string, unknown> = {
        email,
        amount: amount * 100, // kobo/cents
        currency: currency.toUpperCase(),
        reference,
        callback_url: callbackUrl,
        metadata: { uid, purpose, credits },
      };
      if (purpose === "subscription" && currency === "ngn") {
        initBody.plan = SUBSCRIPTION_PLANS.ngn.plan;
      }
      const result = await paystackFetch("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify(initBody),
      });
      checkoutUrl = result.data.authorization_url;
    } else {
      const orderPath = purpose === "subscription" ? "/v1/checkout/tokenized-card-payment" : "/v1/checkout/order";
      const result = await nombaFetch(orderPath, {
        method: "POST",
        body: JSON.stringify({
          order: { amount, currency: "USD", callbackUrl, customerEmail: email },
          merchantTxRef: reference,
        }),
      });
      checkoutUrl = result.data?.checkoutLink ?? result.data?.data?.checkoutLink;
      if (!checkoutUrl) {
        logger.error("Nomba response missing checkoutLink", { result });
        throw new HttpsError("internal", "Nomba did not return a checkout link.");
      }
    }

    const paymentDoc: PaymentDoc = {
      uid,
      purpose,
      provider,
      currency,
      amount,
      credits,
      status: "pending",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db().collection("payments").doc(reference).set(paymentDoc);

    return { checkoutUrl, reference };
  }
);

export const verifyTransaction = onCall<{ reference?: string }>(
  { secrets: [PAYSTACK_SECRET_KEY, NOMBA_CLIENT_SECRET] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to verify a payment.");

    const reference = request.data?.reference;
    if (typeof reference !== "string" || !reference) {
      throw new HttpsError("invalid-argument", "reference is required.");
    }

    const paymentRef = db().collection("payments").doc(reference);
    const paymentSnap = await paymentRef.get();
    if (!paymentSnap.exists) throw new HttpsError("not-found", "Unknown payment reference.");
    const payment = paymentSnap.data() as PaymentDoc;

    if (payment.uid !== uid) {
      throw new HttpsError("permission-denied", "This payment does not belong to you.");
    }
    if (payment.status === "completed") {
      // Idempotent: a callback-page reload must not double-credit.
      return { status: "completed", purpose: payment.purpose, credits: payment.credits ?? null };
    }

    let paid = false;

    if (payment.provider === "paystack") {
      const result = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
      const data = result.data;
      paid =
        data?.status === "success" &&
        data?.amount === payment.amount * 100 &&
        data?.currency === payment.currency.toUpperCase();
    } else {
      const result = await nombaFetch(`/v1/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
      const data = result.data;
      paid = (data?.status === "SUCCESS" || data?.status === "success") && Number(data?.amount) === payment.amount;
    }

    if (!paid) {
      throw new HttpsError("failed-precondition", "Payment could not be verified as successful.");
    }

    const userRef = db().collection("users").doc(uid);
    await db().runTransaction(async (tx) => {
      const freshPaymentSnap = await tx.get(paymentRef);
      if ((freshPaymentSnap.data() as PaymentDoc).status === "completed") return; // race guard

      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new HttpsError("not-found", "User profile not found.");

      if (payment.purpose === "credits") {
        tx.update(userRef, {
          credit_balance: admin.firestore.FieldValue.increment(payment.credits ?? 0),
          [`amount_paid_in_total.${payment.currency === "ngn" ? "naira" : payment.currency === "kes" ? "kenyan_shillings" : "dollars"}`]:
            admin.firestore.FieldValue.increment(payment.amount),
        });
      } else {
        tx.update(userRef, {
          is_premium: true,
          [`amount_paid_in_total.${payment.currency === "ngn" ? "naira" : "dollars"}`]:
            admin.firestore.FieldValue.increment(payment.amount),
          paystack: payment.provider === "paystack" ? { reference } : {},
        });
      }

      tx.update(paymentRef, {
        status: "completed",
        verified_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { status: "success", purpose: payment.purpose, credits: payment.credits ?? null };
  }
);

export const cancelSubscription = onCall(
  { secrets: [PAYSTACK_SECRET_KEY] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to manage your subscription.");

    const userRef = db().collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new HttpsError("not-found", "User profile not found.");
    const email = userSnap.get("email") as string | undefined;
    if (!email) throw new HttpsError("failed-precondition", "Account has no email on file.");

    const customer = await paystackFetch(`/customer/${encodeURIComponent(email)}`, { method: "GET" });
    const subscription = customer?.data?.subscriptions?.[0];
    if (!subscription) throw new HttpsError("not-found", "No active subscription found.");

    await paystackFetch("/subscription/disable", {
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
