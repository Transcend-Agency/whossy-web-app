import { Timestamp } from "firebase/firestore";
import { calculateAge } from "./age";

export const MINIMUM_AGE = 18;
export const MAXIMUM_AGE = 100;

interface BirthDateParts {
	year: string;
	month: string;
	day: string;
}

/**
 * Why this birth date cannot be used, or null when it can. An unfinished
 * entry also returns a message, so callers decide when it is worth showing.
 *
 * The age comes from the whole date: comparing years alone let through
 * someone who turns 18 later this year.
 */
export function birthDateError(
	{ year, month, day }: BirthDateParts,
	now: Date = new Date()
): string | null {
	if (![year, month, day].every((part) => /^\d+$/.test(part))) {
		return "Enter your full date of birth";
	}

	const y = Number(year);
	const m = Number(month);
	const d = Number(day);

	if (y < now.getFullYear() - MAXIMUM_AGE || y > now.getFullYear()) {
		return "Enter a valid birth year";
	}

	// Date rolls 31 February over to March, which would save a different
	// birth date than the one typed.
	const date = new Date(y, m - 1, d);
	if (
		date.getFullYear() !== y ||
		date.getMonth() !== m - 1 ||
		date.getDate() !== d
	) {
		return "That date does not exist";
	}

	const age = calculateAge(date, now);
	if (age === null || age < MINIMUM_AGE) {
		return `You must be ${MINIMUM_AGE} or older to use Whossy`;
	}

	return null;
}

/**
 * The stored birth date as a Date, or null when there is none or it cannot
 * be read. The onboarding store is saved to localStorage as JSON, so a Date
 * put in comes back as an ISO string after a page reload.
 */
export function toBirthDate(
	value: Timestamp | Date | string | null | undefined
): Date | null {
	if (!value) return null;

	const date = value instanceof Timestamp ? value.toDate() : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}
