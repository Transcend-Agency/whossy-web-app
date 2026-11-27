import { Chat, Messages } from "@/types/chat";

/**
 * Whether a chat counts as unread for `myUid`: its latest message came from
 * the other person, isn't from someone blocked, and the chat hasn't been
 * opened since (the chat's status is still "sent"; opening it sets "seen").
 *
 * Shared by the "Unread" label on each chat row and the count on the chat
 * drawer, so the two always agree.
 */
export function isChatUnread(
    chat: Pick<Chat, "status"> | null | undefined,
    lastMessage: Pick<Messages, "sender_id" | "sender_id_blocked"> | null | undefined,
    myUid: string | null | undefined,
): boolean {
    if (!chat || !lastMessage || typeof lastMessage !== "object" || !myUid) return false;
    return chat.status === "sent"
        && lastMessage.sender_id !== myUid
        && lastMessage.sender_id_blocked !== true;
}
