import { DocumentData, Query, endAt, getDocs, orderBy, query, startAt } from "firebase/firestore";
import { geohashQueryBounds, distanceBetween } from "geofire-common";
import { User } from "@/types/user";

export interface GeoFetchResult {
	profile: User;
	distanceKm: number;
}

/**
 * Fetches profiles within `radiusKm` of `center` by issuing one Firestore
 * query per geohash bound pair (there can be up to 9 — see the identical
 * pattern already in SwipingAndMatching.tsx), then rechecking the real
 * distance client-side since a geohash bounding box is a rectangle, not a
 * circle, so it always over-includes at the corners.
 *
 * `baseQuery` should already carry any non-geo where() clauses (onboarding
 * completion, gender, etc.) — this appends `orderBy('geohash')` + the bound.
 * Shared by C2's "Popular in my area" (bounded to the user's saved radius,
 * sorted by popularity) and anywhere else that needs a real area query
 * rather than the unbounded fetch most filters use.
 */
export async function fetchProfilesWithinRadius(
	baseQuery: Query<DocumentData>,
	center: [number, number],
	radiusKm: number
): Promise<GeoFetchResult[]> {
	const bounds = geohashQueryBounds(center, radiusKm * 1000);

	const snapshots = await Promise.all(
		bounds.map((b) => getDocs(query(baseQuery, orderBy("geohash"), startAt(b[0]), endAt(b[1]))))
	);

	const byUid = new Map<string, GeoFetchResult>();
	for (const snap of snapshots) {
		for (const doc of snap.docs) {
			const profile = doc.data() as User;
			if (typeof profile.latitude !== "number" || typeof profile.longitude !== "number") continue;
			if (!profile.uid || byUid.has(profile.uid)) continue;

			const distanceKm = distanceBetween([profile.latitude, profile.longitude], center);
			if (distanceKm <= radiusKm) {
				byUid.set(profile.uid, { profile, distanceKm });
			}
		}
	}
	return Array.from(byUid.values());
}
