import { SVM_BADGES } from '../data/badges.js';
import { firebaseAuth, firebaseConfigured } from './firebase.js';
import { getUserProfile, updateUserProfile, listCollaborationProjects, createCollaborationProject, createJoinRequest } from './firestore.js';

const STORAGE_KEY = 'svm-cultureloop-local';
const defaultProfile = {
  id: 'student@svmit.ac.in',
  name: 'Aarav Sharma',
  email: 'student@svmit.ac.in',
  department: 'Computer Science & Engineering',
  year_of_study: '3rd Year',
  bio: 'Creative explorer at SVM.',
  semester_goal: 'Explore new creative disciplines.',
  availability: 'Flexible',
  avatar_data: ''
};

function readState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeState(patch) {
  const next = { ...readState(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function profile() {
  try {
    const saved = localStorage.getItem('cultureloop-user') || localStorage.getItem('svm_active_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.email) return parsed;
    }
  } catch { /* ignore */ }
  return { ...defaultProfile, ...(readState().profile || {}) };
}

function getAuthHeaders() {
  const user = profile();
  const headers = { 'Content-Type': 'application/json' };
  if (user?.email) {
    headers['x-user-email'] = user.email;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error || `HTTP error ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (err) {
    // Rethrow if caller needs to catch, but helper returns null if offline
    throw err;
  }
}

export const api = {
  // Health & Server Mode
  getHealth: async () => {
    try {
      return await request('/api/health');
    } catch {
      return { status: 'offline', mode: 'local' };
    }
  },

  // Auth / Session
  getSession: async () => {
    if (firebaseConfigured && firebaseAuth?.currentUser) {
      const p = await getUserProfile(firebaseAuth.currentUser.uid);
      return { user: p || firebaseAuth.currentUser };
    }
    try {
      const data = await request('/api/auth/session');
      if (data?.user) return data;
    } catch { /* fallback */ }
    return { user: profile() };
  },

  signIn: async (email) => {
    try {
      const data = await request('/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      if (data?.user) return data;
    } catch { /* fallback */ }
    return { user: profile() };
  },

  // Profiles
  getProfile: async () => {
    if (firebaseConfigured && firebaseAuth?.currentUser) {
      return { profile: await getUserProfile(firebaseAuth.currentUser.uid) };
    }
    try {
      return await request('/api/profile');
    } catch {
      return { profile: profile() };
    }
  },

  updateProfile: async (data) => {
    if (firebaseConfigured && firebaseAuth?.currentUser) {
      return {
        profile: await updateUserProfile(firebaseAuth.currentUser.uid, {
          displayName: data.name,
          name: data.name,
          department: data.department || '',
          academicYear: data.year_of_study || '',
          year_of_study: data.year_of_study || '',
          bio: data.bio || '',
          avatar_data: data.avatar_data || ''
        })
      };
    }
    try {
      return await request('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch {
      const updated = { ...profile(), ...data };
      writeState({ profile: updated });
      return { profile: updated };
    }
  },

  getSettings: async () => {
    try {
      return await request('/api/settings');
    } catch {
      return { profile: profile(), settings: readState().settings || {} };
    }
  },

  updateSettings: async ({ settings, avatar_data }) => {
    try {
      return await request('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings, avatar_data })
      });
    } catch {
      const updated = { ...profile(), avatar_data: avatar_data || '' };
      writeState({ profile: updated, settings });
      return { profile: updated, settings };
    }
  },

  submitFeedback: async (feedback) => {
    try {
      return await request('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(feedback)
      });
    } catch {
      writeState({ feedback: [...(readState().feedback || []), { ...feedback, created_at: new Date().toISOString() }] });
      return { success: true };
    }
  },

  // Creative Passport
  getPassport: async () => {
    try {
      return await request('/api/passport');
    } catch {
      const prof = profile();
      const interests = readState().interests || [];
      const subs = readState().submissions || [];
      let score = 20;
      if (interests.length > 0) score += 30;
      if (prof.bio) score += 15;
      if (prof.semester_goal) score += 15;
      if (subs.length > 0) score += 20;
      return {
        profile: prof,
        interests,
        submissions: subs,
        evaluations: subs.map((s) => s.evaluation).filter(Boolean),
        completionPercentage: Math.min(100, score)
      };
    }
  },

  savePassport: async ({ interests, bio, semester_goal, availability, preferred_roles }) => {
    try {
      return await request('/api/passport', {
        method: 'PUT',
        body: JSON.stringify({ interests, bio, semester_goal, availability, preferred_roles })
      });
    } catch {
      const currentProf = profile();
      const updatedProf = {
        ...currentProf,
        ...(bio !== undefined ? { bio } : {}),
        ...(semester_goal !== undefined ? { semester_goal } : {}),
        ...(availability !== undefined ? { availability } : {}),
        ...(preferred_roles !== undefined ? { preferred_roles: JSON.stringify(preferred_roles) } : {})
      };
      writeState({
        profile: updatedProf,
        interests: (interests || []).map((i) => (typeof i === 'string' ? { category: i } : i))
      });
      return api.getPassport();
    }
  },

  // Submissions & AI Showcase
  uploadSubmission: async (submission) => {
    try {
      return await request('/api/showcase/upload', {
        method: 'POST',
        body: JSON.stringify(submission)
      });
    } catch {
      const item = { ...submission, id: `submission-${Date.now()}`, created_at: new Date().toISOString(), status: 'submitted' };
      writeState({ submissions: [item, ...(readState().submissions || [])] });
      return { submission: item };
    }
  },

  getSubmissions: async (scope = 'all', category = 'all') => {
    try {
      const params = new URLSearchParams();
      if (scope) params.set('scope', scope);
      if (category && category !== 'all') params.set('category', category);
      return await request(`/api/showcase/submissions?${params.toString()}`);
    } catch {
      return { submissions: readState().submissions || [] };
    }
  },

  getSubmission: async (id) => {
    try {
      return await request(`/api/showcase/submission/${id}`);
    } catch {
      return { submission: (readState().submissions || []).find((s) => s.id === id) || null };
    }
  },

  evaluateSubmission: async (id) => {
    try {
      return await request(`/api/showcase/evaluate/${id}`, { method: 'POST' });
    } catch {
      const currentSubs = readState().submissions || [];
      const item = currentSubs.find((s) => s.id === id);
      if (!item) return { submission: null, evaluation: null };

      const evaluation = {
        id: `eval-${Date.now()}`,
        submission_id: id,
        category: item.category || 'creative',
        overall_score: 8.5,
        confidence_rating: 'high',
        summary: `Commendable creative demonstration in ${item.category || 'arts'}. Displays intentional aesthetic choices, expressive clarity, and solid emerging craftsmanship.`,
        strengths: [
          'Clear thematic concept with artistic commitment',
          'Strong sense of timing, composition and creative balance',
          'Distinctive personal style suitable for university cultural showcases'
        ],
        areas_for_improvement: [
          'Refine micro-transitions and technical continuity across sections',
          'Experiment with broader dynamic contrasts and advanced textural variation'
        ],
        practical_exercises: [
          'Practice with structured daily warmup routines tailored to your discipline',
          'Collaborate with an SVM student from a complementary discipline'
        ],
        recommended_svm_activities: [
          'SVM Open Stage & Unplugged Nights',
          'Interdisciplinary Cultural Showcase & Annual Fest'
        ],
        rubric_scores: [
          { name: 'Artistic Intent', score: 8.5, comment: 'Clear expressive direction.' },
          { name: 'Technical Execution', score: 8.0, comment: 'Clean fundamentals.' },
          { name: 'Creativity & Originality', score: 9.0, comment: 'Unique interpretation.' }
        ],
        limitations_disclaimer: 'AI evaluation provides formative educational feedback designed for creative development at SVM.'
      };
      const updatedSubs = currentSubs.map((s) => (s.id === id ? { ...s, evaluation, status: 'evaluated' } : s));
      writeState({ submissions: updatedSubs });
      return { submission: { ...item, evaluation, status: 'evaluated' }, evaluation };
    }
  },

  // Opportunities
  getOpportunities: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.set('category', filters.category);
      if (filters.type && filters.type !== 'all') params.set('type', filters.type);
      if (filters.search) params.set('search', filters.search);
      return await request(`/api/opportunities?${params.toString()}`);
    } catch {
      return { opportunities: [] };
    }
  },

  registerOpportunity: async (id) => {
    try {
      return await request(`/api/opportunities/${id}/register`, { method: 'POST' });
    } catch {
      const regs = readState().registrations || [];
      const registered = regs.includes(id);
      writeState({ registrations: registered ? regs.filter((x) => x !== id) : [...regs, id] });
      return { registered: !registered };
    }
  },

  // Events
  getEvents: async () => {
    try {
      return await request('/api/events');
    } catch {
      return { events: [] };
    }
  },

  rsvpEvent: async (id) => {
    try {
      return await request(`/api/events/${id}/rsvp`, { method: 'POST' });
    } catch {
      const rsvps = readState().rsvps || [];
      const attending = rsvps.includes(id);
      writeState({ rsvps: attending ? rsvps.filter((x) => x !== id) : [...rsvps, id] });
      return { rsvpd: !attending };
    }
  },

  // Collaborations
  getCollaborations: async (discipline = 'all') => {
    if (firebaseConfigured) return { posts: await listCollaborationProjects(discipline) };
    try {
      const params = new URLSearchParams();
      if (discipline && discipline !== 'all') params.set('discipline', discipline);
      return await request(`/api/collaborations?${params.toString()}`);
    } catch {
      return { posts: [] };
    }
  },

  createCollaboration: async (data) => {
    if (firebaseConfigured && firebaseAuth?.currentUser) {
      const current = await getUserProfile(firebaseAuth.currentUser.uid);
      const post = await createCollaborationProject({
        title: data.project_title,
        description: data.description,
        primaryDiscipline: data.author_discipline,
        seekingDisciplines: data.seeking_disciplines || [],
        ownerId: firebaseAuth.currentUser.uid,
        ownerName: current?.displayName || current?.name || firebaseAuth.currentUser.email,
        ownerDepartment: current?.department || ''
      });
      return { post: { ...post, project_title: post.title, author_discipline: post.primaryDiscipline, seeking_disciplines: post.seekingDisciplines } };
    }
    try {
      return await request('/api/collaborations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      const post = {
        ...data,
        id: `collab-${Date.now()}`,
        author_name: profile().name,
        created_at: new Date().toISOString(),
        seeking_disciplines: data.seeking_disciplines || []
      };
      writeState({ collaborations: [post, ...(readState().collaborations || [])] });
      return { post };
    }
  },

  sendCollaborationRequest: async (projectId, message = '') => {
    if (firebaseConfigured && firebaseAuth?.currentUser) {
      await createJoinRequest(projectId, {
        uid: firebaseAuth.currentUser.uid,
        displayName: firebaseAuth.currentUser.displayName,
        email: firebaseAuth.currentUser.email,
        message
      });
      return { sent: true };
    }
    try {
      return await request(`/api/collaborations/${projectId}/request`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    } catch {
      return { sent: true };
    }
  },

  // Official Achievements
  getAchievements: async () => {
    try {
      return await request('/api/achievements');
    } catch {
      const saved = readState().achievements || {};
      const badges = SVM_BADGES.map((badge) => ({
        ...badge,
        unlocked: Boolean(saved[badge.id]?.unlocked),
        featured: Boolean(saved[badge.id]?.featured),
        notified: saved[badge.id]?.notified !== false,
        progress: saved[badge.id]?.unlocked ? 100 : 0
      }));
      return {
        summary: {
          badgesEarned: badges.filter((b) => b.unlocked).length,
          totalBadges: badges.length,
          totalXp: badges.filter((b) => b.unlocked).reduce((sum, b) => sum + b.xp, 0),
          weeklyXp: 0,
          verifiedMilestones: 0,
          certificatesEarned: 0
        },
        badges,
        recentUnlocks: []
      };
    }
  },

  verifyAchievements: async () => {
    try {
      return await request('/api/achievements/verify', { method: 'POST' });
    } catch {
      return api.getAchievements();
    }
  },

  toggleFeatureBadge: async (badgeId) => {
    try {
      return await request('/api/achievements/toggle-feature', {
        method: 'POST',
        body: JSON.stringify({ badgeId })
      });
    } catch {
      const saved = readState().achievements || {};
      writeState({ achievements: { ...saved, [badgeId]: { ...saved[badgeId], featured: !saved[badgeId]?.featured } } });
      return api.getAchievements();
    }
  },

  markBadgeNotified: async (badgeId) => {
    try {
      return await request('/api/achievements/mark-notified', {
        method: 'POST',
        body: JSON.stringify({ badgeId })
      });
    } catch {
      return { success: true };
    }
  },

  // Student Talent Community (Talent Feed)
  getTalentFeed: async (params = {}) => {
    try {
      const sp = new URLSearchParams();
      if (params.category) sp.set('category', params.category);
      if (params.query) sp.set('query', params.query);
      if (params.sort) sp.set('sort', params.sort);
      return await request(`/api/talent-feed?${sp.toString()}`);
    } catch (err) {
      console.warn('Backend talent feed fetch error:', err.message);
      return { posts: [] };
    }
  },

  createTalentPost: async (postData) => {
    return await request('/api/talent-feed/post', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  },

  likeTalentPost: async (postId) => {
    return await request(`/api/talent-feed/${postId}/like`, { method: 'POST' });
  },

  commentTalentPost: async (postId, text) => {
    return await request(`/api/talent-feed/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  saveTalentPost: async (postId) => {
    return await request(`/api/talent-feed/${postId}/save`, { method: 'POST' });
  },

  followCreator: async (creatorName) => {
    return await request(`/api/talent-feed/creators/${encodeURIComponent(creatorName)}/follow`, { method: 'POST' });
  },

  getPopularTalentPosts: async () => {
    try {
      return await request('/api/talent-feed/popular');
    } catch {
      return { popular: [] };
    }
  },

  getTalentCreators: async () => {
    try {
      return await request('/api/talent-feed/creators');
    } catch {
      return { creators: [] };
    }
  },

  // Admin Portal & Directorate
  getAdminStudents: async (status = '') => {
    const sp = new URLSearchParams();
    if (status) sp.set('status', status);
    return await request(`/api/admin/students?${sp.toString()}`);
  },

  updateStudentStatus: async (studentId, status, notes = '') => {
    return await request(`/api/admin/students/${encodeURIComponent(studentId)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    });
  },

  getAdminAnnouncements: async () => {
    return await request('/api/admin/announcements');
  },

  createAnnouncement: async (annData) => {
    return await request('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(annData)
    });
  },

  archiveAnnouncement: async (annId) => {
    return await request(`/api/admin/announcements/${annId}`, { method: 'DELETE' });
  },

  getAdminLogs: async () => {
    return await request('/api/admin/logs');
  },

  adminLogin: async (email, password) => {
    return await request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }
};
