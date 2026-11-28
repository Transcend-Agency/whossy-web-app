import { describe, expect, it } from "vitest";
import { MAX_QUOTE_LENGTH, parseReplyTo, quoteOf, quotePreview } from "./chatReply";

describe("quoteOf", () => {
    it("copies the message's id, sender and text", () => {
        expect(quoteOf({ id: "m1", sender_id: "them", message: " Coffee? ", photo: null }))
            .toEqual({ id: "m1", sender_id: "them", message: "Coffee?", has_photo: false });
    });

    it("cuts long text, as the mobile app does", () => {
        const quote = quoteOf({ id: "m1", sender_id: "them", message: "x".repeat(300), photo: null });
        expect(quote.message).toHaveLength(MAX_QUOTE_LENGTH + 1);
        expect(quote.message?.endsWith("…")).toBe(true);
    });

    it("leaves out the text for a photo on its own", () => {
        const quote = quoteOf({ id: "m1", sender_id: "them", message: null, photo: "https://x/p.jpg" });
        expect(quote).toEqual({ id: "m1", sender_id: "them", has_photo: true });
        expect("message" in quote).toBe(false);
    });
});

describe("quotePreview", () => {
    it("prefers the text, then says it was a photo", () => {
        expect(quotePreview({ message: "Hi", has_photo: true })).toBe("Hi");
        expect(quotePreview({ has_photo: true })).toBe("📷 Photo");
        expect(quotePreview({ has_photo: false })).toBe("Message");
    });
});

describe("parseReplyTo", () => {
    it("reads a quote written by either app", () => {
        expect(parseReplyTo({ id: "m1", sender_id: "them", message: "Hi", has_photo: false }))
            .toEqual({ id: "m1", sender_id: "them", message: "Hi", has_photo: false });
    });

    it("drops a missing or malformed quote", () => {
        expect(parseReplyTo(undefined)).toBeNull();
        expect(parseReplyTo("nope")).toBeNull();
        expect(parseReplyTo({ message: "no id" })).toBeNull();
        expect(parseReplyTo({ id: 1, sender_id: "them" })).toBeNull();
    });
});
