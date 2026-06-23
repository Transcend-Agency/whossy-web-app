import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthResponse {
    businessId: string;
    access_token: string;
    refresh_token: string;
    expiresAt: string;
}

interface Nomba {
    auth_response: { code: number, data: AuthResponse } | null;
    setAuthResponse: ( auth_response: { code: number, data: AuthResponse } ) => void;
    reset: () => void;
}

const initialState = {
    auth_response: null,
};

export const useNombaStore = create<
    Nomba,
    [["zustand/persist", Nomba]]
>(
    persist(
        (set) => ({
            ...initialState,
            setAuthResponse: ( auth_response ) => set( { auth_response } ),
            reset: () => set(initialState),
        }),
        {
            name: "nomba",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

