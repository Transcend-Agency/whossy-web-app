import { create } from 'zustand';
import {AdvancedSearchPreferences, User} from '@/types/user.ts';
import { filterOptions } from '@/constants';
import {PopulatedLikeData, PopulatedLikedByData} from "@/types/likingAndMatching.ts";

interface DashboardState {
	profiles: User[];
	setProfiles: (profiles: User[]) => void;
	selectedProfile: string | null | undefined;
	setSelectedProfile: (uid: string | null | undefined) => void;
	blockedUsers: string[];
	setBlockedUsers: (blockedUsers: string[]) => void;
	selectedOption: string;
	setSelectedOption: (option: string) => void;
	exploreDataLoading: boolean;
	setExploreDataLoading: (exploreDataLoading: boolean) => void;
	peopleWhoLiked: PopulatedLikeData[]
	setPeopleWhoLiked: (likes: PopulatedLikeData[]) => void;
	peopleYouLiked: PopulatedLikedByData[];
	setPeopleYouLiked: (likedByData: PopulatedLikedByData[]) => void;
	previousLocation: string | null;
	currentLocation: string;
	setLocation: (newLocation: string) => void;
	advancedSearchPreferences: AdvancedSearchPreferences;
	setAdvancedSearchPreferences: (preferences: AdvancedSearchPreferences) => void;
	totalCurrentStep: number;
	setTotalCurrentStep: (totalCurrentStep: number) => void;
	tourIsOpen: boolean;
	setTourIsOpen: (tourIsOpen: boolean) => void;
}

const useDashboardStore = create<DashboardState>((set) => ({
	profiles: [],
	setProfiles: (profiles) => set({ profiles }),

	selectedProfile: null,
	setSelectedProfile: (uid) => set({ selectedProfile: uid }),

	blockedUsers: [],
	setBlockedUsers: (blockedUsers) => set({ blockedUsers }),

	selectedOption: filterOptions[0],
	setSelectedOption: (option) => set({ selectedOption: option }),

	exploreDataLoading: true,
	setExploreDataLoading: (exploreDataLoading) => set({ exploreDataLoading }),

	peopleWhoLiked: [],
	setPeopleWhoLiked: (likes) => set({ peopleWhoLiked: likes }),

	peopleYouLiked: [],
	setPeopleYouLiked: (likedByData) => set({ peopleYouLiked: likedByData }),

	previousLocation: null,
	currentLocation: window.location.pathname,
	setLocation: (newLocation) =>
		set((state) => ({
			previousLocation: state.currentLocation,
			currentLocation: newLocation,
		})),

	advancedSearchPreferences: {
		gender: '',
		age_range: { min: 18, max: 100 },
		country: '',
		relationship_preference: null,
		religion: null
	},
	setAdvancedSearchPreferences: (preferences) => set({ advancedSearchPreferences: preferences }),

		totalCurrentStep: 0,
		setTotalCurrentStep: (totalCurrentStep) => set({ totalCurrentStep: totalCurrentStep }),

		tourIsOpen: false,
		setTourIsOpen: (tourIsOpen) => set({ tourIsOpen: tourIsOpen }),

}));

export default useDashboardStore;
