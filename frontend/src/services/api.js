import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach Authorization header if JWT token is stored in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  register: async (email, password, fullName, otp) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
      otp,
    });
    return response.data;
  },

  sendOtp: async (email) => {
    const response = await api.post('/auth/send-otp', { email });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const startupService = {
  submitIdea: async (ideaData) => {
    const response = await api.post('/startup/submit', ideaData);
    return response.data;
  },

  listIdeas: async () => {
    const response = await api.get('/startup/list');
    return response.data;
  },

  getIdea: async (ideaId) => {
    const response = await api.get(`/startup/${ideaId}`);
    return response.data;
  },
};

export const analysisService = {
  evaluate: async (ideaId) => {
    const response = await api.post('/analysis/evaluate', { startup_idea_id: ideaId });
    return response.data;
  },

  runSwot: async (ideaId) => {
    const response = await api.post('/analysis/swot', { startup_idea_id: ideaId });
    return response.data;
  },

  runCompetitors: async (ideaId) => {
    const response = await api.post('/analysis/competitors', { startup_idea_id: ideaId });
    return response.data;
  },

  runRevenue: async (ideaId) => {
    const response = await api.post('/analysis/revenue', { startup_idea_id: ideaId });
    return response.data;
  },

  runCanvas: async (ideaId) => {
    const response = await api.post('/analysis/canvas', { startup_idea_id: ideaId });
    return response.data;
  },

  runPitchDeck: async (ideaId) => {
    const response = await api.post('/analysis/pitchdeck', { startup_idea_id: ideaId });
    return response.data;
  },

  runAll: async (ideaId) => {
    const response = await api.post('/analysis/all', { startup_idea_id: ideaId });
    return response.data;
  },
};

export const reportsService = {
  getReport: async (ideaId) => {
    const response = await api.get(`/reports/${ideaId}`);
    return response.data;
  },

  downloadPdf: async (ideaId, startupName) => {
    const response = await api.get(`/reports/${ideaId}/pdf`, {
      responseType: 'blob',
    });
    
    // Generate a downloadable URL for the blob
    const file = new Blob([response.data], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(file);
    
    const link = document.createElement('a');
    link.href = fileURL;
    link.setAttribute('download', `Startup_Validation_Report_${startupName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default api;
