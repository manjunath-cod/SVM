// SVM CultureLoop Frontend API Client

const BASE_URL = '';

function getHeaders() {
  const email = localStorage.getItem('cultureloop-user-email') || 'student@svmit.ac.in';
  return {
    'Content-Type': 'application/json',
    'x-user-email': email
  };
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { ...getHeaders(), ...(options.headers || {}) };

  const res = await fetch(url, {
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
}

export const api = {
  // Health
  getHealth: () => request('/api/health'),

  // Auth / Session
  getSession: () => request('/api/auth/session'),
  signIn: (email) => request('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),

  // Profile
  getProfile: () => request('/api/profile'),
  updateProfile: (profileData) => request('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  }),
  getSettings: () => request('/api/settings'),
  updateSettings: (settingsData) => request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData)
  }),
  submitFeedback: (feedbackData) => request('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(feedbackData)
  }),

  // Creative Passport
  getPassport: () => request('/api/passport'),
  savePassport: (passportData) => request('/api/passport', {
    method: 'PUT',
    body: JSON.stringify(passportData)
  }),

  // Showcase & Submissions
  uploadSubmission: (submissionData) => request('/api/showcase/upload', {
    method: 'POST',
    body: JSON.stringify(submissionData)
  }),

  getSubmissions: (scope = 'all', category = 'all') => {
    const params = new URLSearchParams();
    if (scope) params.set('scope', scope);
    if (category && category !== 'all') params.set('category', category);
    return request(`/api/showcase/submissions?${params.toString()}`);
  },

  getSubmission: (id) => request(`/api/showcase/submission/${id}`),

  evaluateSubmission: (id) => request(`/api/showcase/evaluate/${id}`, {
    method: 'POST'
  }),

  // Opportunities
  getOpportunities: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters.search) params.set('search', filters.search);
    return request(`/api/opportunities?${params.toString()}`);
  },

  registerOpportunity: (id) => request(`/api/opportunities/${id}/register`, {
    method: 'POST'
  }),

  // Events
  getEvents: () => request('/api/events'),
  rsvpEvent: (id) => request(`/api/events/${id}/rsvp`, {
    method: 'POST'
  }),

  // Collaborations
  getCollaborations: (discipline = 'all') => {
    const params = new URLSearchParams();
    if (discipline && discipline !== 'all') params.set('discipline', discipline);
    return request(`/api/collaborations?${params.toString()}`);
  },

  createCollaboration: (collabData) => request('/api/collaborations', {
    method: 'POST',
    body: JSON.stringify(collabData)
  }),

  sendCollaborationRequest: (id, message) => request(`/api/collaborations/${id}/request`, {
    method: 'POST',
    body: JSON.stringify({ message })
  })
};
