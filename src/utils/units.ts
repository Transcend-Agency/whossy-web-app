/**
 * The distance preference sliders (onboarding + Preferences) are labelled
 * "mi" everywhere in the UI — miles is the one storage/display unit (C3/C6
 * decision). Geo libraries (geofire-common) work in kilometres, so convert
 * only at the point of consumption, never store or display km.
 */

const KM_PER_MILE = 1.609344;

export function milesToKm(miles: number): number {
	return miles * KM_PER_MILE;
}

export function kmToMiles(km: number): number {
	return km / KM_PER_MILE;
}
