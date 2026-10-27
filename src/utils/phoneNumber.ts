import { isPossiblePhoneNumber, parsePhoneNumber } from "react-phone-number-input"

/** The number without its local trunk 0: +23408148836800 is +2348148836800. */
function withoutTrunkZero(value: string): string {
    try {
        const parsed = parsePhoneNumber(value)
        const typed = value.replace(/[^\d+]/g, "")
        return parsed?.isPossible() && parsed.number !== typed ? parsed.number : value
    } catch {
        return value
    }
}

/**
 * The phone field opens on +1 (US). Someone who types a number that already
 * begins with its dial code, such as 2348148836800, ends up with
 * +12348148836800: too long to be a US number and not valid as typed. When the
 * digits after the +1 are more than a US number can hold and they form a valid
 * number of their own, read them as the international number.
 *
 * A number written the local way for another country, such as +23408148836800
 * for 0814 883 6800 in Nigeria, loses its leading trunk 0.
 */
export function withTypedDialCode(value: string | undefined): string | undefined {
    if (!value) return value

    if (value.startsWith("+1")) {
        const rest = value.slice(2).replace(/\D/g, "")

        if (rest.length > 10) {
            const candidate = `+${rest}`

            if (isPossiblePhoneNumber(candidate)) {
                return parsePhoneNumber(candidate)?.number ?? value
            }
        }

        return value
    }

    return withoutTrunkZero(value)
}

/**
 * What to tell someone whose request for a sign-in code failed, from the
 * Firebase error code. Firebase's own messages mean nothing to a user.
 */
export function phoneSignInErrorMessage(code: string): string {
    switch (code) {
        case "auth/invalid-phone-number":
        case "auth/missing-phone-number":
            return "That phone number doesn't look right. Check the country and the number."
        case "auth/too-many-requests":
            return "Too many attempts. Please wait a few minutes and try again."
        case "auth/quota-exceeded":
            return "We can't send codes right now. Please try again later, or sign in another way."
        case "auth/network-request-failed":
            return "No connection. Check your internet and try again."
        // The reCAPTCHA check failed: an expired or refused token, or a site
        // that is not on Firebase's authorized domains.
        case "auth/invalid-app-credential":
        case "auth/captcha-check-failed":
        case "auth/unauthorized-domain":
            return "We couldn't confirm you're not a robot. Refresh the page and try again, or sign in another way."
        default:
            return "We couldn't send your code. Please try again."
    }
}
