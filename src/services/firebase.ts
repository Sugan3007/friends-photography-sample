import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

const getEnv = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {
    // ignore
  }
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {
    // ignore
  }
  return '';
};

export const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || 'AIzaSyBVTtmHmZoQ0psKC5gC3Z99D-vCAdNu7Ro',
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'infovate-41eeb.firebaseapp.com',
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL') || 'https://infovate-41eeb-default-rtdb.firebaseio.com',
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || 'infovate-41eeb',
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'infovate-41eeb.firebasestorage.app',
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '687057728339',
  appId: getEnv('VITE_FIREBASE_APP_ID') || '1:687057728339:web:031b874ae916612c2827a6',
};

// Prevent duplicate app initialization on HMR reloads
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Attempt anonymous sign-in if enabled in Firebase console (allows auth-required rules to pass)
signInAnonymously(auth).catch((err) => {
  console.info('Firebase auth initialization note:', err?.code || err?.message || err);
});

export default app;

