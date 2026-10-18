/**
 * Server-side verification of Google Play purchases.
 *
 * The mobile app used to give itself credits and premium after a Play
 * purchase and never checked the purchase with anyone. Now the app sends the
 * purchase token here; this asks Google whether it is a real, completed
 * purchase of a product we sell, works out what it is worth from OUR tables
 * (never from the client), and grants it once per purchase token.
 *
 * Setup it needs (Play Console, once):
 *   Setup > API access: link a Google Cloud project, then grant the service
 *   account this function runs as (the project's default compute or App
 *   Engine service account, or one set in `serviceAccount` below) the
 *   permissions "View financial data" and "Manage orders and subscriptions".
 * Until that is done the Play API answers 401/403 and every purchase is
 * refused with `unavailable`, which the app treats as "try again later".
 */

import { createHash } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { GoogleAuth } from "google-auth-library";

const db = () => admin.firestore();

export const PLAY_PACKAGE_NAME = "com.whossy.whossy_app";

/** Credit packs sold on Google Play: product id -> credits. */
const CREDIT_PACKS: Record<string, number> = {
  credits_1_usd: 1,
  credits_5_usd: 5,
  credits_10_usd: 10,
  credits_20_usd: 20,
  credits_50_usd: 50,
  credits_100_usd: 100,
};

/** Subscription products sold on Google Play. */
const SUBSCRIPTION_PRODUCTS = new Set([
  "subscription_1months",
  "subscription_3months_usd",
  "subscription_6months_usd",
  "subscription_1year_usd",
]);

export const creditsForProduct = (productId: string): number | null => CREDIT_PACKS[productId] ?? null;
export const isSubscriptionProduct = (productId: string): boolean => SUBSCRIPTION_PRODUCTS.has(productId);

/** What the Play API says about a one-time product purchase (the fields used). */
export interface ProductPurchase {
  purchaseState?: number; // 0 purchased, 1 canceled, 2 pending
  orderId?: string;
}

/** What the Play API says about a subscription (subscriptionsv2, the fields used). */
export interface SubscriptionPurchase {
  subscriptionState?: string;
  lineItems?: { productId?: string; expiryTime?: string }[];
}

export interface PlayApi {
  getProduct(productId: string, purchaseToken: string): Promise<ProductPurchase>;
  getSubscription(purchaseToken: string): Promise<SubscriptionPurchase>;
}

const PLAY_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const PLAY_BASE = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PLAY_PACKAGE_NAME}`;

/** Replaced in tests; in production it returns an access token for the function's own service account. */
export const playAuth = {
  async token(): Promise<string> {
    const auth = new GoogleAuth({ scopes: [PLAY_SCOPE] });
    const token = await auth.getAccessToken();
    if (!token) throw new Error("no access token");
    return token;
  },
};

async function playGet<T>(path: string): Promise<T> {
  const token = await playAuth.token();
  const res = await fetch(`${PLAY_BASE}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404 || res.status === 400) {
    throw new HttpsError("failed-precondition", "Google does not recognise this purchase.");
  }
  if (!res.ok) {
    logger.error("Play API call failed", { status: res.status, path: path.split("/tokens/")[0] });
    throw new HttpsError("unavailable", "Could not check the purchase with Google. Try again shortly.");
  }
  return (await res.json()) as T;
}

export const livePlayApi: PlayApi = {
  getProduct: (productId, token) =>
    playGet<ProductPurchase>(`purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(token)}`),
  getSubscription: (token) => playGet<SubscriptionPurchase>(`purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`),
};

/** One-time purchases are real only once Google reports them as purchased. */
export const productPurchaseIsComplete = (p: ProductPurchase): boolean => p.purchaseState === 0;

/**
 * The subscription gives access while it is active, in a grace period, or
 * cancelled-but-paid-up. Returns the expiry to store, or null when it does not.
 */
export function subscriptionAccessUntil(p: SubscriptionPurchase, productId: string, now = new Date()): Date | null {
  const accessStates = [
    "SUBSCRIPTION_STATE_ACTIVE",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
    "SUBSCRIPTION_STATE_CANCELED",
  ];
  if (!p.subscriptionState || !accessStates.includes(p.subscriptionState)) return null;
  const item = p.lineItems?.find((l) => l.productId === productId);
  if (!item?.expiryTime) return null;
  const expiry = new Date(item.expiryTime);
  return Number.isNaN(expiry.getTime()) || expiry <= now ? null : expiry;
}

