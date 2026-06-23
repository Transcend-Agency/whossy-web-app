import { User } from "@/types/user";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {useEffect} from "react";
import {useNavigate} from "react-router-dom";

type AuthType = { uid: string, has_completed_onboarding: boolean };

interface Picture {
    auth: AuthType | null;
    setAuth: (auth: AuthType, user?: User) => void;
    setUser: (user: User) => void;
    updateUser: (userUpdate: Partial<User>) => void;
    logout: () => void;
    user?: User;
    reset: () => void;
}

const initialState = {
    auth: null,
};

const FIVE_HOURS_IN_MS = 5 * 60 * 60 * 1000;

export const useAuthStore = create<
    Picture,
    [["zustand/persist", Picture]]
>(
    persist(
        (set) => ({
            ...initialState,
            setAuth: (auth, user) => {
                const loginTime = new Date().getTime();
                localStorage.setItem("loginTimestamp", loginTime.toString());
                set(() => ({ auth, user })) },
            logout: () => {
                localStorage.removeItem("loginTimestamp");
                set(initialState);
            },
            reset: () => set(initialState),
            setUser: (user) => set((state) => ({ ...state, user })),
            updateUser: (userUpdate: Partial<User>) => set((state) => ({ ...state, userUpdate: { ...state.user, ...userUpdate } }))
        }),
        {
            name: "user_id",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

const useAutoLogout = () => {
    const { logout, auth } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const checkSessionTimeout = () => {
            const loginTimestamp = localStorage.getItem("loginTimestamp");
            const now = new Date().getTime();

            if (loginTimestamp && now - parseInt(loginTimestamp) > FIVE_HOURS_IN_MS) {
                logout();
                navigate("/auth");
                console.log("Logging out: User Session Timeout")
            }
        };
        checkSessionTimeout();
        const intervalId = setInterval(checkSessionTimeout, 60000);

        return () => clearInterval(intervalId);
    }, [auth, logout, navigate]);
};

export default useAutoLogout;
