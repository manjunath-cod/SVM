import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { firestore } from './firebase.js';

function requireFirestore() {
  if (!firestore) throw new Error('Firebase Firestore is not configured.');
}

function timestampValue(value) {
  return value?.toDate ? value.toDate().toISOString() : value || new Date().toISOString();
}

export async function getUserProfile(uid) {
  requireFirestore();
  const snapshot = await getDoc(doc(firestore, 'users', uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data(), created_at: timestampValue(snapshot.data().createdAt), updated_at: timestampValue(snapshot.data().updatedAt) } : null;
}

export async function updateUserProfile(uid, data) {
  requireFirestore();
  await updateDoc(doc(firestore, 'users', uid), { ...data, updatedAt: serverTimestamp() });
  return getUserProfile(uid);
}

export async function listCollaborationProjects(discipline = 'all') {
  requireFirestore();
  const base = collection(firestore, 'collaborationProjects');
  const projectQuery = discipline === 'all'
    ? query(base, where('status', '==', 'open'), orderBy('createdAt', 'desc'))
    : query(base, where('status', '==', 'open'), where('primaryDiscipline', '==', discipline), orderBy('createdAt', 'desc'));
  const snapshots = await getDocs(projectQuery);
  return snapshots.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      project_title: data.title,
      description: data.description,
      author_discipline: data.primaryDiscipline,
      seeking_disciplines: data.seekingDisciplines || [],
      author_name: data.ownerName || 'SVM student',
      author_department: data.ownerDepartment || '',
      requests_count: data.requestsCount || 0,
      created_at: timestampValue(data.createdAt)
    };
  });
}

export async function createCollaborationProject(project) {
  requireFirestore();
  const reference = await addDoc(collection(firestore, 'collaborationProjects'), {
    ...project,
    status: 'open',
    requestsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: reference.id, ...project, status: 'open', requests_count: 0 };
}

export async function createJoinRequest(projectId, requester) {
  requireFirestore();
  const existing = await getDocs(query(
    collection(firestore, 'collaborationRequests'),
    where('projectId', '==', projectId),
    where('requesterId', '==', requester.uid),
    where('status', '==', 'pending')
  ));
  if (!existing.empty) throw new Error('You already have a pending request for this project.');
  const reference = await addDoc(collection(firestore, 'collaborationRequests'), {
    projectId,
    requesterId: requester.uid,
    requesterName: requester.displayName || requester.email || 'SVM student',
    message: requester.message || '',
    status: 'pending',
    createdAt: serverTimestamp()
  });
  return { id: reference.id, status: 'pending' };
}
