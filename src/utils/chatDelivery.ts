import { Chat, Messages } from "@/types/chat";

type Stamp = Chat["last_message_timestamp"] | null | undefined;

/** Milliseconds from a Firestore timestamp (or the `{seconds, nanoseconds}`
 *  shape), null for anything else, including a pending server timestamp. */
function toMillis(t: Stamp): number | null {
    if (!t || typeof t !== "object") return null;
    const { seconds, nanoseconds } = t as { seconds?: unknown, nanoseconds?: unknown };
    if (typeof seconds !== "number") return null;
    return seconds * 1000 + (typeof nanoseconds === "number" ? nanoseconds / 1e6 : 0);
}

/**
 * What the ticks under one of your own messages show. Matches the mobile app:
 * - "pending": still on the sender's phone (sent while offline)
 * - "sent": one grey tick, not on their device yet
 * - "delivered": two grey ticks, their device has it
 * - "read": two blue ticks, they have read it
 */
export type TickState = "pending" | "sent" | "delivered" | "read";

/** When `uid`'s device last received the chat's messages. */
export function deliveredAt(chat: Pick<Chat, "delivered_at"> | null | undefined, uid: string | null | undefined): number | null {
    if (!uid) return null;
    return toMillis(chat?.delivered_at?.[uid]);
}

/**
 * The ticks for one of your messages.
 *
 * Delivery is not kept on the message: the recipient's device moves its own
 * `delivered_at` time on the chat, and every message sent up to then has
 * been delivered. `status` keeps to the values older mobile builds can read.
 *
 * `showRead` is false while read receipts are off; a read message then
 * shows as delivered.
 */
export function tickStateFor(
    message: Pick<Messages, "status" | "timestamp">,
    recipientDeliveredAt: number | null,
    showRead: boolean,
): TickState {
    if (message.status === "undelivered") return "pending";
    if (message.status === "seen") return showRead ? "read" : "delivered";
    const sent = toMillis(message.timestamp as Stamp);
    return sent !== null && recipientDeliveredAt !== null && sent <= recipientDeliveredAt
        ? "delivered"
        : "sent";
}

/** Whether this device should tell the sender it has received the chat's
 *  latest message: the other person sent it, and `uid`'s `delivered_at` is
 *  older than it or not set. */
export function needsDeliveryAck(
    chat: Pick<Chat, "last_sender_id" | "last_message_timestamp" | "delivered_at"> | null | undefined,
    uid: string | null | undefined,
): boolean {
    if (!chat || !uid || !chat.last_sender_id || chat.last_sender_id === uid) return false;
    const last = toMillis(chat.last_message_timestamp);
    if (last === null) return false;
    const mine = deliveredAt(chat, uid);
    return mine === null || mine < last;
}
