import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseAuth, firestore, firebaseConfigured } from './firebase.js';

function requireAuth() {
  if (!firebaseConfigured || !firebaseAuth || !firestore) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* variables before using authentication.');
  }
}

async function ensureUserDocument(user, profile = {}) {
  const now = serverTimestamp();
  await setDoc(doc(firestore, 'users', user.uid), {
    uid: user.uid,
    email: user.email || '',
    displayName: profile.displayName || user.displayName || '',
    photoURL: user.photoURL || '',
    department: profile.department || '',
    academicYear: profile.academicYear || '',
    profileVisibility: 'campus',
    createdAt: now,
    updatedAt: now
  }, { merge: true });
}

export function subscribeToAuth(callback) {
  if (!firebaseConfigured || !firebaseAuth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(firebaseAuth, callback);
}

export async function signIn(email, password) {
  requireAuth();
  await setPersistence(firebaseAuth, browserLocalPersistence);
  const result = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  await ensureUserDocument(result.user);
  return result.user;
}

export async function register({ email, password, displayName, department, academicYear }) {
  requireAuth();
  await setPersistence(firebaseAuth, browserLocalPersistence);
  const result = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  await updateProfile(result.user, { displayName: displayName.trim() });
  await ensureUserDocument(result.user, { displayName, department, academicYear });
  return result.user;
}

export async function signInWithGoogle() {
  requireAuth();
  await setPersistence(firebaseAuth, browserLocalPersistence);
  const result = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  await ensureUserDocument(result.user);
  return result.user;
}

export async function resetPassword(email) {
  requireAuth();
  await sendPasswordResetEmail(firebaseAuth, email.trim());
}

export async function signOut() {
  requireAuth();
  await firebaseSignOut(firebaseAuth);
}
