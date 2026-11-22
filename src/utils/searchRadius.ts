import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { DEFAULT_DISCOVERY_RADIUS_MILES } from "@/constants";
import { UserFilters } from "@/types/user";

/**
 * The viewer's saved search settings (filters/{uid}): Distance Radius and
 * the age filter, as set in Preferences. Null if they can't be read, in
 * which case callers fall back to no age filter and the default radius.
 */
export async function fetchUserFilters(uid: string): Promise<UserFilters | null> {
	try {
		const snap = await getDoc(doc(db, "filters", uid));
		return snap.exists() ? (snap.data() as UserFilters) : null;
	} catch (error) {
		console.error("Couldn't read the search settings, using the defaults:", error);
		return null;
	}
}

/**
 * The Distance Radius in miles.
 *
 * The same number is also copied onto the user document at onboarding, but
 * Preferences only updates filters/{uid}, so that copy goes stale the first
 * time someone changes it. `fallbackMiles` (the user document's copy) is
 * only used when filters/{uid} has no radius.
 */
export function searchRadiusMiles(filters: UserFilters | null, fallbackMiles?: number | null): number {
	const radius = filters?.distance;
	if (typeof radius === "number" && radius > 0) return radius;
	return typeof fallbackMiles === "number" && fallbackMiles > 0 ? fallbackMiles : DEFAULT_DISCOVERY_RADIUS_MILES;
}

export async function fetchSearchRadiusMiles(uid: string, fallbackMiles?: number | null): Promise<number> {
	return searchRadiusMiles(await fetchUserFilters(uid), fallbackMiles);
}
