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
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';
import {
  firebaseAuth,
  firestore,
  firebaseConfigured,
  getFirebaseConfigDiagnostic
} from './firebase.js';

// Local storage key for demo accounts when operating in offline/demo mode
const LOCAL_USERS_KEY = 'svm_demo_users';
const LOCAL_SESSION_KEY = 'svm_active_session';

function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch { /* ignore */ }
}

/**
 * Translates Firebase auth errors into actionable, clear instructions for students & admins.
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  if (
    code === 'auth/api-key-is-not-supported-by-this-api' ||
    message.includes('api-key-is-not-supported-by-this-api')
  ) {
    return (
      'Firebase API Key Issue: The current API key in .env was created for Google AI Studio / Gemini, which does not permit Firebase Authentication (Identity Toolkit). ' +
      'To fix: in Firebase Console (project svm1-322e3) > Project Settings > General > Your Apps (svm), copy the Web API Key (starts with "AIzaSy...") into VITE_FIREBASE_API_KEY in .env.'
    );
  }

  if (code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key') {
    return 'Invalid Firebase API Key. Please verify that VITE_FIREBASE_API_KEY in .env matches the Web API Key from Firebase Console (begins with "AIzaSy...").';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password Authentication is not enabled. Go to Firebase Console > Build > Authentication > Sign-in method, and toggle Email/Password to Enabled.';
  }

  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'Incorrect email or password. Please verify your credentials.';
  }

  if (code === 'auth/profile-not-found' || message.includes('profile was not found')) {
    return 'Account authenticated, but your user profile was not found in Firestore under users/{auth.uid}. Please complete student registration or contact the coordinator.';
  }

  if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (code === 'auth/email-already-in-use') {
    return 'An account with this college email is already registered. Please sign in instead.';
  }

  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please choose a password with at least 6 characters.';
  }

  if (code === 'auth/invalid-email') {
    return 'Please enter a valid college email address.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Google Sign-In was cancelled before completion.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase. Add localhost or svm-gray.vercel.app in Firebase Console > Authentication > Settings > Authorized domains.';
  }

  return message || 'Authentication failed. Please try again.';
}

export function subscribeToAuth(callback) {
  if (!firebaseConfigured || !firebaseAuth) {
    // In local demo mode, retrieve from localStorage session
    try {
      const saved = localStorage.getItem(LOCAL_SESSION_KEY);
      callback(saved ? JSON.parse(saved) : null);
    } catch {
      callback(null);
    }
    return () => {};
  }
  return onAuthStateChanged(firebaseAuth, callback);
}

/**
 * Register a new student account.
 * Enforces role: 'student' and approvalStatus: 'pending'.
 */
