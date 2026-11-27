import { describe, expect, it } from "vitest";
import { isChatUnread, readMarkerBehind } from "./chatUnread";

const at = (ms: number) => ({ seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6 });
const T = 1_700_000_000_000;
const fromThem = (ms = T) => ({ sender_id: "them", sender_id_blocked: false, timestamp: at(ms) });

describe("isChatUnread with a read marker", () => {
    it("counts a message that arrived after I last viewed the chat", () => {
        expect(isChatUnread({ status: "seen", last_read_at: { me: at(T - 1000) } }, fromThem(T), "me")).toBe(true);
    });

    it("does not count a message I viewed, even with read receipts off (status still sent)", () => {
        expect(isChatUnread({ status: "sent", last_read_at: { me: at(T + 1000) } }, fromThem(T), "me")).toBe(false);
    });

    it("ignores the other person's marker", () => {
        expect(isChatUnread({ status: "sent", last_read_at: { them: at(T + 1000) } }, fromThem(T), "me")).toBe(true);
    });

    it("falls back to the read receipt when the message time isn't known yet", () => {
        const pending = { sender_id: "them", sender_id_blocked: false, timestamp: null as never };
        expect(isChatUnread({ status: "sent", last_read_at: { me: at(T) } }, pending, "me")).toBe(true);
        expect(isChatUnread({ status: "seen", last_read_at: { me: at(T) } }, pending, "me")).toBe(false);
    });
});

describe("isChatUnread without a read marker (older chats)", () => {
    it("uses the read receipt: unread until the chat is opened", () => {
        expect(isChatUnread({ status: "sent" }, fromThem(), "me")).toBe(true);
        expect(isChatUnread({ status: "seen" }, fromThem(), "me")).toBe(false);
    });
});

describe("isChatUnread, never unread", () => {
    it("when the latest message is my own", () => {
        expect(isChatUnread({ status: "sent" }, { ...fromThem(), sender_id: "me" }, "me")).toBe(false);
    });

    it("when the message is from someone blocked", () => {
        expect(isChatUnread({ status: "sent" }, { ...fromThem(), sender_id_blocked: true }, "me")).toBe(false);
    });

    it("with no message, no chat, no signed-in user, or a failed message read", () => {
        expect(isChatUnread({ status: "sent" }, null, "me")).toBe(false);
        expect(isChatUnread(null, fromThem(), "me")).toBe(false);
        expect(isChatUnread({ status: "sent" }, fromThem(), undefined)).toBe(false);
        expect(isChatUnread({ status: "sent" }, "Error loading message" as never, "me")).toBe(false);
    });

    it("treats a missing blocked flag as not blocked", () => {
        expect(isChatUnread({ status: "sent" }, { sender_id: "them", timestamp: at(T) } as never, "me")).toBe(true);
    });
});

describe("readMarkerBehind", () => {
    it("is behind with no marker yet", () => {
        expect(readMarkerBehind({ last_message_timestamp: at(T) }, "me")).toBe(true);
    });

    it("is behind when a message arrived after the marker, and not once it has caught up", () => {
        expect(readMarkerBehind({ last_message_timestamp: at(T), last_read_at: { me: at(T - 1) } }, "me")).toBe(true);
        expect(readMarkerBehind({ last_message_timestamp: at(T), last_read_at: { me: at(T) } }, "me")).toBe(false);
        expect(readMarkerBehind({ last_message_timestamp: at(T), last_read_at: { me: at(T + 5) } }, "me")).toBe(false);
    });

    it("moves on when the chat's last message time is unknown", () => {
        expect(readMarkerBehind({ last_read_at: { me: at(T) } } as never, "me")).toBe(true);
    });
});
