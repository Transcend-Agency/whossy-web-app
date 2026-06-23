import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface PictureData {
  imageOne: string | null;
  imageTwo: string | null;
  imageThree: string | null;
  imageFour: string | null;
  imageFive: string | null;
  imageSix: string | null;
}

interface Picture {
  photos: PictureData;
  setPhotos: (s: Partial<PictureData>) => void;
  reset: () => void;
}

const initialState = {
  photos: {
    imageOne: null,
    imageTwo: null,
    imageThree: null,
    imageFour: null,
    imageFive: null,
    imageSix: null,
  },
};

export const usePhotoStore = create<
  Picture,
  [["zustand/persist", Picture]]
>(
  persist(
    (set) => ({
        ...initialState,
        setPhotos: (s) =>
        set((state) => ({photos: {...state.photos, ...s}})),
      reset: () => set(initialState),
    }),
    {
      name: "photos-data",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

