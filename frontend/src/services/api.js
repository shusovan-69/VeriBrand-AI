import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('veribrand_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
        localStorage.removeItem('veribrand_token');
        localStorage.removeItem('veribrand_user');
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const guidelinesApi = {
  getGuidelines: () => api.get('/guidelines'),
  createGuideline: (data) => api.post('/guidelines', data),
  updateGuideline: (id, data) => api.put(`/guidelines/${id}`, data),
  getFacts: (product) => api.get('/guidelines/facts', { params: { product } }),
  createFact: (data) => api.post('/guidelines/facts', data),
  updateFact: (id, data) => api.put(`/guidelines/facts/${id}`, data),
};

export const draftsApi = {
  getDrafts: () => api.get('/drafts'),
  getDraft: (id) => api.get(`/drafts/${id}`),
  createDraft: (data) => api.post('/drafts', data),
  submitRevision: (draftId, data) => api.post(`/drafts/${draftId}/revisions`, data),
  getDraftHistory: (draftId) => api.get(`/drafts/${draftId}/history`),
};

export const verificationApi = {
  verifyDraft: (draftId) => api.post(`/drafts/${draftId}/review`),
  getFindings: (draftId) => api.get(`/drafts/${draftId}/findings`),
  resolveFinding: (findingId, data) => api.post(`/findings/${findingId}/resolve`, data),
};

export const approvalsApi = {
  getPendingReviews: () => api.get('/reviews/pending'),
  submitDecision: (draftId, data) => api.post(`/reviews/${draftId}/decision`, data),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: (limit = 20) => api.get('/dashboard/activity', { params: { limit } }),
};

export const filesApi = {
  extractPdf: (formData) => api.post('/files/extract-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const insightsApi = {
  compareRevisions: (draftId, baseRev, newRev) =>
    api.get('/insights/revisions/compare', {
      params: { draft_id: draftId, base_rev: baseRev, new_rev: newRev },
    }),
  getTrends: () => api.get('/insights/trends'),
  getSourceAlerts: () => api.get('/insights/source-alerts'),
  reviewImage: (formData) =>
    api.post('/insights/image-review', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;
