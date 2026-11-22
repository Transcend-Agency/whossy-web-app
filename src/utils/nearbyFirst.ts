export interface Ranked<T> {
	profile: T;
	/** Null when either person has no saved location. */
	distanceMiles: number | null;
}

/** Nearest first; unknown distances go last, keeping their order. */
export function sortNearestFirst<T>(items: Ranked<T>[]): Ranked<T>[] {
	return [...items].sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
}

/**
 * Swipe deck order: everyone inside the search radius (nearest first), then
 * everyone else (nearer first). Nobody is dropped for being far away. People
 * already in the nearby group, or in `skipIds` (shown on an earlier page),
 * are left out of the second group so nobody appears twice.
 */
export function nearbyFirst<T extends { uid?: string | null }>(
	nearby: Ranked<T>[],
	everyoneElse: Ranked<T>[],
	skipIds: ReadonlySet<string> = new Set()
): T[] {
	const nearbyIds = new Set(nearby.map((n) => n.profile.uid));
	const rest = everyoneElse.filter((e) => !nearbyIds.has(e.profile.uid) && !(e.profile.uid && skipIds.has(e.profile.uid)));
	return [...sortNearestFirst(nearby), ...sortNearestFirst(rest)].map((r) => r.profile);
}