export async function registerStudent({
  email,
  password,
  fullName,
  department,
  academicYear,
  creativeInterests = []
}) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  if (firebaseConfigured && firebaseAuth && firestore) {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    const credential = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
    const user = credential.user;

    await updateProfile(user, { displayName: cleanName });

    const studentProfile = {
      uid: user.uid,
      id: user.uid,
      email: cleanEmail,
      displayName: cleanName,
      name: cleanName,
      department: department || 'General Engineering',
      academicYear: academicYear || '1st Year',
      creativeInterests: Array.isArray(creativeInterests) ? creativeInterests : [creativeInterests],
      role: 'student',
      approvalStatus: 'pending',
      profileVisibility: 'campus',
      createdAt: serverTimestamp(),
      registeredAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create user document in Firestore
    await setDoc(doc(firestore, 'users', user.uid), studentProfile);

    // Create welcome notification
    try {
      await addDoc(collection(firestore, 'notifications'), {
        userId: user.uid,
        title: 'Registration Received',
        message: 'Your SVM student account has been registered and is pending coordinator review.',
        type: 'status',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch { /* ignore notification errors */ }

    // Log admin activity
    try {
      await addDoc(collection(firestore, 'adminActivityLogs'), {
        action: 'student_registered',
        targetUserId: user.uid,
        targetEmail: cleanEmail,
        targetName: cleanName,
        department: department || '',
        timestamp: serverTimestamp()
      });
    } catch { /* ignore log errors */ }

    return { user, profile: studentProfile, approvalStatus: 'pending' };
  }

  // --- Local Demo Mode Fallback ---
  const demoUsers = getLocalUsers();
  const existing = demoUsers.find((u) => u.email === cleanEmail);
  if (existing) {
    const err = new Error('An account with this email already exists in local demo.');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  const demoUser = {
    uid: `demo-${Date.now()}`,
    id: `demo-${Date.now()}`,
    email: cleanEmail,
    displayName: cleanName,
    name: cleanName,
    department: department || 'Computer Science',
    academicYear: academicYear || '3rd Year',
    creativeInterests: Array.isArray(creativeInterests) ? creativeInterests : [creativeInterests],
    role: 'student',
    approvalStatus: 'pending',
    createdAt: new Date().toISOString()
  };

  demoUsers.push(demoUser);
  saveLocalUsers(demoUsers);
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(demoUser));

  return { user: demoUser, profile: demoUser, approvalStatus: 'pending' };
}

/**
 * Student sign-in with email & password.
 */
export async function signInStudent(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  if (firebaseConfigured && firebaseAuth && firestore) {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    const credential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
    const user = credential.user;

    const snap = await getDoc(doc(firestore, 'users', user.uid));
    const profile = snap.exists() ? snap.data() : null;

    if (!profile) {
      const err = new Error('User profile not found in Firestore under users/{auth.uid}.');
      err.code = 'auth/profile-not-found';
      throw err;
    }

    const resolvedUser = {
      ...profile,
      uid: user.uid,
      id: user.uid,
      email: user.email || cleanEmail
    };

    return {
      user: resolvedUser,
      profile: resolvedUser,
      approvalStatus: profile.approvalStatus || 'pending',
      role: profile.role || 'student'
    };
  }

  // --- Local Demo Mode Fallback ---
  const demoUsers = getLocalUsers();
  let found = demoUsers.find((u) => u.email === cleanEmail);

  if (!found) {
    // Check if it matches preset personas
    const presets = [
      { email: 'ananya.s@svmit.ac.in', name: 'Ananya Sharma', dept: 'Computer Science', year: '3rd Year', role: 'student', approvalStatus: 'approved' },
      { email: 'rohan.d@svmit.ac.in', name: 'Rohan Deshmukh', dept: 'Mechanical Eng.', year: '2nd Year', role: 'student', approvalStatus: 'approved' },
      { email: 'priya.n@svmit.ac.in', name: 'Priya Nayak', dept: 'Electronics & Comm.', year: '4th Year', role: 'student', approvalStatus: 'approved' },
      { email: 'vikram.j@svmit.ac.in', name: 'Vikram Joshi', dept: 'Civil Eng.', year: '1st Year', role: 'student', approvalStatus: 'approved' },
      { email: 'admin@svmit.ac.in', name: 'SVM Faculty Admin', dept: 'Cultural Affairs', year: 'Faculty', role: 'admin', approvalStatus: 'approved' }
    ];
    const match = presets.find((p) => p.email === cleanEmail);
    if (match) {
      found = {
        uid: `demo-${cleanEmail}`,
        id: `demo-${cleanEmail}`,
        email: cleanEmail,
        displayName: match.name,
        name: match.name,
        department: match.dept,
        academicYear: match.year,
        role: match.role,
        approvalStatus: match.approvalStatus
      };
      demoUsers.push(found);
      saveLocalUsers(demoUsers);
    } else {
      // Create new demo student
      found = {
        uid: `demo-${Date.now()}`,
        id: `demo-${Date.now()}`,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        name: cleanEmail.split('@')[0],
        department: 'Engineering',
        academicYear: '1st Year',
        role: 'student',
        approvalStatus: 'approved'
      };
      demoUsers.push(found);
      saveLocalUsers(demoUsers);
    }
  }

  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(found));
  return {
    user: found,
    profile: found,
    approvalStatus: found.approvalStatus || 'approved',
    role: found.role || 'student'
  };
}

/**
 * Administrator sign-in.
 * Validates that users/{uid}.role === 'admin'.
 */
export async function signInAdmin(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  if (firebaseConfigured && firebaseAuth && firestore) {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    const credential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
    const user = credential.user;

    const snap = await getDoc(doc(firestore, 'users', user.uid));
    const profile = snap.exists() ? snap.data() : null;

    if (!profile || profile.role !== 'admin') {
      await firebaseSignOut(firebaseAuth);
      const err = new Error(
        `Access Denied: The account "${cleanEmail}" does not have SVM administrator privileges. ` +
        `To grant admin rights, update the user document in Firestore to have role: "admin".`
      );
      err.code = 'auth/admin-access-denied';
      throw err;
    }

    const resolvedAdmin = {
      ...profile,
      uid: user.uid,
      id: user.uid,
      email: user.email || cleanEmail,
      role: 'admin',
      approvalStatus: profile.approvalStatus || 'approved'
    };
    return {
      user: resolvedAdmin,
      profile: resolvedAdmin,
      role: 'admin',
      approvalStatus: resolvedAdmin.approvalStatus
    };
  }

  // --- Local Demo Mode Admin Fallback ---
  if (cleanEmail === 'admin@svmit.ac.in' || cleanEmail.includes('admin')) {
    const adminUser = {
      uid: 'demo-admin-01',
      id: 'demo-admin-01',
      email: cleanEmail,
      displayName: 'SVM Chief Coordinator',
      name: 'SVM Chief Coordinator',
      department: 'SVM Cultural Council',
      role: 'admin',
      approvalStatus: 'approved'
    };
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(adminUser));
    return { user: adminUser, profile: adminUser };
  }

  const err = new Error('Access Denied: In Demo Mode, use admin@svmit.ac.in for the Administrator Portal.');
  err.code = 'auth/admin-access-denied';
  throw err;
}

export async function signInWithGoogle() {
  if (firebaseConfigured && firebaseAuth && firestore) {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    const user = credential.user;

    const snap = await getDoc(doc(firestore, 'users', user.uid));
    let profile = snap.exists() ? snap.data() : null;

    if (!profile) {
      profile = {
        uid: user.uid,
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Google Student',
        name: user.displayName || 'Google Student',
        photoURL: user.photoURL || '',
        department: 'General Engineering',
        academicYear: '1st Year',
        role: 'student',
        approvalStatus: 'pending',
        createdAt: serverTimestamp(),
        registeredAt: serverTimestamp()
      };
      await setDoc(doc(firestore, 'users', user.uid), profile);
    }

    return { user, profile: { ...profile, id: user.uid }, approvalStatus: profile.approvalStatus || 'pending' };
  }

  // Demo fallback
  const demoGoogle = {
    uid: 'demo-google-user',
    id: 'demo-google-user',
    email: 'google.student@svmit.ac.in',
    displayName: 'SVM Google Student',
    name: 'SVM Google Student',
    department: 'Computer Science',
    academicYear: '3rd Year',
    role: 'student',
    approvalStatus: 'approved'
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(demoGoogle));
  return { user: demoGoogle, profile: demoGoogle, approvalStatus: 'approved' };
}

export async function resetPassword(email) {
  if (firebaseConfigured && firebaseAuth) {
    await sendPasswordResetEmail(firebaseAuth, email.trim());
    return;
  }
  // Demo mode message
  return true;
}

export async function signOut() {
  if (firebaseConfigured && firebaseAuth) {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch { /* ignore */ }
  }
  localStorage.removeItem(LOCAL_SESSION_KEY);
  localStorage.removeItem('cultureloop-user');
  localStorage.removeItem('cultureloop-user-email');
}
