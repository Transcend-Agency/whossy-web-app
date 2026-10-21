/**
 * A match is two likes pointing at each other. Both apps used to work that
 * out themselves and write the match, which meant any user could write a
 * match with anyone. The server now creates it, and only from the two like
 * documents.
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const db = () => admin.firestore();

export const createMatchOnMutualLike = onDocumentCreated("likes/{likeId}", async (event) => {
  const like = event.data?.data() as { liker_id?: string; liked_id?: string } | undefined;
  const likerId = like?.liker_id;
  const likedId = like?.liked_id;
  if (!likerId || !likedId || likerId === likedId) return;

  const matches = db().collection("matches");
  const [first, second] = [likerId, likedId].sort();
  const matchRef = matches.doc(`${first}_${second}`);

  await db().runTransaction(async (tx) => {
    const reciprocal = await tx.get(db().collection("likes").doc(`${likedId}_${likerId}`));
    if (!reciprocal.exists) return;

    // Builds that still write the match themselves use the id of whoever
    // liked second, in either order.
    const existing = await tx.getAll(
      matchRef,
      matches.doc(`${likerId}_${likedId}`),
      matches.doc(`${likedId}_${likerId}`)
    );
    if (existing.some((snap) => snap.exists)) return;

    tx.create(matchRef, {
      user1_id: first,
      user2_id: second,
      user_ids: [first, second],
      timestamp: FieldValue.serverTimestamp(),
    });
    logger.info(`createMatchOnMutualLike: ${first} + ${second}`);
  });
});
