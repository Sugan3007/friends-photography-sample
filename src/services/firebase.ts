import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyPlaceholderKeyForBuildSafety',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sample.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://sample.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sample-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sample.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:000000000000',
};

// Prevent duplicate app initialization on HMR reloads
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(
  app,
  firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined
);
export const auth = getAuth(app);

// Attempt anonymous sign-in if enabled in Firebase console (allows auth-required rules to pass)
signInAnonymously(auth).catch((err) => {
  console.info('Firebase auth initialization note:', err?.code || err?.message || err);
});

export default app;

