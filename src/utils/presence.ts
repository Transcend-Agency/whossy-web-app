/**
 * Presence is written to Realtime Database and mirrored into Firestore
 * `users/{uid}.status` by functions/src/presence.ts (pre-launch plan C1).
 * `status.online` alone isn't trustworthy — RTDB's `onDisconnect` can lag or
 * never fire on a force-quit or lost signal — so "is this person actually
 * around" is online AND seen within a short recency window, not the raw flag.
 */

export const RECENCY_WINDOW_MS = 5 * 60 * 1000;

export type PresenceStatus = { online?: boolean | null; lastSeen?: number | null } | null | undefined;

export function isRecentlyOnline(status: PresenceStatus, now: number = Date.now()): boolean {
	if (!status?.online) return false;
	if (typeof status.lastSeen !== "number") return false;
	return now - status.lastSeen < RECENCY_WINDOW_MS;
}