export interface PlayGrantInput {
  uid: string;
  productId: string;
  purchaseToken: string;
}

export type PlayGrantResult =
  | { kind: "credits"; credits: number; alreadyGranted: boolean }
  | { kind: "subscription"; premiumUntil: string; alreadyGranted: boolean };

/** Purchase tokens are long and Firestore ids are limited, so the document id is their hash. */
export const purchaseDocId = (purchaseToken: string): string =>
  createHash("sha256").update(purchaseToken).digest("hex");

/**
 * Checks the purchase with Google and grants it. Safe to call again for the
 * same token (the app re-delivers unfinished purchases): credits are added
 * once, and a token already used by another account is refused.
 */
export async function grantPlayPurchase(api: PlayApi, input: PlayGrantInput): Promise<PlayGrantResult> {
  const { uid, productId, purchaseToken } = input;
  const credits = creditsForProduct(productId);
  const subscription = isSubscriptionProduct(productId);
  if (credits === null && !subscription) {
    throw new HttpsError("invalid-argument", "Unknown product.");
  }

  const purchaseRef = db().collection("playPurchases").doc(purchaseDocId(purchaseToken));
  const userRef = db().collection("users").doc(uid);

  if (credits !== null) {
    const purchase = await api.getProduct(productId, purchaseToken);
    if (!productPurchaseIsComplete(purchase)) {
      throw new HttpsError("failed-precondition", "This purchase is not completed.");
    }

    return db().runTransaction(async (tx) => {
      const [existing, user] = await Promise.all([tx.get(purchaseRef), tx.get(userRef)]);
      if (!user.exists) throw new HttpsError("not-found", "User profile not found.");
      if (existing.exists) {
        if (existing.get("uid") !== uid) {
          throw new HttpsError("permission-denied", "This purchase belongs to another account.");
        }
        return { kind: "credits" as const, credits, alreadyGranted: true };
      }
      tx.create(purchaseRef, {
        uid,
        product_id: productId,
        kind: "credits",
        credits,
        order_id: purchase.orderId ?? null,
        created_at: FieldValue.serverTimestamp(),
      });
      tx.update(userRef, { credit_balance: FieldValue.increment(credits) });
      return { kind: "credits" as const, credits, alreadyGranted: false };
    });
  }

  const sub = await api.getSubscription(purchaseToken);
  const until = subscriptionAccessUntil(sub, productId);
  if (!until) throw new HttpsError("failed-precondition", "This subscription is not active.");

  return db().runTransaction(async (tx) => {
    const [existing, user] = await Promise.all([tx.get(purchaseRef), tx.get(userRef)]);
    if (!user.exists) throw new HttpsError("not-found", "User profile not found.");
    if (existing.exists && existing.get("uid") !== uid) {
      throw new HttpsError("permission-denied", "This purchase belongs to another account.");
    }
    if (!existing.exists) {
      tx.create(purchaseRef, {
        uid,
        product_id: productId,
        kind: "subscription",
        created_at: FieldValue.serverTimestamp(),
      });
    }
    // purchase_token lets the Play lifecycle handler find this account later.
    tx.update(userRef, {
      is_premium: true,
      premium_expires_at: Timestamp.fromDate(until),
      current_plan: productId,
      payment_platform: "mobile",
      purchase_token: purchaseToken,
    });
    return { kind: "subscription" as const, premiumUntil: until.toISOString(), alreadyGranted: existing.exists };
  });
}

interface VerifyPlayPurchaseRequest {
  productId?: string;
  purchaseToken?: string;
}

export const verifyPlayPurchase = onCall<VerifyPlayPurchaseRequest>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to verify a purchase.");

  const { productId, purchaseToken } = request.data ?? {};
  if (typeof productId !== "string" || !productId || typeof purchaseToken !== "string" || !purchaseToken) {
    throw new HttpsError("invalid-argument", "productId and purchaseToken are required.");
  }

  return grantPlayPurchase(livePlayApi, { uid, productId, purchaseToken });
});
