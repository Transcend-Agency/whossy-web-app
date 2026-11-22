import { UserFilters } from "@/types/user";

/**
 * The saved search a new account starts with. The mobile app writes the same
 * document at the end of onboarding (preference_repository.dart), so both apps
 * show and use the same distance from day one.
 *
 * There's no age_range: the age filter starts off. It used to start at 20-40,
 * which hid everyone else without the person ever choosing it.
 */
export const buildDefaultFilters = (
	meet?: number | null,
	distance?: number | null
): UserFilters => ({
	meet: meet ?? 2,
	distance: distance ?? 50,
	outreach: true,
	has_bio: false,
	similar_interest: false,
});
