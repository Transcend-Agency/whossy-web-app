import { describe, expect, it } from "vitest";
import { calculateAge } from "./age";

describe("calculateAge", () => {
	const now = new Date(2026, 5, 15); // June 15, 2026

	it("birthday already passed this year", () => {
		expect(calculateAge(new Date(2000, 0, 1), now)).toBe(26); // Jan 1
	});

	it("birthday is today", () => {
		expect(calculateAge(new Date(2000, 5, 15), now)).toBe(26);
	});

	it("birthday is tomorrow — hasn't turned this year's age yet", () => {
		expect(calculateAge(new Date(2000, 5, 16), now)).toBe(25);
	});

	it("birthday was yesterday", () => {
		expect(calculateAge(new Date(2000, 5, 14), now)).toBe(26);
	});

	it("turning exactly 18 today is 18, not 17 or 19", () => {
		expect(calculateAge(new Date(2008, 5, 15), now)).toBe(18);
	});

	it("Feb 29 birthday in a non-leap current year", () => {
		expect(calculateAge(new Date(2000, 1, 29), new Date(2025, 1, 28))).toBe(24);
		expect(calculateAge(new Date(2000, 1, 29), new Date(2025, 2, 1))).toBe(25);
	});

	it("null/undefined dob returns null", () => {
		expect(calculateAge(null)).toBeNull();
		expect(calculateAge(undefined)).toBeNull();
	});
});
