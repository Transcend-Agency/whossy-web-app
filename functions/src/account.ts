/**
 * Account deletion.
 *
 * Deleting only the users/{uid} document, which is all either app did,
 * leaves the person's likes, chats, photos and verification selfie behind.
 * purgeUserData removes everything tied to a uid and is safe to run again
 * after a partial failure.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { Query } from "firebase-admin/firestore";

const db = () => admin.firestore();

/** How recently the caller must have signed in to delete their account. */
const RECENT_LOGIN_SECONDS = 5 * 60;

async function deleteQuery(query: Query): Promise<void> {
  const snap = await query.get();
  const writer = db().bulkWriter();
  snap.docs.forEach((d) => writer.delete(d.ref));
  await writer.close();
}

async function purgeUserData(uid: string, { profileAlreadyDeleted = false } = {}): Promise<void> {
  const firestore = db();

  const chats = await firestore.collection("chats").where("participants", "array-contains", uid).get();
  for (const chat of chats.docs) {
    // Someone else may have a credit on hold waiting for this user's reply;
    // it can never be captured now, so it goes back to them.
    const initiatorId = chat.get("initiator_id") as string | undefined;
    if (
      chat.get("credit_status") === "pending" &&
      chat.get("credit_held") === true &&
      initiatorId &&
      initiatorId !== uid
    ) {
      await firestore.runTransaction(async (tx) => {
        const initiatorRef = firestore.collection("users").doc(initiatorId);
        const held = ((await tx.get(initiatorRef)).get("credits_on_hold") as number | null) ?? 0;
        tx.update(initiatorRef, { credits_on_hold: Math.max(0, held - 1) });
        tx.update(chat.ref, { credit_held: false });
      });
    }
    await firestore.recursiveDelete(chat.ref);
  }

  await Promise.all([
    deleteQuery(firestore.collection("likes").where("liker_id", "==", uid)),
    deleteQuery(firestore.collection("likes").where("liked_id", "==", uid)),
    deleteQuery(firestore.collection("dislikes").where("disliker_id", "==", uid)),
    deleteQuery(firestore.collection("dislikes").where("disliked_id", "==", uid)),
    deleteQuery(firestore.collection("matches").where("user1_id", "==", uid)),
    deleteQuery(firestore.collection("matches").where("user2_id", "==", uid)),
    // Reports this user filed go; reports filed against them are moderation
    // records and stay. payments/ stays too, as a financial record.
    deleteQuery(firestore.collection("userReports").where("reporterId", "==", uid)),
    deleteQuery(firestore.collection("paystack_customers").where("uid", "==", uid)),
    firestore.collection("filters").doc(uid).delete(),
    firestore.collection("advancedSearchPreferences").doc(uid).delete(),
    firestore.collection("deletePicQueue").doc(uid).delete(),
  ]);

  const userRef = firestore.collection("users").doc(uid);
  if (profileAlreadyDeleted) {
    // The profile is what was deleted to get here. Only what hangs off it is
    // removed, so a profile created again under the same uid in the meantime
    // is not taken out by this late clean-up.
    for (const sub of await userRef.listCollections()) await firestore.recursiveDelete(sub);
  } else {
    // Covers the notifications, popularity_ledger and private subcollections.
    await firestore.recursiveDelete(userRef);
  }

  await admin.storage().bucket().deleteFiles({ prefix: `users/${uid}/` });
  await admin.database().ref(`users/${uid}`).remove();
}

export const deleteAccount = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to delete your account.");

  // A stolen or left-open session must not be enough to destroy an account.
  const authTime = Number(request.auth?.token.auth_time ?? 0);
  if (Date.now() / 1000 - authTime > RECENT_LOGIN_SECONDS) {
    throw new HttpsError("failed-precondition", "RECENT_LOGIN_REQUIRED");
  }

  await purgeUserData(uid);
  // Last, so that a failure above leaves an account that can still sign in
  // and try again rather than data with no owner.
  await admin.auth().deleteUser(uid);

  logger.info(`deleteAccount: removed ${uid}`);
  return { status: "deleted" };
});

/**
 * Builds that predate deleteAccount delete users/{uid} directly. This runs
 * the same purge for them. It leaves the Auth user alone: those builds
 * delete it themselves after the document.
 */
export const cleanUpUserData = onDocumentDeleted("users/{userId}", async (event) => {
  const uid = event.params.userId;
  try {
    // Same uid, new profile: the account was recreated, so its likes, chats
    // and photos now belong to a live user.
    if ((await db().collection("users").doc(uid).get()).exists) return;
    await purgeUserData(uid, { profileAlreadyDeleted: true });
    logger.info(`cleanUpUserData: purged ${uid}`);
  } catch (err) {
    logger.error(`cleanUpUserData: failed for ${uid}`, err);
  }
});

