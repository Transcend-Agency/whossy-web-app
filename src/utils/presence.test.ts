import { describe, expect, it } from "vitest";
import { RECENCY_WINDOW_MS, hidesOnlineStatus, isRecentlyOnline } from "./presence";

describe("isRecentlyOnline", () => {
	const now = 1_700_000_000_000;

	it("is true when online and lastSeen is within the recency window", () => {
		expect(isRecentlyOnline({ online: true, lastSeen: now - 1000 }, now)).toBe(true);
	});

	it("is false when online but lastSeen predates the recency window (missed disconnect)", () => {
		expect(isRecentlyOnline({ online: true, lastSeen: now - RECENCY_WINDOW_MS - 1 }, now)).toBe(false);
	});

	it("is false when offline even with a recent lastSeen", () => {
		expect(isRecentlyOnline({ online: false, lastSeen: now - 1000 }, now)).toBe(false);
	});

	it("is false when lastSeen is missing", () => {
		expect(isRecentlyOnline({ online: true }, now)).toBe(false);
	});

	it("is false for null/undefined status", () => {
		expect(isRecentlyOnline(null, now)).toBe(false);
		expect(isRecentlyOnline(undefined, now)).toBe(false);
	});
});

describe("hidesOnlineStatus", () => {
	it("hides a premium user who turned the setting off", () => {
		expect(hidesOnlineStatus({ is_premium: true, user_settings: { online_status: false } })).toBe(true);
	});

	it("does not hide a non-premium user, even with the setting off (premium lapsed)", () => {
		expect(hidesOnlineStatus({ is_premium: false, user_settings: { online_status: false } })).toBe(false);
	});

	it("treats a missing setting as visible", () => {
		expect(hidesOnlineStatus({ is_premium: true, user_settings: {} })).toBe(false);
		expect(hidesOnlineStatus({ is_premium: true })).toBe(false);
		expect(hidesOnlineStatus(null)).toBe(false);
	});

	it("does not hide a premium user who left the setting on", () => {
		expect(hidesOnlineStatus({ is_premium: true, user_settings: { online_status: true } })).toBe(false);
	});
});
