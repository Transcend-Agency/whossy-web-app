import { describe, expect, it } from "vitest";
import { distanceInMiles } from "./distance";

describe("distanceInMiles", () => {
	it("is 0 for identical coordinates", () => {
		expect(distanceInMiles([6.5244, 3.3792], [6.5244, 3.3792])).toBe(0);
	});

	it("matches a known distance (Lagos to Abuja, ~327mi great-circle)", () => {
		const lagos: [number, number] = [6.5244, 3.3792];
		const abuja: [number, number] = [9.0765, 7.3986];
		expect(distanceInMiles(lagos, abuja)).toBeGreaterThan(310);
		expect(distanceInMiles(lagos, abuja)).toBeLessThan(345);
	});
});
