import { Timestamp } from "firebase/firestore";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface OnboardingData {
  "relationship-preference"?: number | null;
  "gender-preference"?: number | null;
  "date-of-birth"?: Timestamp | Date | null | string;
  "distance-search"?: number;
  interests?: string[];
  education?: number | null;
  "drinking-preference"?: number | null;
  "smoking-preference"?: number | null;
  pets?: null | number;
  "workout-preference"?: number | null;
  "short-introduction"?: string;
  photos?: string[];
}

interface Onboarding {
  "onboarding-data": OnboardingData;
  updateOnboardingData: (s: OnboardingData) => void;
  addInterests: (s: string) => void;
  removeInterests: (s: string) => void;
  addPhotos: (s: string) => void;
  reset: () => void;
}

const initialState = {
  "onboarding-data": {
    "relationship-preference": null,
    "gender-preference": null,
    "date-of-birth": null,
    "distance-search": 50,
    interests: [],
    education: null,
    "drinking-preference": null,
    "smoking-preference": null,
    pets: null,
    "workout-preference": null,
    "short-introduction": "",
    photos: [],
  },
};

export const useOnboardingStore = create<
  Onboarding,
  [["zustand/persist", Onboarding]]>(
  persist(
    (set) => ({
      ...initialState,
      addInterests: (interest) =>
        set((state) => ({
          "onboarding-data": {
            ...state["onboarding-data"],
            interests: [
              ...(state["onboarding-data"].interests || []),
              interest,
            ],
          },
        })),
      removeInterests: (interest) =>
        set((state) => ({
          "onboarding-data": {
            ...state["onboarding-data"],
            interests: state["onboarding-data"].interests?.filter(
              (item) => item !== interest
            ),
          },
        })),
      addPhotos: (photos) =>
        set((state) => ({
          "onboarding-data": {
            ...state["onboarding-data"],
            photos: [...(state["onboarding-data"].photos || []), photos],
          },
        })),
      updateOnboardingData: (data) =>
        set((state) => ({
          "onboarding-data": { ...state["onboarding-data"], ...data },
        })),
      reset: () => set(initialState),
    }),
    {
      name: "onboarding-data",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
