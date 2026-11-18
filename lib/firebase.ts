import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// These values are safe to expose in client-side code (Firebase design)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  authDomain: "esoteric-lodge-448619-b7.firebaseapp.com",
  projectId: "esoteric-lodge-448619-b7",
  storageBucket: "esoteric-lodge-448619-b7.firebasestorage.app",
  messagingSenderId: "5633316996",
  appId: "1:5633316996:web:a080d55d74ff1e6be88ad1",
};

/** Google sign-in only works when a Firebase web API key is configured. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

/**
 * Firebase is initialised lazily so pages still build and render when
 * NEXT_PUBLIC_GOOGLE_API_KEY is missing (local dev, CI). Email/password login
 * keeps working in that case; Google sign-in reports a configuration message.
 */
export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured) return null;

  if (!cachedAuth) {
    cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    cachedAuth = getAuth(cachedApp);
  }

  return cachedAuth;
}

export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // Only allow the authorized admin email
  provider.setCustomParameters({
    prompt: "select_account",
  });
  return provider;
}
