import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Official SVM1 Firebase project defaults
const DEFAULT_AUTH_DOMAIN = 'svm1-322e3.firebaseapp.com';
const DEFAULT_PROJECT_ID = 'svm1-322e3';
const DEFAULT_STORAGE_BUCKET = 'svm1-322e3.firebasestorage.app';
const DEFAULT_MESSAGING_SENDER_ID = '835790991293';
const DEFAULT_APP_ID = '1:835790991293:web:2a2f06d5412c7be3216cd4';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';

const config = {
  apiKey: rawApiKey.trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_AUTH_DOMAIN).trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID).trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET).trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_MESSAGING_SENDER_ID).trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_APP_ID).trim()
};

// Check if API key is provided and looks like a valid Google/Firebase browser key
export const isApiKeyProvided = Boolean(config.apiKey && config.apiKey.length > 10);
export const isGeminiKeyMistake = Boolean(config.apiKey && config.apiKey.startsWith('AQ.'));

export const firebaseConfigured = Boolean(
  isApiKeyProvided &&
  config.authDomain &&
  config.projectId &&
  config.appId
);

export function getFirebaseConfigDiagnostic() {
  if (!config.apiKey) {
    return {
      ok: false,
      code: 'API_KEY_MISSING',
      message: 'VITE_FIREBASE_API_KEY is not set in .env. Running in Campus Demo Mode.'
    };
  }
  if (isGeminiKeyMistake) {
    return {
      ok: false,
      code: 'GEMINI_KEY_INSTEAD_OF_FIREBASE_KEY',
      message: 'The API key in .env begins with "AQ.", which is a Google AI Studio / Gemini key. Firebase Authentication requires the Web API Key from Firebase Console (begins with "AIzaSy...").'
    };
  }
  return { ok: true, code: 'CONFIGURED', message: 'Firebase configuration loaded.' };
}

// Initialize Firebase App
export const firebaseApp = firebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(config))
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;
export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;

/**
 * Genuine connectivity and readiness tester.
 * Does not return true unless actual connectivity or initialization is validated.
 */
export async function testFirebaseConnection() {
  const diagnostic = getFirebaseConfigDiagnostic();
  if (!diagnostic.ok) {
    return {
      connected: false,
      authReady: false,
      firestoreReady: false,
      mode: 'demo',
      message: diagnostic.message,
      code: diagnostic.code
    };
  }

  const result = {
    connected: false,
    authReady: false,
    firestoreReady: false,
    mode: 'cloud',
    message: '',
    code: 'OK'
  };

  // Auth readiness
  if (firebaseAuth) {
    result.authReady = true;
  }

  // Firestore connectivity check via lightweight probe
  if (firestore) {
    try {
      const probeQuery = query(collection(firestore, 'announcements'), limit(1));
      await getDocs(probeQuery);
      result.firestoreReady = true;
      result.connected = true;
      result.message = 'Live Cloud Sync connected (SVM1 · svm1-322e3)';
    } catch (err) {
      result.firestoreReady = false;
      result.connected = false;
      if (err.code === 'permission-denied') {
        result.message = 'Firestore reached (permission-denied for public unauthenticated read; sign in required)';
        result.connected = true; // Connection was established, security rules enforced
      } else {
        result.message = `Firestore: ${err.message || 'connection failed'}`;
        result.code = err.code || 'FIRESTORE_ERROR';
      }
    }
  }

  return result;
}
