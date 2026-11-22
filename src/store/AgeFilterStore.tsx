import { create } from "zustand";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { fetchUserFilters } from "@/utils/searchRadius";
import { AgeFilterFields, AgeRange, ageFilterSwitchUpdate } from "@/utils/ageFilter";

/**
 * The age filter, shared by Preferences and Explore's Advanced Search so
 * both show and change the same setting (filters/{uid}, the same document
 * the mobile app uses). Writes are optimistic and put the old value back if
 * they fail.
 */
interface AgeFilterState extends Required<AgeFilterFields> {
	uid: string | null;
	loaded: boolean;
	load: (uid: string) => Promise<void>;
	setEnabled: (uid: string, on: boolean, startingRange: AgeRange) => Promise<void>;
	setRange: (uid: string, range: AgeRange) => Promise<void>;
	reset: () => void;
}

const initial = { uid: null, loaded: false, age_range: null, saved_age_range: null };

const useAgeFilterStore = create<AgeFilterState>((set, get) => {
	const save = async (uid: string, fields: Required<AgeFilterFields>) => {
		const before = { age_range: get().age_range, saved_age_range: get().saved_age_range };
		set(fields);
		try {
			// merge: accounts made before filters/{uid} existed have no document yet.
			await setDoc(doc(db, "filters", uid), fields, { merge: true });
		} catch (error) {
			set(before);
			throw error;
		}
	};

	return {
		...initial,
		load: async (uid) => {
			// Never show one account's setting to another while loading.
			if (get().uid !== uid) set({ ...initial, uid });
			const filters = await fetchUserFilters(uid);
			if (get().uid !== uid) return;
			set({
				loaded: true,
				age_range: filters?.age_range ?? null,
				saved_age_range: filters?.saved_age_range ?? null,
			});
		},
		setEnabled: (uid, on, startingRange) => save(uid, ageFilterSwitchUpdate(on, get(), startingRange)),
		setRange: (uid, range) => save(uid, { age_range: { ...range }, saved_age_range: { ...range } }),
		reset: () => set(initial),
	};
});

export default useAgeFilterStore;
