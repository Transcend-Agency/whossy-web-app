import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import { birthDateError, toBirthDate } from "./birthDate";

describe("birthDateError", () => {
	const now = new Date(2026, 9, 17); // October 17, 2026

	const check = (year: string, month: string, day: string) =>
		birthDateError({ year, month, day }, now);

	describe("age", () => {
		it("lets someone through on their 18th birthday", () => {
			expect(check("2008", "10", "17")).toBeNull();
		});

		it("refuses someone who turns 18 tomorrow", () => {
			expect(check("2008", "10", "18")).toContain("18");
		});

		it("refuses a birth year that is 18 years back but not yet 18", () => {
			// The old check compared years only and let this through.
			expect(check("2008", "12", "31")).toContain("18");
		});

		it("accepts an adult", () => {
			expect(check("1998", "06", "15")).toBeNull();
		});
	});

	describe("date", () => {
		it("refuses days that do not exist in that month", () => {
			expect(check("2000", "2", "31")).toBe("That date does not exist");
			expect(check("2001", "2", "29")).toBe("That date does not exist");
			expect(check("2000", "4", "31")).toBe("That date does not exist");
		});

		it("accepts a leap day", () => {
			expect(check("2000", "2", "29")).toBeNull();
		});

		it("refuses month and day zero or past the end of the range", () => {
			expect(check("2000", "13", "1")).toBe("That date does not exist");
			expect(check("2000", "0", "10")).toBe("That date does not exist");
			expect(check("2000", "5", "0")).toBe("That date does not exist");
		});

		it("refuses a year in the future or more than 100 years back", () => {
			expect(check("2027", "1", "1")).toBe("Enter a valid birth year");
			expect(check("1925", "1", "1")).toBe("Enter a valid birth year");
		});

		it("asks for the full date when a part is missing or not a number", () => {
			expect(check("", "", "")).toBe("Enter your full date of birth");
			expect(check("1998", "", "15")).toBe("Enter your full date of birth");
			expect(check("19a8", "6", "15")).toBe("Enter your full date of birth");
		});
	});
});

describe("toBirthDate", () => {
	it("keeps a Date as it is", () => {
		const date = new Date(1998, 5, 15);
		expect(toBirthDate(date)?.getTime()).toBe(date.getTime());
	});

	it("turns the ISO string a reloaded onboarding store holds back into the same day", () => {
		const original = new Date(1998, 5, 15);
		const reloaded = JSON.parse(JSON.stringify({ d: original })).d as string;
		const restored = toBirthDate(reloaded);

		expect(typeof reloaded).toBe("string");
		expect(restored?.getFullYear()).toBe(1998);
		expect(restored?.getMonth()).toBe(5);
		expect(restored?.getDate()).toBe(15);
	});

	it("reads a Firestore timestamp", () => {
		const date = new Date(1998, 5, 15);
		expect(toBirthDate(Timestamp.fromDate(date))?.getTime()).toBe(date.getTime());
	});

	it("returns null for nothing or for text that is not a date", () => {
		expect(toBirthDate(null)).toBeNull();
		expect(toBirthDate(undefined)).toBeNull();
		expect(toBirthDate("")).toBeNull();
		expect(toBirthDate("not a date")).toBeNull();
	});
});
