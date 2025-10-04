import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAjV2HebLZMPXF1Fm7m536pLWnm79rGfGY",
  authDomain: "finanzas-familiares-fa7c5.firebaseapp.com",
  projectId: "finanzas-familiares-fa7c5",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const signIn = async () => {
    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error("Error signing in anonymously:", error);
        throw error;
    }
};

export { app, auth, db, signIn };
