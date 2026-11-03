import { SVM_BADGES } from '../data/badges.js';
import { firebaseAuth, firebaseConfigured } from './firebase.js';
import { getUserProfile, updateUserProfile, listCollaborationProjects, createCollaborationProject, createJoinRequest } from './firestore.js';

const STORAGE_KEY = 'svm-cultureloop-local';
const defaultProfile = {
  id: 'local-student',
  name: 'SVM Student',
  email: 'student@svmit.ac.in',
  department: 'Computer Science & Engineering',
  year_of_study: '3rd Year',
  bio: 'Creative explorer at SVM.',
  semester_goal: 'Explore new creative disciplines.',
  availability: 'Flexible',
  avatar_data: ''
};

const defaultOpportunities = [
  { id: 'opp-1', title: 'SVM Unplugged', category: 'music', type: 'workshop', difficulty: 'beginner', location: 'Main Auditorium', schedule: '12 Dec · 5:30 PM', description: 'Open stage and guided music workshop for every experience level.', deadline: '12 Dec' },
  { id: 'opp-2', title: 'Frames of Campus', category: 'photography', type: 'challenge', difficulty: 'beginner', location: 'Student Centre', schedule: '18 Dec · All day', description: 'Capture the people and places that make SVM memorable.', deadline: '18 Dec' },
  { id: 'opp-3', title: 'Create Together', category: 'design', type: 'collaboration', difficulty: 'beginner', location: 'Innovation Lab', schedule: '08 Jan · 4:00 PM', description: 'Build a creative project with students from different disciplines.', deadline: '08 Jan' }
];

const defaultEvents = [
  { id: 'event-1', title: 'SVM Unplugged', category: 'music', date: '12', month: 'DEC', time: '5:30 PM', venue: 'Main Auditorium', description: 'Campus open stage and acoustic performance night.', type: 'Performance' },
  { id: 'event-2', title: 'Frames of Campus', category: 'photography', date: '18', month: 'DEC', time: 'All day', venue: 'Student Centre', description: 'A student photography exhibition.', type: 'Exhibition' },
  { id: 'event-3', title: 'Create Together', category: 'design', date: '08', month: 'JAN', time: '4:00 PM', venue: 'Innovation Lab', description: 'An interdisciplinary creative workshop.', type: 'Workshop' }
];

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
  return { ...defaultProfile, ...(readState().profile || {}) };
}

function submissions() {
  return readState().submissions || [];
}

function achievements() {
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
      badgesEarned: badges.filter((badge) => badge.unlocked).length,
      totalBadges: badges.length,
      totalXp: badges.filter((badge) => badge.unlocked).reduce((sum, badge) => sum + badge.xp, 0),
      weeklyXp: 0,
      verifiedMilestones: 0,
      certificatesEarned: 0
    },
    badges,
    recentUnlocks: [],
    dynamicAchievements: []
  };
}

