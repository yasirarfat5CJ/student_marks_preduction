// API Configuration
// Loaded from environment variables for easy deployment

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  me: `${API_BASE_URL}/auth/me`,
  predict: `${API_BASE_URL}/predict`,
  metrics: `${API_BASE_URL}/metrics`,
  visualizations: `${API_BASE_URL}/visualizations`,
  history: `${API_BASE_URL}/predictions/history`,
  whatIf: `${API_BASE_URL}/what-if`,
  whatIfHistory: `${API_BASE_URL}/what-if/history`,
  adminModelMetrics: `${API_BASE_URL}/admin/model-metrics`,
  adminStudentCategories: `${API_BASE_URL}/admin/student-categories`,
};
