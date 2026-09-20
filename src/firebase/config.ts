import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, collection, doc, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

export const appId = env.VITE_APP_ID || 'biocom-institute-app';

// Validate if Firebase credentials have been configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_api_key_here'
);

export function getMissingFirebaseKeys(): string[] {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_api_key_here') missing.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missing.push('VITE_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.appId) missing.push('VITE_FIREBASE_APP_ID');
  return missing;
}

// Safely initialize Firebase app only if config is provided
let appInstance: ReturnType<typeof initializeApp> | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export const googleProvider = new GoogleAuthProvider();

// Standardized collection helpers
export const getAssignmentsRef = (firestore: Firestore) =>
  collection(firestore, 'artifacts', appId, 'public', 'data', 'assignments');

export const getStudentsRef = (firestore: Firestore) =>
  collection(firestore, 'artifacts', appId, 'public', 'data', 'students');

export const getStudentDocRef = (firestore: Firestore, uid: string) =>
  doc(firestore, 'artifacts', appId, 'public', 'data', 'students', uid);

export const getAssignmentDocRef = (firestore: Firestore, assignmentId: string) =>
  doc(firestore, 'artifacts', appId, 'public', 'data', 'assignments', assignmentId);
