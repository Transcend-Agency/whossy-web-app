/**
 * Whossy Cloud Functions — presence mirror (pre-launch plan C1).
 *
 * Both apps write presence to Realtime Database at `users/{uid}/presence`,
 * but every read site (the Online filter, the online badge on both apps)
 * expects a `status` field on the Firestore `users/{uid}` document — which
 * nothing ever wrote, so presence has never actually worked anywhere. This
 * mirrors RTDB into the Firestore shape both apps already read.
 *
 * `lastSeen` is written as a plain epoch-millis number, not a Firestore
 * Timestamp — that's the type both apps' existing (currently dead) "last
 * seen" rendering already expects (see `types/user.ts`'s `status.lastSeen:
 * number` and mobile's `UserStatus.fromJson`). Writing a Timestamp here
 * would silently break that a second time.
 */

import { onValueWritten } from "firebase-functions/v2/database";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Lazy — see the comment in notifications.ts. Same init-order reasoning.
const db = () => admin.firestore();

export const mirrorPresenceToFirestore = onValueWritten(
  "/users/{uid}/presence",
  async (event) => {
    const uid = event.params.uid;
    const after = event.data.after.val() as { online?: boolean; lastSeen?: number } | null;

    const online = after?.online === true;
    // RTDB's serverTimestamp() resolves to an epoch-millis number once
    // committed, so this is already the right shape — the fallback only
    // covers the (unexpected) case of a write that omitted it.
    const lastSeen = typeof after?.lastSeen === "number" ? after.lastSeen : Date.now();

    try {
      // update(), not set-with-merge: a presence write that lands after the
      // account was deleted must not recreate the user document.
      await db().collection("users").doc(uid).update({ status: { online, lastSeen } });
    } catch (err) {
      if ((err as { code?: number }).code === 5) return; // NOT_FOUND
      logger.error(`mirrorPresenceToFirestore: failed to mirror presence for ${uid}`, err);
    }
  }
);
