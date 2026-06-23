import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Picture {
  picture: string[];
  addPicture: (file: string) => void;
  reset: () => void;
}

const initialState = {
  picture: [],
};

export const useStorePictureFiles = create<
  Picture,
  [["zustand/persist", Picture]]
>(
  persist(
    (set) => ({
        ...initialState,
        addPicture: (file) => set((state) => ({picture: [...state.picture, file]})),
        reset: () => set(initialState),
    }),
    {
      name: "pictures",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

