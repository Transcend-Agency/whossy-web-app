import { Timestamp } from "firebase/firestore";
import { calculateAge } from "@/utils/age";
import { MAXIMUM_AGE, MINIMUM_AGE } from "@/utils/birthDate";

/**
 * The age filter, stored in filters/{uid} and shared with the mobile app:
 *
 *  - `age_range` set   -> the filter is on: only people in it are shown when
 *    swiping and in Advanced Search. Null or missing -> off, which is also
 *    how older app versions read it.
 *  - `saved_age_range` -> the last range chosen, kept while the filter is
 *    off so switching it on again restores it. "In my age range" in Explore
 *    uses it too, so that filter works even while the age filter is off.
 *
 * The slider's ends are the sign-up age limits, since nobody on Whossy can be
 * younger or older.
 */
export interface AgeRange {
	min: number;
	max: number;
}

export interface AgeFilterFields {
	age_range?: AgeRange | null;
	saved_age_range?: AgeRange | null;
}

export const AGE_SLIDER_MIN = MINIMUM_AGE;
export const AGE_SLIDER_MAX = MAXIMUM_AGE;
/** When the filter is first switched on, the range starts this many years either side of your own age. */
export const STARTING_AGE_SPREAD = 5;

const clampAge = (age: number) => Math.min(AGE_SLIDER_MAX, Math.max(AGE_SLIDER_MIN, age));

const isRange = (value: unknown): value is AgeRange =>
	!!value &&
	typeof (value as AgeRange).min === "number" &&
	typeof (value as AgeRange).max === "number";

/** The range the age filter applies, or null when it's off. */
export function activeAgeRange(filters?: AgeFilterFields | null): AgeRange | null {
	return isRange(filters?.age_range) ? filters!.age_range! : null;
}

/** The range "In my age range" uses: the active one, or the last one chosen. */
export function myAgeRange(filters?: AgeFilterFields | null): AgeRange | null {
	return activeAgeRange(filters) ?? (isRange(filters?.saved_age_range) ? filters!.saved_age_range! : null);
}

/** Where the range starts the first time someone switches the filter on. */
export function startingAgeRange(dateOfBirth: Timestamp | Date | string | null | undefined, now: Date = new Date()): AgeRange {
	const age = calculateAge(dateOfBirth, now);
	if (age == null) return { min: AGE_SLIDER_MIN, max: AGE_SLIDER_MAX };
	return { min: clampAge(age - STARTING_AGE_SPREAD), max: clampAge(age + STARTING_AGE_SPREAD) };
}

/** The fields to write to filters/{uid} to switch the filter on or off. */
export function ageFilterSwitchUpdate(
	on: boolean,
	filters: AgeFilterFields | null | undefined,
	startingRange: AgeRange
): Required<AgeFilterFields> {
	const active = activeAgeRange(filters);
	const saved = isRange(filters?.saved_age_range) ? filters!.saved_age_range! : null;
	if (on) {
		const range = saved ?? startingRange;
		return { age_range: { ...range }, saved_age_range: { ...range } };
	}
	return { age_range: null, saved_age_range: active ?? saved };
}

/** Birth date of someone turning `age` on `now`. */
const turnsAgeOn = (now: Date, age: number) => new Date(now.getFullYear() - age, now.getMonth(), now.getDate());

/**
 * Birth dates that fall in `range`, for a date_of_birth query: born on or
 * before `bornOnOrBefore` (old enough) and after `bornAfter` (not too old).
 * The upper bound is the day people turning max + 1 today were born, so
 * someone who is 30 and a half still counts for a maximum of 30.
 */
export function birthDateBounds(range: AgeRange, now: Date = new Date()): { bornOnOrBefore: Date; bornAfter: Date } {
	return { bornOnOrBefore: turnsAgeOn(now, range.min), bornAfter: turnsAgeOn(now, range.max + 1) };
}

/** Whether a date_of_birth value is in `range`. No date of birth never matches. */
export function isInAgeRange(dateOfBirth: unknown, range: AgeRange, now: Date = new Date()): boolean {
	const date =
		dateOfBirth instanceof Timestamp ? dateOfBirth.toDate() : dateOfBirth instanceof Date ? dateOfBirth : null;
	if (!date) return false;
	const { bornOnOrBefore, bornAfter } = birthDateBounds(range, now);
	return date.getTime() <= bornOnOrBefore.getTime() && date.getTime() > bornAfter.getTime();
}
