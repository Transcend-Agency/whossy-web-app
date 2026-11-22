import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
	activeAgeRange,
	ageFilterSwitchUpdate,
	isInAgeRange,
	myAgeRange,
	startingAgeRange,
} from "./ageFilter";

const now = new Date(2026, 5, 15); // 15 June 2026

describe("activeAgeRange / myAgeRange", () => {
	it("is off when no age range is saved", () => {
		expect(activeAgeRange({})).toBeNull();
		expect(activeAgeRange({ age_range: null })).toBeNull();
		expect(myAgeRange({ age_range: null })).toBeNull();
	});

	it("'In my age range' falls back to the last range chosen", () => {
		const saved = { min: 22, max: 31 };
		expect(activeAgeRange({ age_range: null, saved_age_range: saved })).toBeNull();
		expect(myAgeRange({ age_range: null, saved_age_range: saved })).toEqual(saved);
	});
});

describe("startingAgeRange", () => {
	it("starts 5 years either side of your own age", () => {
		expect(startingAgeRange(new Date(1996, 0, 1), now)).toEqual({ min: 25, max: 35 });
	});

	it("never goes below 18 or above 100", () => {
		expect(startingAgeRange(new Date(2007, 0, 1), now)).toEqual({ min: 18, max: 24 });
		expect(startingAgeRange(new Date(1928, 0, 1), now)).toEqual({ min: 93, max: 100 });
	});

	it("without a date of birth, starts at every age", () => {
		expect(startingAgeRange(null, now)).toEqual({ min: 18, max: 100 });
	});
});

describe("ageFilterSwitchUpdate", () => {
	const start = { min: 25, max: 35 };

	it("switching on the first time uses the starting range", () => {
		expect(ageFilterSwitchUpdate(true, {}, start)).toEqual({ age_range: start, saved_age_range: start });
	});

	it("switching off keeps the range, switching on again restores it", () => {
		const off = ageFilterSwitchUpdate(false, { age_range: { min: 30, max: 45 } }, start);
		expect(off).toEqual({ age_range: null, saved_age_range: { min: 30, max: 45 } });
		expect(ageFilterSwitchUpdate(true, off, start).age_range).toEqual({ min: 30, max: 45 });
	});
});

describe("isInAgeRange", () => {
	const range = { min: 25, max: 30 };
	const born = (y: number, m: number, d: number) => Timestamp.fromDate(new Date(y, m - 1, d));

	it("includes someone who turned the minimum age today", () => {
		expect(isInAgeRange(born(2001, 6, 15), range, now)).toBe(true);
		expect(isInAgeRange(born(2001, 6, 16), range, now)).toBe(false);
	});

	it("includes everyone who is still the maximum age", () => {
		expect(isInAgeRange(born(1996, 1, 1), range, now)).toBe(true); // 30 and a half
		expect(isInAgeRange(born(1995, 6, 16), range, now)).toBe(true); // 31 tomorrow
		expect(isInAgeRange(born(1995, 6, 15), range, now)).toBe(false); // 31 today
	});

	it("never matches a missing date of birth", () => {
		expect(isInAgeRange(undefined, range, now)).toBe(false);
	});
});
