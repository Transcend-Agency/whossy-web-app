import { Messages, ReplyTo } from "@/types/chat";

/** Longest quote kept, as on mobile. */
export const MAX_QUOTE_LENGTH = 200;

/** Builds the quote for a message being replied to. */
export function quoteOf(message: Pick<Messages, "id" | "sender_id" | "message" | "photo">): ReplyTo {
    const text = message.message?.trim() ?? "";
    const quote: ReplyTo = {
        id: message.id,
        sender_id: message.sender_id,
        has_photo: !!message.photo,
    };
    if (text) {
        quote.message = text.length > MAX_QUOTE_LENGTH ? `${text.slice(0, MAX_QUOTE_LENGTH)}…` : text;
    }
    return quote;
}

/** One-line summary of a quote. */
export function quotePreview(quote: Pick<ReplyTo, "message" | "has_photo">): string {
    return quote.message || (quote.has_photo ? "📷 Photo" : "Message");
}

/** Reads a stored quote, or null when it is missing or malformed, so one bad
 *  quote can't break the chat. */
export function parseReplyTo(value: unknown): ReplyTo | null {
    if (!value || typeof value !== "object") return null;
    const v = value as Record<string, unknown>;
    if (typeof v.id !== "string" || typeof v.sender_id !== "string") return null;
    return {
        id: v.id,
        sender_id: v.sender_id,
        has_photo: v.has_photo === true,
        ...(typeof v.message === "string" && v.message ? { message: v.message } : {}),
    };
}
