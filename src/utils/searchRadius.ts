import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { DEFAULT_DISCOVERY_RADIUS_MILES } from "@/constants";

/**
 * The viewer's Distance Radius in miles, as set on the Preferences page
 * (stored in filters/{uid}).
 *
 * The same number is also copied onto the user document at onboarding, but
 * Preferences only updates filters/{uid}, so that copy goes stale the first
 * time someone changes it. `fallbackMiles` (the user document's copy) is
 * only used when filters/{uid} has no radius.
 */
export async function fetchSearchRadiusMiles(uid: string, fallbackMiles?: number | null): Promise<number> {
	try {
		const radius = (await getDoc(doc(db, "filters", uid))).get("distance");
		if (typeof radius === "number" && radius > 0) return radius;
	} catch (error) {
		console.error("Couldn't read the search radius, using the default:", error);
	}
	return typeof fallbackMiles === "number" && fallbackMiles > 0 ? fallbackMiles : DEFAULT_DISCOVERY_RADIUS_MILES;
}
