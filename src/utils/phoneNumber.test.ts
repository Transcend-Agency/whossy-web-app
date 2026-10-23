import { describe, expect, it } from "vitest"
import { withTypedDialCode } from "./phoneNumber"

describe("withTypedDialCode", () => {
    it("reads a number typed with its dial code but no plus", () => {
        expect(withTypedDialCode("+12348148836800")).toBe("+2348148836800")
    })

    it("leaves a US number alone", () => {
        expect(withTypedDialCode("+16505553434")).toBe("+16505553434")
    })

    it("leaves a number that already has another dial code alone", () => {
        expect(withTypedDialCode("+2348148836800")).toBe("+2348148836800")
    })

    it("leaves an empty field alone", () => {
        expect(withTypedDialCode(undefined)).toBeUndefined()
        expect(withTypedDialCode("")).toBe("")
    })

    it("leaves too-long digits that are not a number of their own", () => {
        expect(withTypedDialCode("+19999999999999")).toBe("+19999999999999")
    })
})
