import { describe, expect, it } from "vitest";
import { nearbyFirst, sortNearestFirst } from "./nearbyFirst";

const p = (uid: string, distanceMiles: number | null) => ({ profile: { uid }, distanceMiles });
const ids = (list: { uid?: string | null }[]) => list.map((u) => u.uid);

describe("sortNearestFirst", () => {
	it("puts the nearest first and unknown distances last", () => {
		expect(sortNearestFirst([p("far", 80), p("unknown", null), p("near", 2)]).map((r) => r.profile.uid)).toEqual([
			"near",
			"far",
			"unknown",
		]);
	});
});

describe("nearbyFirst", () => {
	it("shows everyone in the radius before anyone outside it", () => {
		const nearby = [p("n2", 10), p("n1", 1)];
		// Someone outside the radius but nearer than nobody in it still comes after.
		const rest = [p("r1", 300), p("r2", 60)];
		expect(ids(nearbyFirst(nearby, rest))).toEqual(["n1", "n2", "r2", "r1"]);
	});

	it("keeps people with no location, after everyone else", () => {
		expect(ids(nearbyFirst([], [p("unknown", null), p("r", 500)]))).toEqual(["r", "unknown"]);
	});

	it("never shows someone twice", () => {
		expect(ids(nearbyFirst([p("a", 1)], [p("a", 1), p("b", 90)]))).toEqual(["a", "b"]);
	});

	it("leaves out people already shown on an earlier page", () => {
		expect(ids(nearbyFirst([], [p("a", 1), p("b", 90)], new Set(["a"])))).toEqual(["b"]);
	});

	it("with no nearby group, is just everyone nearer first", () => {
		expect(ids(nearbyFirst([], [p("x", 40), p("y", 4)]))).toEqual(["y", "x"]);
	});
});
