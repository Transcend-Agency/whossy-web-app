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
 *
 * Hiding online status is a Premium setting (`user_settings.online_status ===
 * false`). It is enforced here, at the one place every reader's `status` comes
 * from, so a hidden user shows as offline with no `lastSeen` to the swipe
 * cards, the Online filter, chats and both apps alike.
 */

import { onValueWritten } from "firebase-functions/v2/database";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Lazy — see the comment in notifications.ts. Same init-order reasoning.
const db = () => admin.firestore();

type Presence = { online?: boolean; lastSeen?: number } | null;
type VisibilityFields = { is_premium?: unknown; user_settings?: { online_status?: unknown } | null };

/**
 * Only Premium accounts may hide, so an account that was set to hidden and
 * then lapsed becomes visible again. A missing setting means visible.
 */
export const hidesOnlineStatus = (user: VisibilityFields | undefined): boolean =>
  user?.is_premium === true && user?.user_settings?.online_status === false;

const statusFor = (presence: Presence, hidden: boolean) => {
  if (hidden) return { online: false, lastSeen: null };
  // RTDB's serverTimestamp() resolves to an epoch-millis number once
  // committed, so this is already the right shape — the fallback only
  // covers the (unexpected) case of a write that omitted it.
  return {
    online: presence?.online === true,
    lastSeen: typeof presence?.lastSeen === "number" ? presence.lastSeen : Date.now(),
  };
};

async function mirror(uid: string, presence: Presence): Promise<void> {
  try {
    const userRef = db().collection("users").doc(uid);
    const snap = await userRef.get();
    // The mirror only updates an existing user document: a presence write
    // that lands after the account was deleted must not recreate it.
    if (!snap.exists) return;
    await userRef.update({ status: statusFor(presence, hidesOnlineStatus(snap.data())) });
  } catch (err) {
    if ((err as { code?: number }).code === 5) return; // NOT_FOUND
    logger.error(`presence mirror: failed to mirror presence for ${uid}`, err);
  }
}

export const mirrorPresenceToFirestore = onValueWritten(
  "/users/{uid}/presence",
  async (event) => {
    await mirror(event.params.uid, event.data.after.val() as Presence);
  }
);

/**
 * The mirror above only runs when presence changes, so flipping the setting
 * (or Premium lapsing) has to re-apply it too — otherwise a user who just
 * went hidden stays visible until their next heartbeat, and one who just
 * went visible stays hidden. Writing `status` re-triggers this function, so
 * it acts only when the hidden-ness itself changed.
 */
export const reapplyPresenceVisibility = onDocumentUpdated("users/{uid}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!after || hidesOnlineStatus(before) === hidesOnlineStatus(after)) return;

  const uid = event.params.uid;
  const presenceSnap = await admin.database().ref(`users/${uid}/presence`).get();
  await mirror(uid, presenceSnap.val() as Presence);
});
