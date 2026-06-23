import { create } from 'zustand';

type AccountSetupFormStore = {
    userData: {
        id: string;
        uid: string;
        first_name: string;
        last_name: string;
        phone_number: string;
        country_of_origin: string;
        gender: string;
        auth_provider: string;
        email: string;
    };
    updateUserData: (data: Partial<AccountSetupFormStore['userData']>) => void
    setNames: (names: { first_name: string; last_name: string }) => void;
    getAccountSetupData: () => { last_name: string; first_name: string; country_of_origin: string; phone_number: string; };
    setCountryAndPhoneData: (data: { country_of_origin: string; phone_number: string }) => void;
    setGender: (gender: string) => void;
    setUserId: (uid: string) => void;
    setId: (id: string) => void;
    setAuthProvider: (auth_provider: string) => void;
    setEmail: (auth_provider: string) => void
};

const useAccountSetupFormStore = create<AccountSetupFormStore>((set, get) => ({
    userData: {
        id: '',
        uid: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        country_of_origin: '',
        gender: '',
        auth_provider: '',
        email: ''
    },
    updateUserData: (data: Partial<AccountSetupFormStore['userData']>) => set(() => ({ userData: { ...get().userData, ...data } })),
    getAccountSetupData: () => {
        const userData = get().userData
        return {
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone_number: userData.phone_number,
            country_of_origin: userData.country_of_origin,
            gender: userData.gender
        }
    },
    setId: (id: string) => set((state) => ({ userData: { ...state.userData, id } })),
    setUserId: (uid: string) => set((state) => ({ userData: { ...state.userData, uid } })),
    setNames: (names) => set((state) => ({ userData: { ...state.userData, ...names } })),
    setCountryAndPhoneData: (data) => set((state) => ({ userData: { ...state.userData, ...data } })),
    setGender: (gender: string) => set((state) => ({ userData: { ...state.userData, gender } })),
    setAuthProvider: (auth_provider: string) => set((state) => ({ userData: { ...state.userData, auth_provider } })),
    setEmail: (email: string) => set((state) => ({ userData: { ...state.userData, email } })),
}));

export default useAccountSetupFormStore;