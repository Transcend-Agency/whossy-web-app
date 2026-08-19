import { describe, expect, it } from "vitest";
import { kmToMiles, milesToKm } from "./units";

describe("milesToKm / kmToMiles", () => {
	it("round-trips", () => {
		expect(kmToMiles(milesToKm(50))).toBeCloseTo(50, 6);
	});

	it("a 50 mile radius is ~80km, not ~31km (the pre-fix bug)", () => {
		const km = milesToKm(50);
		expect(km).toBeCloseTo(80.47, 1);
		expect(km).not.toBeCloseTo(31, 0);
	});
});
