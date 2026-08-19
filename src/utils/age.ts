import { Timestamp } from "firebase/firestore";

/**
 * Every existing age display computed `currentYear - birthYear`, which shows
 * a year-too-old age for anyone whose birthday hasn't happened yet this year
 * (mobile's `DateTimeExtensions.age` already gets this right — this ports
 * that month/day-aware logic to web, C3).
 */
export function calculateAge(
	dob: Timestamp | Date | string | undefined | null,
	now: Date = new Date()
): number | null {
	if (!dob) return null;

	let birthDate: Date;
	if (dob instanceof Timestamp) {
		birthDate = dob.toDate();
	} else if (dob instanceof Date) {
		birthDate = dob;
	} else if (typeof dob === "string") {
		birthDate = new Date(dob);
	} else {
		return null;
	}
	if (Number.isNaN(birthDate.getTime())) return null;

	let age = now.getFullYear() - birthDate.getFullYear();
	const hasHadBirthdayThisYear =
		now.getMonth() > birthDate.getMonth() ||
		(now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
	if (!hasHadBirthdayThisYear) age -= 1;

	return age;
}
