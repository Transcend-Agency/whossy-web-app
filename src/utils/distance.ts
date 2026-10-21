import { distanceBetween } from "geofire-common";
import { kmToMiles } from "./units";

export type LatLng = [number, number];

/** geofire-common's distanceBetween returns km; every display site here is miles (C3). */
export function distanceInMiles(a: LatLng, b: LatLng): number {
	return kmToMiles(distanceBetween(a, b));
}
