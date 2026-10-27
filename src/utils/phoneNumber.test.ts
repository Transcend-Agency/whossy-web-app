import { describe, expect, it } from "vitest"
import { phoneSignInErrorMessage, withTypedDialCode } from "./phoneNumber"

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

    it("drops the local trunk zero once the number is complete", () => {
        expect(withTypedDialCode("+23408148836800")).toBe("+2348148836800")
    })

    it("keeps the zero in Italian numbers", () => {
        expect(withTypedDialCode("+390612345678")).toBe("+390612345678")
    })

    it("leaves a partly typed number alone", () => {
        expect(withTypedDialCode("+2340814")).toBe("+2340814")
    })

    it("leaves an empty field alone", () => {
        expect(withTypedDialCode(undefined)).toBeUndefined()
        expect(withTypedDialCode("")).toBe("")
    })

    it("leaves too-long digits that are not a number of their own", () => {
        expect(withTypedDialCode("+19999999999999")).toBe("+19999999999999")
    })
})

describe("phoneSignInErrorMessage", () => {
    it("explains a refused reCAPTCHA instead of saying sign-in is down", () => {
        const message = phoneSignInErrorMessage("auth/invalid-app-credential")
        expect(message).toMatch(/robot/)
        expect(message).not.toMatch(/down/i)
    })

    it("gives every failure a plain message", () => {
        for (const code of ["auth/invalid-phone-number", "auth/too-many-requests", "auth/quota-exceeded", "auth/network-request-failed", "", "auth/something-new"]) {
            expect(phoneSignInErrorMessage(code)).not.toMatch(/auth\/|firebase/i)
        }
    })
})
