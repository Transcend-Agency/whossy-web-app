import { describe, expect, it } from "vitest";
import { isChatUnread } from "./chatUnread";

const fromThem = { sender_id: "them", sender_id_blocked: false };

describe("isChatUnread", () => {
    it("counts a chat whose latest message is from the other person and not yet opened", () => {
        expect(isChatUnread({ status: "sent" }, fromThem, "me")).toBe(true);
    });

    it("does not count a chat once it has been opened", () => {
        expect(isChatUnread({ status: "seen" }, fromThem, "me")).toBe(false);
    });

    it("does not count a chat whose latest message is my own", () => {
        expect(isChatUnread({ status: "sent" }, { sender_id: "me", sender_id_blocked: false }, "me")).toBe(false);
    });

    it("does not count a message from someone blocked", () => {
        expect(isChatUnread({ status: "sent" }, { sender_id: "them", sender_id_blocked: true }, "me")).toBe(false);
    });

    it("treats a missing blocked flag as not blocked", () => {
        expect(isChatUnread({ status: "sent" }, { sender_id: "them" } as never, "me")).toBe(true);
    });

    it("does not count a chat with no message, no chat, or no signed-in user", () => {
        expect(isChatUnread({ status: "sent" }, null, "me")).toBe(false);
        expect(isChatUnread(null, fromThem, "me")).toBe(false);
        expect(isChatUnread({ status: "sent" }, fromThem, undefined)).toBe(false);
        // getLastValidMessage returns an error string when the read fails.
        expect(isChatUnread({ status: "sent" }, "Error loading message" as never, "me")).toBe(false);
    });
});