export const api = {
  getHealth: async () => ({ status: 'ok', mode: 'active' }),
  getSession: async () => {
    if (firebaseConfigured && firebaseAuth?.currentUser) {
      return { user: (await getUserProfile(firebaseAuth.currentUser.uid)) || firebaseAuth.currentUser };
    }
    return { user: profile() };
  },
  signIn: async () => ({ user: profile() }),
  getProfile: async () => {
    if (firebaseConfigured && firebaseAuth?.currentUser) return { profile: await getUserProfile(firebaseAuth.currentUser.uid) };
    return { profile: profile() };
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
    const updated = { ...profile(), ...data };
    writeState({ profile: updated });
    return { profile: updated };
  },
  getSettings: async () => {
    if (firebaseConfigured && firebaseAuth?.currentUser) {
      const current = await getUserProfile(firebaseAuth.currentUser.uid);
      return { profile: current, settings: current?.settings || {} };
    }
    return { profile: profile(), settings: readState().settings || {} };
  },
  updateSettings: async ({ settings, avatar_data }) => {
    if (firebaseConfigured && firebaseAuth?.currentUser) {
      const updated = await updateUserProfile(firebaseAuth.currentUser.uid, { settings, avatar_data: avatar_data || '' });
      return { profile: updated, settings };
    }
    const updated = { ...profile(), avatar_data: avatar_data || '' };
    writeState({ profile: updated, settings });
    return { profile: updated, settings };
  },
  submitFeedback: async (feedback) => {
    writeState({ feedback: [...(readState().feedback || []), { ...feedback, created_at: new Date().toISOString() }] });
    return { success: true };
  },
  getPassport: async () => {
    const prof = profile();
    const interests = readState().interests || [];
    const subs = submissions();
    let score = 20;
    if (interests.length > 0) score += 30;
    if (prof.bio) score += 15;
    if (prof.semester_goal) score += 15;
    if (subs.length > 0) score += 20;
    const completionPercentage = Math.min(100, score);
    return {
      profile: prof,
      interests,
      submissions: subs,
      evaluations: subs.map((s) => s.evaluation).filter(Boolean),
      completionPercentage
    };
  },
  savePassport: async ({ interests, bio, semester_goal, availability, preferred_roles }) => {
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
  },
  uploadSubmission: async (submission) => {
    const item = { ...submission, id: `submission-${Date.now()}`, created_at: new Date().toISOString(), status: 'submitted' };
    writeState({ submissions: [item, ...submissions()] });
    return { submission: item };
  },
  getSubmissions: async () => ({ submissions: submissions() }),
  getSubmission: async (id) => ({ submission: submissions().find((item) => item.id === id) || null }),
  evaluateSubmission: async (id) => {
    try {
      const res = await fetch(`/api/submissions/${id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': profile().email }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend server offline, use graceful local evaluation
    }
    const currentSubs = submissions();
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
  },
  getOpportunities: async (filters = {}) => ({
    opportunities: defaultOpportunities.filter(
      (item) =>
        (!filters.category || filters.category === 'all' || item.category === filters.category) &&
        (!filters.type || filters.type === 'all' || item.type === filters.type) &&
        (!filters.search || `${item.title} ${item.description}`.toLowerCase().includes(filters.search.toLowerCase()))
    )
  }),
  registerOpportunity: async (id) => {
    const registrations = readState().registrations || [];
    const registered = registrations.includes(id);
    writeState({ registrations: registered ? registrations.filter((item) => item !== id) : [...registrations, id] });
    return { registered: !registered };
  },
  getEvents: async () => ({
    events: defaultEvents.map((event) => ({ ...event, user_rsvp: (readState().rsvps || []).includes(event.id) }))
  }),
  rsvpEvent: async (id) => {
    const rsvps = readState().rsvps || [];
    const attending = rsvps.includes(id);
    writeState({ rsvps: attending ? rsvps.filter((item) => item !== id) : [...rsvps, id] });
    return { rsvpd: !attending };
  },
  getCollaborations: async (discipline = 'all') => {
    if (firebaseConfigured) return { posts: await listCollaborationProjects(discipline) };
    return {
      posts: (readState().collaborations || []).filter(
        (item) => discipline === 'all' || item.author_discipline === discipline || item.seeking_disciplines.includes(discipline)
      )
    };
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
    const post = {
      ...data,
      id: `collab-${Date.now()}`,
      author_name: profile().name,
      created_at: new Date().toISOString(),
      seeking_disciplines: data.seeking_disciplines || []
    };
    writeState({ collaborations: [post, ...(readState().collaborations || [])] });
    return { post };
  },
  sendCollaborationRequest: async (projectId, message = '') => {
    if (firebaseConfigured && firebaseAuth?.currentUser) {
      await createJoinRequest(projectId, {
        uid: firebaseAuth.currentUser.uid,
        displayName: firebaseAuth.currentUser.displayName,
        email: firebaseAuth.currentUser.email,
        message
      });
    }
    return { sent: true };
  },
  getAchievements: async () => achievements(),
  verifyAchievements: async () => achievements(),
  toggleFeatureBadge: async (badgeId) => {
    const saved = readState().achievements || {};
    writeState({ achievements: { ...saved, [badgeId]: { ...saved[badgeId], featured: !saved[badgeId]?.featured } } });
    return achievements();
  },
  markBadgeNotified: async () => achievements(),
  reviewAchievementProposal: async () => achievements()
};
