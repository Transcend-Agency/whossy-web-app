import { describe, expect, it } from "vitest";
import { isSearchable } from "./userSearch";

describe("isSearchable", () => {
    it("needs a word of at least two letters", () => {
        expect(isSearchable("a")).toBe(false);
        expect(isSearchable("a b")).toBe(false);
        expect(isSearchable("ad")).toBe(true);
        expect(isSearchable("a obi")).toBe(true);
    });

    it("ignores punctuation and counts an accented letter once", () => {
        expect(isSearchable(" - ' ")).toBe(false);
        expect(isSearchable("o'")).toBe(false);
        expect(isSearchable("é")).toBe(false);
        expect(isSearchable("ém")).toBe(true);
    });
});
