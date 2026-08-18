/**
 * Whossy Cloud Functions — Reply-Gated Credits (Feature 1 v2).
 *
 * See whossy-reply-gated-credits-spec.md §5. Three functions implement the
 * IDLE → PENDING → CONNECTED state machine on chats/{chatId}:
 *
 *  - initiateChat        (callable)  IDLE → PENDING: place a credit hold
 *  - onMessageCreated    (trigger)   PENDING → CONNECTED: capture on first reply
 *  - releaseExpiredHolds (schedule)  PENDING → IDLE: refund after 48h of silence
 *
 * Field names here are the contract for both clients — do not rename without
 * updating the spec and both apps. `chats.status` is message seen-state and is
 * never touched here; the credit state lives in `chats.credit_status`.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { sendPush } from "./push";
import { participantsOf } from "./chatId";

admin.initializeApp();
const db = admin.firestore();

export { reviewVerification } from "./verification";
export {
  notifyOnNewLike,
  notifyOnNewMatch,
  notifyOnNewMessage,
  notifyOnVerificationDecision,
} from "./notifications";

/** Hours the recipient has to reply before the hold is refunded (AC 5.1). */
const HOLD_WINDOW_HOURS = 48;
/** Hours of free chatting after the connection (AC 4.1). */
const CHAT_WINDOW_HOURS = 48;

const HOUR_MS = 60 * 60 * 1000;

type CreditStatus = "idle" | "pending" | "connected";

interface ChatCreditFields {
  credit_status?: CreditStatus;
  initiator_id?: string | null;
  hold_placed_at?: admin.firestore.Timestamp | null;
  connected_at?: admin.firestore.Timestamp | null;
  expiration_time?: admin.firestore.Timestamp | null;
  /** Whether the current PENDING cycle is backed by a real credit hold
   *  (false when the initiator was premium — nothing to capture/refund). */
  credit_held?: boolean;
}

function isWindowActive(chat: ChatCreditFields, now: admin.firestore.Timestamp): boolean {
  return (
    chat.credit_status === "connected" &&
    chat.expiration_time != null &&
    chat.expiration_time.toMillis() > now.toMillis()
  );
}

/**
 * IDLE → PENDING. Called by the client before sending the first message of a
 * cycle. Either places a 1-credit hold (non-premium) or records a hold-free
 * pending cycle (premium). There is no match prerequisite (removed
 * 2026-07-19): being premium or holding a spendable credit is the only gate.
 *
 * Idempotent: calling while already PENDING as the same initiator succeeds
 * without a second hold (AC 1.5).
 */
export const initiateChat = onCall<{ chatId?: string }>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to start a chat.");

  const chatId = request.data.chatId;
  if (typeof chatId !== "string") throw new HttpsError("invalid-argument", "chatId is required.");

  const pair = participantsOf(chatId);
  if (!pair) throw new HttpsError("invalid-argument", "Malformed chatId.");
  if (!pair.includes(uid)) throw new HttpsError("permission-denied", "You are not part of this chat.");
  const otherUid = pair[0] === uid ? pair[1] : pair[0];

  const chatRef = db.collection("chats").doc(chatId);
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    // All reads before writes (Firestore transaction requirement).
    const [chatSnap, userSnap] = await Promise.all([
      tx.get(chatRef),
      tx.get(userRef),
    ]);

    const now = admin.firestore.Timestamp.now();
    const chat = (chatSnap.data() ?? {}) as ChatCreditFields;

    if (chat.credit_status === "pending") {
      const holdExpired =
        chat.hold_placed_at != null &&
        now.toMillis() - chat.hold_placed_at.toMillis() > HOLD_WINDOW_HOURS * HOUR_MS;
      if (chat.initiator_id === uid && !holdExpired) {
        return { status: "pending", held: chat.credit_held === true, alreadyPending: true };
      }
      if (!holdExpired) {
        // The other user initiated first — this caller is now a recipient and
        // replies for free; there is nothing to initiate.
        throw new HttpsError("failed-precondition", "ALREADY_PENDING_BY_OTHER");
      }
      // Hold expired but the scheduler hasn't swept it yet: fall through and
      // let this initiation supersede it after refunding the stale hold below.
    }

    if (isWindowActive(chat, now)) {
      return { status: "connected", held: false, alreadyConnected: true };
    }

    const isPremium = userSnap.get("is_premium") === true;

    // Refund a stale, not-yet-swept hold before starting the new cycle
    // (only reachable when credit_status === 'pending' with an expired hold).
    if (chat.credit_status === "pending" && chat.credit_held === true && chat.initiator_id) {
      const staleInitiatorRef = db.collection("users").doc(chat.initiator_id);
      tx.update(staleInitiatorRef, {
        credits_on_hold: admin.firestore.FieldValue.increment(-1),
      });
    }

    if (!isPremium) {
      const balance = (userSnap.get("credit_balance") as number | null) ?? 0;
      const held = (userSnap.get("credits_on_hold") as number | null) ?? 0;
      if (balance - held < 1) {
        throw new HttpsError("failed-precondition", "INSUFFICIENT_CREDITS");
      }
      tx.set(userRef, { credits_on_hold: held + 1 }, { merge: true });
    }

    tx.set(
      chatRef,
      {
        credit_status: "pending",
        initiator_id: uid,
        hold_placed_at: now,
        connected_at: null,
        credit_held: !isPremium,
        participants: pair,
      },
      { merge: true }
    );

    logger.info(`initiateChat: ${uid} → ${otherUid} (${chatId}), held=${!isPremium}`);
    return { status: "pending", held: !isPremium };
  });
});

