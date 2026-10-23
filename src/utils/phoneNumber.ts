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
