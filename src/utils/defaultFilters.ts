import { UserFilters } from "@/types/user";

/**
 * The saved search a new account starts with. The mobile app writes the same
 * document at the end of onboarding (preference_repository.dart), so both apps
 * show and use the same distance and age range from day one.
 */
export const buildDefaultFilters = (
	meet?: number | null,
	distance?: number | null
): UserFilters => ({
	meet: meet ?? 2,
	distance: distance ?? 50,
	outreach: true,
	has_bio: false,
	age_range: { min: 20, max: 40 },
	similar_interest: false,
});
