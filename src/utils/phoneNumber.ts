import { isPossiblePhoneNumber, parsePhoneNumber } from "react-phone-number-input"

/**
 * The phone field opens on +1 (US). Someone who types a number that already
 * begins with its dial code, such as 2348148836800, ends up with
 * +12348148836800: too long to be a US number and not valid as typed. When the
 * digits after the +1 are more than a US number can hold and they form a valid
 * number of their own, read them as the international number.
 */
export function withTypedDialCode(value: string | undefined): string | undefined {
    if (!value || !value.startsWith("+1")) return value

    const rest = value.slice(2).replace(/\D/g, "")
    if (rest.length <= 10) return value

    const candidate = `+${rest}`
    if (!isPossiblePhoneNumber(candidate)) return value

    return parsePhoneNumber(candidate)?.number ?? value
}
