import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { FacebookAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";

// Local development against the Firebase emulators (`npm run dev` with
// VITE_USE_EMULATORS=true and `firebase emulators:start --project
// demo-whossy`). The demo project id is what guarantees nothing here can
// reach the real project, so it is swapped in rather than only redirecting
// each service. Never active in a production build.
const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "true";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "whossy-app.firebaseapp.com",
  projectId: useEmulators ? "demo-whossy" : "whossy-app",
  storageBucket: useEmulators ? "demo-whossy.appspot.com" : "whossy-app.appspot.com",
  messagingSenderId: "332139466657",
  appId: "1:332139466657:web:26e95148b069f63f2d05e0",
  measurementId: "G-QQ1B249HVJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase()
const functions = getFunctions(app);

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectDatabaseEmulator(realtimeDb, "127.0.0.1", 9000);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectStorageEmulator(getStorage(app), "127.0.0.1", 9199);
}

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export {auth, db, googleProvider, facebookProvider, realtimeDb, functions }