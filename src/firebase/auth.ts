import { signInWithPopup, UserCredential } from "firebase/auth";
import { auth, facebookProvider, googleProvider } from ".";

export const signInWithGoogle = (callbackFn: (res: UserCredential) => void) => {
    signInWithPopup(auth, googleProvider).then(callbackFn);
};

export const signInWithFacebook = (callbackFn: (res: UserCredential) => void) => {
    signInWithPopup(auth, facebookProvider).then(callbackFn);
};