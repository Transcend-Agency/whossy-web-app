import { ConfirmationResult } from 'firebase/auth';
import {create} from 'zustand';

type PhoneNumberStore = {
    phone_number: string;
    verification_id: string;
    confirmationResult: ConfirmationResult | Record<string, never>;
    setPhoneNumber: (phone_number: string) => void;
    setVerificationId: (verification_id: string) => void;
    setConfirmationResult: (confirmationResult: ConfirmationResult) => void;
};

const usePhoneNumberStore = create<PhoneNumberStore>((set) => ({
    phone_number: '',
    verification_id: '',
    confirmationResult: {},
    setConfirmationResult: (confirmationResult: ConfirmationResult) => set(() => ({confirmationResult})),
    setPhoneNumber: (phone_number: string) => set(() => ({ phone_number })),
    setVerificationId: (verification_id: string) => set(() => ({verification_id}))
}));

export default usePhoneNumberStore;