import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBU4cMr2NP_De8QI-dhZ_B6BkUnwTv0IL8",
  authDomain: "stayflow-dev.firebaseapp.com",
  projectId: "stayflow-dev",
  storageBucket: "stayflow-dev.firebasestorage.app",
  messagingSenderId: "586103326254",
  appId: "1:586103326254:web:019f9b9d9ca3a3602d01bf",
  measurementId: "G-L10PEL439W"
};

// Check if Firebase keys are actually set
export const isFirebaseConfigured = true;

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
