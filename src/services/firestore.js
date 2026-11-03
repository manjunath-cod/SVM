import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { firestore, firebaseConfigured } from './firebase.js';

const DEMO_STORE_KEY = 'svm_firestore_demo_data';

function getDemoStore() {
  try {
    const raw = localStorage.getItem(DEMO_STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }

  return {
    users: [
      {
        uid: 'demo-student-01',
        id: 'demo-student-01',
        name: 'Kavya Patil',
        displayName: 'Kavya Patil',
        email: 'kavya.p@svmit.ac.in',
        department: 'Electronics & Communication',
        academicYear: '2nd Year',
        creativeInterests: ['Singing & Vocals', 'Classical Dance'],
        role: 'student',
        approvalStatus: 'pending',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        uid: 'demo-student-02',
        id: 'demo-student-02',
        name: 'Siddharth Rao',
        displayName: 'Siddharth Rao',
        email: 'siddharth.r@svmit.ac.in',
        department: 'Mechanical Engineering',
        academicYear: '3rd Year',
        creativeInterests: ['Photography & Film', 'Graphic Design'],
        role: 'student',
        approvalStatus: 'pending',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        uid: 'demo-student-03',
        id: 'demo-student-03',
        name: 'Ananya Sharma',
        displayName: 'Ananya Sharma',
        email: 'ananya.s@svmit.ac.in',
        department: 'Computer Science & Engineering',
        academicYear: '3rd Year',
        creativeInterests: ['Vocal Music', 'Creative Writing'],
        role: 'student',
        approvalStatus: 'approved',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ],
    announcements: [
      {
        id: 'ann-1',
        title: 'SVM Annual Cultural Fest: Auditions Open',
        category: 'Auditions',
        priority: 'Urgent',
        content: 'Auditions for vocalists, instrumentalists, and classical dancers begin next Tuesday at the Main Auditorium. Register via the Events portal.',
        authorName: 'Faculty Cultural Coordinator',
        archived: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ann-2',
        title: 'Creative Writing & Poetry Workshop',
        category: 'Workshop',
        priority: 'Normal',
        content: 'Interdisciplinary creative writing workshop hosted by the Literary Guild. All departments welcome.',
        authorName: 'SVM Literary Head',
        archived: false,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    adminLogs: [
      {
        id: 'log-1',
        adminName: 'Faculty Coordinator',
        action: 'Student Approved',
        targetName: 'Ananya Sharma',
        targetEmail: 'ananya.s@svmit.ac.in',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ]
  };
}

function saveDemoStore(data) {
  try {
    localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function timestampValue(value) {
  return value?.toDate ? value.toDate().toISOString() : value || new Date().toISOString();
}

/**
 * Get user profile by UID.
 */
export async function getUserProfile(uid) {
  if (firebaseConfigured && firestore) {
    const snapshot = await getDoc(doc(firestore, 'users', uid));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      created_at: timestampValue(data.createdAt),
      updated_at: timestampValue(data.updatedAt)
    };
  }

  // Demo fallback
  const store = getDemoStore();
  const user = store.users.find((u) => u.uid === uid || u.id === uid);
  return user || null;
}

/**
 * Update user profile.
 */
export async function updateUserProfile(uid, data) {
  if (firebaseConfigured && firestore) {
    await updateDoc(doc(firestore, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp()
    });
    return getUserProfile(uid);
  }

  const store = getDemoStore();
  const idx = store.users.findIndex((u) => u.uid === uid || u.id === uid);
  if (idx !== -1) {
    store.users[idx] = { ...store.users[idx], ...data, updatedAt: new Date().toISOString() };
    saveDemoStore(store);
    return store.users[idx];
  }
  return null;
}

/**
 * Query students by approval status: 'pending' | 'approved' | 'rejected' | 'all'
 */
export async function getStudentsByStatus(status = 'pending') {
  if (firebaseConfigured && firestore) {
    const usersCol = collection(firestore, 'users');
    let q;
    if (status === 'all') {
      q = query(usersCol, where('role', '==', 'student'), orderBy('createdAt', 'desc'));
    } else {
      q = query(usersCol, where('role', '==', 'student'), where('approvalStatus', '==', status));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: timestampValue(d.data().createdAt) }));
  }

  // Demo fallback
  const store = getDemoStore();
  if (status === 'all') return store.users;
  return store.users.filter((u) => u.approvalStatus === status);
}

/**
 * Update student approval status: 'approved' | 'rejected'.
 */
export async function updateStudentApprovalStatus(adminUid, studentUid, newStatus, reason = '') {
  if (firebaseConfigured && firestore) {
    await updateDoc(doc(firestore, 'users', studentUid), {
      approvalStatus: newStatus,
      rejectionReason: reason || null,
      reviewedBy: adminUid,
      reviewedAt: serverTimestamp()
    });

    // Log admin activity
    try {
      await addDoc(collection(firestore, 'adminActivityLogs'), {
        adminId: adminUid,
        targetUserId: studentUid,
        action: `student_${newStatus}`,
        reason: reason || null,
        timestamp: serverTimestamp()
      });
    } catch { /* ignore */ }

    // Notify student
    try {
      await addDoc(collection(firestore, 'notifications'), {
        userId: studentUid,
        title: newStatus === 'approved' ? 'SVM Account Approved!' : 'Registration Update',
        message:
          newStatus === 'approved'
            ? 'Your SVM student account has been approved by the coordinator. Welcome to the creative portal!'
            : `Your student registration was not approved. ${reason || 'Please contact SVM coordinators.'}`,
        type: newStatus,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch { /* ignore */ }

    return true;
  }

  // Demo fallback
  const store = getDemoStore();
  const student = store.users.find((u) => u.uid === studentUid || u.id === studentUid);
  if (student) {
    student.approvalStatus = newStatus;
    student.rejectionReason = reason || null;
    store.adminLogs.unshift({
      id: `log-${Date.now()}`,
      adminName: 'SVM Administrator',
      action: newStatus === 'approved' ? 'Student Approved' : 'Student Rejected',
      targetName: student.name || student.displayName,
      targetEmail: student.email,
      timestamp: new Date().toISOString()
    });
    saveDemoStore(store);
  }
  return true;
}

/**
 * Announcements & Notices: List all active notices
 */
export async function listAnnouncements(includeArchived = false) {
  if (firebaseConfigured && firestore) {
    const col = collection(firestore, 'announcements');
    let q;
    if (includeArchived) {
      q = query(col, orderBy('createdAt', 'desc'));
    } else {
      q = query(col, where('archived', '==', false), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: timestampValue(d.data().createdAt)
    }));
  }

  // Demo fallback
  const store = getDemoStore();
  if (includeArchived) return store.announcements;
  return store.announcements.filter((a) => !a.archived);
}

/**
 * Create a new announcement.
 */
export async function createAnnouncement({ title, content, category, priority, authorName, authorId }) {
  if (firebaseConfigured && firestore) {
    const docRef = await addDoc(collection(firestore, 'announcements'), {
      title,
      content,
      category: category || 'General Notice',
      priority: priority || 'Normal',
      authorName: authorName || 'SVM Administrator',
      authorId: authorId || 'admin',
      archived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Log admin activity
    try {
      await addDoc(collection(firestore, 'adminActivityLogs'), {
        adminId: authorId || 'admin',
        action: 'notice_published',
        noticeTitle: title,
        timestamp: serverTimestamp()
      });
    } catch { /* ignore */ }

    return { id: docRef.id, title, content, category, priority, archived: false };
  }

  // Demo fallback
  const store = getDemoStore();
  const notice = {
    id: `ann-${Date.now()}`,
    title,
    content,
    category: category || 'General Notice',
    priority: priority || 'Normal',
    authorName: authorName || 'SVM Administrator',
    archived: false,
    createdAt: new Date().toISOString()
  };
  store.announcements.unshift(notice);
  store.adminLogs.unshift({
    id: `log-${Date.now()}`,
    adminName: authorName || 'SVM Administrator',
    action: `Notice Published: "${title}"`,
    timestamp: new Date().toISOString()
  });
  saveDemoStore(store);
  return notice;
}

/**
 * Archive an announcement.
 */
export async function archiveAnnouncement(noticeId, adminUid = 'admin') {
  if (firebaseConfigured && firestore) {
    await updateDoc(doc(firestore, 'announcements', noticeId), {
      archived: true,
      updatedAt: serverTimestamp()
    });
    try {
      await addDoc(collection(firestore, 'adminActivityLogs'), {
        adminId: adminUid,
        action: 'notice_archived',
        noticeId,
        timestamp: serverTimestamp()
      });
    } catch { /* ignore */ }
    return true;
  }

  const store = getDemoStore();
  const found = store.announcements.find((a) => a.id === noticeId);
  if (found) {
    found.archived = true;
    saveDemoStore(store);
  }
  return true;
}

/**
 * List recent administrator activity logs.
 */
export async function listAdminLogs(limitCount = 20) {
  if (firebaseConfigured && firestore) {
    const q = query(
      collection(firestore, 'adminActivityLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      timestamp: timestampValue(d.data().timestamp)
    }));
  }

  const store = getDemoStore();
  return store.adminLogs.slice(0, limitCount);
}

/**
 * Collaboration projects
 */
export async function listCollaborationProjects(discipline = 'all') {
  if (firebaseConfigured && firestore) {
    const base = collection(firestore, 'collaborationProjects');
    const projectQuery =
      discipline === 'all'
        ? query(base, where('status', '==', 'open'), orderBy('createdAt', 'desc'))
        : query(
            base,
            where('status', '==', 'open'),
            where('primaryDiscipline', '==', discipline),
            orderBy('createdAt', 'desc')
          );
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

  return [];
}

export async function createCollaborationProject(project) {
  if (firebaseConfigured && firestore) {
    const reference = await addDoc(collection(firestore, 'collaborationProjects'), {
      ...project,
      status: 'open',
      requestsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: reference.id, ...project, status: 'open', requests_count: 0 };
  }

  return { id: `collab-${Date.now()}`, ...project, status: 'open', requests_count: 0 };
}

export async function createJoinRequest(projectId, requester) {
  if (firebaseConfigured && firestore) {
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

  return { id: `req-${Date.now()}`, status: 'pending' };
}
