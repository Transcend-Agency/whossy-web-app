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

/** When `uid` last viewed the chat, or null if they have no marker yet. */
export function readAt(chat: Pick<Chat, "last_read_at"> | null | undefined, uid: string): number | null {
    return toMillis(chat?.last_read_at?.[uid]);
}

/**
 * Whether a chat counts as unread for `myUid`: its latest message came from
 * the other person, isn't from someone blocked, and arrived after `myUid`
 * last viewed the chat.
 *
 * "Last viewed" is the chat's `last_read_at[myUid]`, which is written
 * whether or not read receipts are on. Chats from before that marker
 * existed fall back to the read receipt (`status` still "sent").
 *
 * Shared by the "Unread" label on each chat row and the count on the chat
 * drawer, so the two always agree.
 */
export function isChatUnread(
    chat: Pick<Chat, "status" | "last_read_at"> | null | undefined,
    lastMessage: Pick<Messages, "sender_id" | "sender_id_blocked" | "timestamp"> | null | undefined,
    myUid: string | null | undefined,
): boolean {
    if (!chat || !lastMessage || typeof lastMessage !== "object" || !myUid) return false;
    if (lastMessage.sender_id === myUid || lastMessage.sender_id_blocked === true) return false;

    const read = readAt(chat, myUid);
    const sent = toMillis(lastMessage.timestamp as Stamp);
    if (read !== null && sent !== null) return sent > read;
    return chat.status === "sent";
}

/** Whether `uid`'s read marker is missing or older than the chat's last
 *  message, i.e. viewing the chat now should move it on. */
export function readMarkerBehind(
    chat: Pick<Chat, "last_read_at" | "last_message_timestamp"> | null | undefined,
    uid: string,
): boolean {
    const read = readAt(chat, uid);
    if (read === null) return true;
    const last = toMillis(chat?.last_message_timestamp);
    return last === null || last > read;
}
