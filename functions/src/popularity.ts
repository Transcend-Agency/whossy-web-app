/**
 * Whossy Cloud Functions — "Popular in my area" (pre-launch plan C2).
 *
 * The filter used to just re-run the "same country" query under a different
 * label — neither popular nor area-based. This makes the signal real: a
 * denormalized rolling-30-day like count per user, incremented on every new
 * like and pruned daily. Firestore can't GROUP BY, so a live aggregate per
 * Explore load would mean scanning every like ever sent on every request —
 * this keeps that cost off the read path entirely.
 *
 * `likes/{likerId}_{likedId}` uses a deterministic ID and is never deleted
 * (confirmed: no unlike flow exists), so `onDocumentCreated` fires exactly
 * once per unique (liker, liked) pair — no double-count and no
 * decrement-on-unlike case to handle.
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Lazy — see the comment in notifications.ts. Same init-order reasoning.
const db = () => admin.firestore();

const POPULARITY_WINDOW_DAYS = 30;
const PRUNE_BATCH_SIZE = 300;

/** New like → +1 to the liked user's rolling popularity score. */
export const incrementPopularityOnLike = onDocumentCreated("likes/{likeId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const likeId = event.params.likeId as string;
  const { liked_id: likedId } = snap.data() as { liked_id?: string };
  if (!likedId) return;

  const userRef = db().collection("users").doc(likedId);
  const ledgerRef = userRef.collection("popularity_ledger").doc(likeId);

  try {
    await db().runTransaction(async (tx) => {
      const ledgerSnap = await tx.get(ledgerRef);
      // Idempotent — a duplicate trigger invocation for the same like must
      // not double-count. The ledger doc reuses the like's own ID, so a
      // retry is a harmless no-op rather than a second increment.
      if (ledgerSnap.exists) return;

      tx.set(ledgerRef, { timestamp: admin.firestore.Timestamp.now() });
      tx.set(userRef, { popularity_score_30d: admin.firestore.FieldValue.increment(1) }, { merge: true });
    });
  } catch (err) {
    logger.error(`incrementPopularityOnLike: failed for like ${likeId} → ${likedId}`, err);
  }
});

/**
 * Daily sweep: like contributions older than the window age out of the
 * score, same shape as releaseExpiredHolds's batch-and-transact pattern.
 */
export const prunePopularityScores = onSchedule("every 24 hours", async () => {
  const cutoff = admin.firestore.Timestamp.fromMillis(
    Date.now() - POPULARITY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const stale = await db()
    .collectionGroup("popularity_ledger")
    .where("timestamp", "<", cutoff)
    .limit(PRUNE_BATCH_SIZE)
    .get();

  if (stale.empty) return;
  logger.info(`prunePopularityScores: pruning ${stale.size} stale ledger entr${stale.size === 1 ? "y" : "ies"}`);

  for (const ledgerDoc of stale.docs) {
    try {
      await db().runTransaction(async (tx) => {
        const freshLedgerSnap = await tx.get(ledgerDoc.ref);
        // Re-verify — a concurrent run or a re-triggered function must not
        // decrement twice for the same ledger entry.
        if (!freshLedgerSnap.exists) return;

        const userRef = ledgerDoc.ref.parent.parent;
        if (!userRef) return;

        const userSnap = await tx.get(userRef);
        const current = (userSnap.get("popularity_score_30d") as number | null) ?? 0;
        tx.set(userRef, { popularity_score_30d: Math.max(0, current - 1) }, { merge: true });
        tx.delete(ledgerDoc.ref);
      });
    } catch (err) {
      logger.error(`prunePopularityScores: failed to prune ${ledgerDoc.ref.path}`, err);
    }
  }
});
