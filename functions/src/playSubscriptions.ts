/**
 * Google Play subscription lifecycle.
 *
 * Play publishes a message to the `play-subscription-updates` topic whenever
 * a subscription changes. This keeps the account in step: a cancelled
 * subscription keeps premium until the period it paid for runs out, and an
 * expired one loses it.
 *
 * It does not grant premium. The mobile app still does that itself after a
 * purchase, unverified, and the user is found here through the
 * `purchase_token` the app wrote. Both go away with server-side purchase
 * verification (plan section 2.4), which is waiting on Play Console access.
 */

import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const db = () => admin.firestore();

// Google Play Developer API, SubscriptionNotification.notificationType.
const SUBSCRIPTION_CANCELED = 3;
const SUBSCRIPTION_EXPIRED = 13;

export const handlePlaySubscription = onMessagePublished("play-subscription-updates", async (event) => {
  const encoded = event.data.message?.data;
  if (!encoded) {
    logger.error("handlePlaySubscription: message had no data");
    return;
  }

  let notification: { notificationType?: number; purchaseToken?: string; subscriptionId?: string } | undefined;
  try {
    notification = JSON.parse(Buffer.from(encoded, "base64").toString()).subscriptionNotification;
  } catch (err) {
    logger.error("handlePlaySubscription: message was not valid JSON", err);
    return;
  }
  // Play also sends test and one-time-product notifications on this topic.
  if (!notification?.purchaseToken) return;

  const { notificationType, purchaseToken, subscriptionId } = notification;
  const owner = await db().collection("users").where("purchase_token", "==", purchaseToken).limit(1).get();
  if (owner.empty) {
    logger.warn("handlePlaySubscription: no user holds this purchase token", { notificationType, subscriptionId });
    return;
  }
  const userRef = owner.docs[0].ref;

  if (notificationType === SUBSCRIPTION_CANCELED) {
    await userRef.update({ payment_platform: FieldValue.delete(), current_plan: FieldValue.delete() });
    logger.info(`handlePlaySubscription: ${userRef.id} cancelled; premium runs to the end of the period`);
  } else if (notificationType === SUBSCRIPTION_EXPIRED) {
    await userRef.update({ is_premium: false });
    logger.info(`handlePlaySubscription: ${userRef.id} expired; premium removed`);
  }
});
