import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// These values are safe to expose in client-side code (Firebase design)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  authDomain: "esoteric-lodge-448619-b7.firebaseapp.com",
  projectId: "esoteric-lodge-448619-b7",
  storageBucket: "esoteric-lodge-448619-b7.firebasestorage.app",
  messagingSenderId: "5633316996",
  appId: "1:5633316996:web:a080d55d74ff1e6be88ad1",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Only allow the authorized admin email
googleProvider.setCustomParameters({
  prompt: "select_account",
});
