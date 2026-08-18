/**
 * Whossy Cloud Functions — in-app notification feed + push (pre-launch plan
 * B2). Both apps read `users/{uid}/notifications/{id}` but nothing wrote to
 * it — the bell was empty by construction. Four triggers, one per event that
 * should notify someone. Each writes the in-app record and sends the push
 * together (same handler, same data), so the list and the alert can't drift
 * apart the way `is_approved`/`face_verification.status` did before A1/A3.
 */

import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { sendPush } from "./push";
import { participantsOf } from "./chatId";

// Lazy — see the comment in verification.ts. Timestamp is imported directly
// (not via admin.firestore.Timestamp) since that namespaced static wasn't
// reliably populated yet in a module loaded before index.ts's
// admin.initializeApp() runs — confirmed via the emulator, not a guess.
const db = () => admin.firestore();

async function firstNameAndPhoto(uid: string): Promise<{ name: string; photo: string | null }> {
  const snap = await db().collection("users").doc(uid).get();
  const user = snap.data() ?? {};
  const name = (user.first_name as string | undefined)?.trim() || "Someone";
  const photo = ((user.photos as string[] | undefined) ?? [])[0] ?? null;
  return { name, photo };
}

function notificationsRef(uid: string) {
  return db().collection("users").doc(uid).collection("notifications");
}

/** New like → notifies the person who was liked. */
export const notifyOnNewLike = onDocumentCreated("likes/{likeId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const { liker_id: likerId, liked_id: likedId } = snap.data() as {
    liker_id?: string;
    liked_id?: string;
  };
  if (!likerId || !likedId) return;

  const liker = await firstNameAndPhoto(likerId);
  const body = `${liker.name} liked your profile.`;

  await notificationsRef(likedId).add({
    type: "like",
    title: "New Like",
    body,
    seen: false,
    timestamp: Timestamp.now(),
    likerId,
    likerName: liker.name,
    likerProfilePicture: liker.photo,
    likedId,
  });

  await sendPush(likedId, "New Like 💛", body, { type: "like", likerId });
});

/** New match → notifies both participants, each sees the other's name/photo. */
export const notifyOnNewMatch = onDocumentCreated("matches/{matchId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const { user1_id, user2_id } = snap.data() as { user1_id?: string; user2_id?: string };
  if (!user1_id || !user2_id) return;

  const [u1, u2] = await Promise.all([firstNameAndPhoto(user1_id), firstNameAndPhoto(user2_id)]);

  const shared = {
    type: "match",
    title: "New Match",
    seen: false,
    timestamp: Timestamp.now(),
    user1_id,
    user1_name: u1.name,
    user1_pic: u1.photo,
    user2_id,
    user2_name: u2.name,
    user2_pic: u2.photo,
  };

  await Promise.all([
    notificationsRef(user1_id).add({ ...shared, body: `You matched with ${u2.name}.` }),
    notificationsRef(user2_id).add({ ...shared, body: `You matched with ${u1.name}.` }),
  ]);

  await Promise.all([
    sendPush(user1_id, "You've matched! 🎉", `You matched with ${u2.name}.`, { type: "match" }),
    sendPush(user2_id, "You've matched! 🎉", `You matched with ${u1.name}.`, { type: "match" }),
  ]);
});

/** New message → notifies the recipient only (never the sender). */
export const notifyOnNewMessage = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const chatId = event.params.chatId;
    const message = snap.data() as {
      sender_id?: string;
      sender_id_blocked?: boolean;
      message?: string | null;
      photo?: string | null;
    };
    const senderId = message.sender_id;
    if (!senderId || message.sender_id_blocked) return;

    const pair = participantsOf(chatId);
    if (!pair || !pair.includes(senderId)) return;
    const recipientId = pair[0] === senderId ? pair[1] : pair[0];

    const sender = await firstNameAndPhoto(senderId);
    const preview = message.message
      ? message.message.slice(0, 120)
      : message.photo
        ? "📷 Photo"
        : "New message";

    await notificationsRef(recipientId).add({
      type: "message",
      title: "New Message",
      body: `${sender.name}: ${preview}`,
      seen: false,
      timestamp: Timestamp.now(),
      chatId,
      senderId,
      senderName: sender.name,
      senderProfilePicture: sender.photo,
    });

    await sendPush(recipientId, `New message from ${sender.name}`, preview, {
      type: "message",
      chatId,
    });
  }
);

/**
 * Verification decision (approved/rejected via reviewVerification, A5) →
 * notifies the submitter. This is the notification that tells a waiting
 * user the app has unlocked — the plan flags it as carrying extra weight,
 * since it's what brings back anyone who skipped verification at signup.
 *
 * Deliberately does not fire on a 'revoked' transition — that's the user's
 * own A4 action (main-photo change), not a reviewer decision.
 */
export const notifyOnVerificationDecision = onDocumentUpdated("users/{uid}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  const beforeStatus = (before.face_verification as { status?: string } | undefined)?.status;
  const afterFv = after.face_verification as { status?: string; rejection_reason?: string } | undefined;
  const afterStatus = afterFv?.status;
  if (beforeStatus === afterStatus) return;
  if (afterStatus !== "approved" && afterStatus !== "rejected") return;

  const uid = event.params.uid;
  const title = afterStatus === "approved" ? "You're verified! 🎉" : "Verification declined";
  const body =
    afterStatus === "approved"
      ? "Your photo has been approved — you can now like and message people."
      : afterFv?.rejection_reason
        ? `Your selfie wasn't approved: ${afterFv.rejection_reason}`
        : "Your selfie wasn't approved. Please retake it.";

  await notificationsRef(uid).add({
    type: "verification",
    title,
    body,
    seen: false,
    timestamp: Timestamp.now(),
    verificationStatus: afterStatus,
    rejectionReason: afterFv?.rejection_reason ?? null,
  });

  await sendPush(uid, title, body, { type: "verification", verificationStatus: afterStatus });
  logger.info(`notifyOnVerificationDecision: ${uid} → ${afterStatus}`);
});