/**
 * PENDING → CONNECTED. Fires on every message; acts only when the message is
 * the recipient's first reply in a pending cycle. Captures the hold (balance
 * −1, hold −1) atomically and opens the 48h window (AC 3.3, 3.5, 5.6).
 */
export const onMessageCreated = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const chatId = event.params.chatId;
    const senderId = snap.get("sender_id") as string | undefined;
    if (!senderId) return;

    const pair = participantsOf(chatId);
    if (!pair || !pair.includes(senderId)) return;

    const chatRef = db.collection("chats").doc(chatId);

    // Cheap pre-check outside the transaction to skip the common case
    // (messages inside an active window) without transaction overhead.
    const pre = (await chatRef.get()).data() as ChatCreditFields | undefined;
    if (!pre || pre.credit_status !== "pending" || pre.initiator_id === senderId) return;

    const result = await db.runTransaction(async (tx) => {
      const chatSnap = await tx.get(chatRef);
      const chat = (chatSnap.data() ?? {}) as ChatCreditFields;
      const now = admin.firestore.Timestamp.now();

      // Re-verify inside the transaction — a concurrent refund or duplicate
      // trigger invocation must resolve to exactly one capture (AC 5.6).
      if (chat.credit_status !== "pending" || chat.initiator_id === senderId) return null;
      const initiatorId = chat.initiator_id;
      if (!initiatorId || !pair.includes(initiatorId)) return null;

      if (chat.credit_held === true) {
        const initiatorRef = db.collection("users").doc(initiatorId);
        const initiatorSnap = await tx.get(initiatorRef);
        const balance = (initiatorSnap.get("credit_balance") as number | null) ?? 0;
        const held = (initiatorSnap.get("credits_on_hold") as number | null) ?? 0;
        tx.set(
          initiatorRef,
          {
            credit_balance: Math.max(0, balance - 1),
            credits_on_hold: Math.max(0, held - 1),
          },
          { merge: true }
        );
      }

      const expiration = admin.firestore.Timestamp.fromMillis(
        now.toMillis() + CHAT_WINDOW_HOURS * HOUR_MS
      );
      tx.set(
        chatRef,
        {
          credit_status: "connected",
          connected_at: now,
          expiration_time: expiration,
          credit_held: false,
          // Legacy fields so pre-v2 clients keep working during rollout (spec §8).
          is_unlocked: true,
          unlock_time: now,
        },
        { merge: true }
      );
      return { initiatorId, captured: chat.credit_held === true };
    });

    if (result) {
      logger.info(
        `Connection made on ${chatId}: ${senderId} replied to ${result.initiatorId}, captured=${result.captured}`
      );
      await sendPush(
        result.initiatorId,
        "You're connected 🎉",
        "They replied — chat free for the next 48 hours!"
      );
    }
  }
);

/**
 * PENDING → IDLE. Sweeps holds older than 48h with no reply: returns the
 * credit and notifies the initiator (AC 5.1–5.3). Runs server-side so refunds
 * happen even when the app is closed or uninstalled (AC 5.2).
 */
export const releaseExpiredHolds = onSchedule("every 15 minutes", async () => {
  const cutoff = admin.firestore.Timestamp.fromMillis(
    Date.now() - HOLD_WINDOW_HOURS * HOUR_MS
  );

  const expired = await db
    .collection("chats")
    .where("credit_status", "==", "pending")
    .where("hold_placed_at", "<", cutoff)
    .limit(200)
    .get();

  if (expired.empty) return;
  logger.info(`releaseExpiredHolds: sweeping ${expired.size} expired hold(s)`);

  for (const docSnap of expired.docs) {
    try {
      const refunded = await db.runTransaction(async (tx) => {
        const chatSnap = await tx.get(docSnap.ref);
        const chat = (chatSnap.data() ?? {}) as ChatCreditFields;

        // Re-verify — a reply may have connected the chat since the query
        // (AC 5.6: capture or refund, never both).
        if (
          chat.credit_status !== "pending" ||
          chat.hold_placed_at == null ||
          chat.hold_placed_at.toMillis() >= cutoff.toMillis()
        ) {
          return null;
        }

        const initiatorId = chat.initiator_id ?? null;
        if (chat.credit_held === true && initiatorId) {
          const initiatorRef = db.collection("users").doc(initiatorId);
          const initiatorSnap = await tx.get(initiatorRef);
          const held = (initiatorSnap.get("credits_on_hold") as number | null) ?? 0;
          tx.set(initiatorRef, { credits_on_hold: Math.max(0, held - 1) }, { merge: true });
        }

        tx.set(
          docSnap.ref,
          {
            credit_status: "idle",
            initiator_id: null,
            hold_placed_at: null,
            credit_held: false,
          },
          { merge: true }
        );
        return initiatorId;
      });

      if (refunded) {
        await sendPush(
          refunded,
          "Your credit has been returned",
          "They didn't reply within 48 hours, so nothing was charged."
        );
      }
    } catch (err) {
      logger.error(`Failed to release hold on ${docSnap.id}`, err);
    }
  }
});
