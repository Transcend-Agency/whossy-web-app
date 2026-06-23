import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface PictureData {
  imageOne?: File;
  imageTwo?: File;
  imageThree?: File;
  imageFour?: File;
  imageFive?: File;
  imageSix?: File;
}

interface Picture {
  pictures: PictureData;
  setPictures: (s: Partial<PictureData>) => void;
  reset: () => void;
}

const initialState = {
  pictures: {
    imageOne: undefined,
    imageTwo: undefined,
    imageThree: undefined,
    imageFour: undefined,
    imageFive: undefined,
    imageSix: undefined,
  },
};

export const usePictureStore = create<
  Picture,
  [["zustand/persist", Picture]]
>(
  persist(
    (set) => ({
        ...initialState,
        setPictures: (s) =>
        set((state) => ({pictures: {...state.pictures, ...s}})),
      reset: () => set(initialState),
    }),
    {
      name: "pictures-data",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

