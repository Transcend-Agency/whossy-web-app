import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Paystack {
    reference: string | null;
    setReference: (reference: string) => void;
    reset: () => void;
}

const initialState = {
    reference: null,
};

export const usePaystackStore = create<
    Paystack,
    [["zustand/persist", Paystack]]
>(
    persist(
        (set) => ({
            ...initialState,
            setReference: ( reference ) => set( { reference } ),
            reset: () => set(initialState),
        }),
        {
            name: "paystack",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

