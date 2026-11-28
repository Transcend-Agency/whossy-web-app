import { describe, expect, it } from "vitest";
import { deliveredAt, needsDeliveryAck, tickStateFor } from "./chatDelivery";

const at = (ms: number) => ({ seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6 });
const T = 1_700_000_000_000;
const mine = (status: "sent" | "seen" | "undelivered" = "sent", ms = T) => ({ status, timestamp: at(ms) });

describe("tickStateFor", () => {
    it("shows a message still on the sender's phone as pending", () => {
        expect(tickStateFor(mine("undelivered"), null, true)).toBe("pending");
    });

    it("shows one tick until their device has it", () => {
        expect(tickStateFor(mine(), null, true)).toBe("sent");
        expect(tickStateFor(mine(), T - 1, true)).toBe("sent");
    });

    it("shows two grey ticks once their device has it", () => {
        expect(tickStateFor(mine(), T, true)).toBe("delivered");
        expect(tickStateFor(mine(), T + 5000, true)).toBe("delivered");
    });

    it("shows two blue ticks once read", () => {
        expect(tickStateFor(mine("seen"), null, true)).toBe("read");
    });

    it("shows a read message as delivered while read receipts are off", () => {
        expect(tickStateFor(mine("seen"), null, false)).toBe("delivered");
    });

    it("does not count a message with no server time yet as delivered", () => {
        expect(tickStateFor({ status: "sent", timestamp: null as never }, T, true)).toBe("sent");
    });
});

describe("deliveredAt", () => {
    it("reads one participant's time and ignores the rest", () => {
        const chat = { delivered_at: { me: at(T), them: "oops" as never } };
        expect(deliveredAt(chat, "me")).toBe(T);
        expect(deliveredAt(chat, "them")).toBeNull();
        expect(deliveredAt(chat, null)).toBeNull();
        expect(deliveredAt({}, "me")).toBeNull();
    });
});

describe("needsDeliveryAck", () => {
    const chat = (extra = {}) => ({
        last_sender_id: "them",
        last_message_timestamp: at(T),
        ...extra,
    });

    it("acknowledges a new message from the other person", () => {
        expect(needsDeliveryAck(chat(), "me")).toBe(true);
        expect(needsDeliveryAck(chat({ delivered_at: { me: at(T - 1000) } }), "me")).toBe(true);
    });

    it("does nothing once it is already acknowledged", () => {
        expect(needsDeliveryAck(chat({ delivered_at: { me: at(T) } }), "me")).toBe(false);
    });

    it("does nothing for your own message", () => {
        expect(needsDeliveryAck(chat({ last_sender_id: "me" }), "me")).toBe(false);
    });

    it("ignores the other person's delivery time", () => {
        expect(needsDeliveryAck(chat({ delivered_at: { them: at(T + 9000) } }), "me")).toBe(true);
    });

    it("waits for the message's server time", () => {
        expect(needsDeliveryAck(chat({ last_message_timestamp: null }), "me")).toBe(false);
        expect(needsDeliveryAck(chat(), null)).toBe(false);
    });
});
