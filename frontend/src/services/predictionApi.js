import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const TOKEN_KEY = 'edupredict_access_token';

export const authTokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event('edupredict-auth-change'));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('edupredict-auth-change'));
  },
};

const authHeaders = () => {
  const token = authTokenStore.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Standardizes API errors into user-friendly messages
 */
const handleApiError = (error) => {
  console.error('API Error details:', error);
  if (!error.response) {
    // No response from server (Network down or CORS block)
    return {
      message: 'Unable to connect to the prediction service. Please check if the backend is running.',
      type: 'connection'
    };
  }
  
  const status = error.response.status;
  if (status >= 500) {
    return {
      message: 'Prediction service returned an unexpected response (Server Error).',
      type: 'server'
    };
  }

  if (status === 401) {
    return {
      message: 'Please log in to continue.',
      type: 'auth'
    };
  }

  if (status === 403) {
    return {
      message: 'You do not have permission to access this action.',
      type: 'forbidden'
    };
  }
  
  if (status === 400 || status === 422) {
    const detail = error.response.data?.detail;
    let msg = 'Invalid input parameters.';
    if (typeof detail === 'string') {
      msg = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      msg = detail.map(d => d.msg || d.message).join(', ');
    }
    return {
      message: msg,
      type: 'validation'
    };
  }
  
  return {
    message: 'Network error. Please check your connection and try again.',
    type: 'network'
  };
};

export const predictionApi = {
  register: async (data) => {
    try {
      const response = await axios.post(API_ENDPOINTS.register, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  login: async (email, password) => {
    try {
      const response = await axios.post(API_ENDPOINTS.login, { email, password });
      if (response.data?.access_token) {
        authTokenStore.set(response.data.access_token);
      }
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  logout: () => authTokenStore.clear(),

  me: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.me, { headers: authHeaders() });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  /**
   * Submit academic features to backend for final mark predictions
   */
  predict: async (data) => {
    try {
      const payload = {
        attendance_pct: parseFloat(data.attendance_pct),
        study_hours_week: parseFloat(data.study_hours_week),
        assignment_score: parseFloat(data.assignment_score),
        internal_marks: parseFloat(data.internal_marks),
        prev_sem_cgpa: parseFloat(data.prev_sem_cgpa),
        activity_score: parseFloat(data.activity_score)
      };
      
      const response = await axios.post(API_ENDPOINTS.predict, payload, { headers: authHeaders() });
      
      // Validate structure of response
      if (response.data && response.data.predicted_final_marks !== undefined) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Malformed response');
      }
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error)
      };
    }
  },

  /**
   * Retrieve candidate models details and selected model info
   */
  getMetrics: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.metrics);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error)
      };
    }
  },

  getVisualizations: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.visualizations);
      return {
        success: true,
        data: {
          plots: (response.data?.plots || []).map((plot) => ({
            ...plot,
            url: plot.url?.startsWith('http')
              ? plot.url
              : `${API_BASE_URL}${plot.url}`
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error)
      };
    }
  },

  getAdminModelMetrics: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.adminModelMetrics, { headers: authHeaders() });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error)
      };
    }
  },

  getAdminStudentCategories: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.adminStudentCategories, { headers: authHeaders() });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error)
      };
    }
  },

  /**
   * Submit current and what-if academic features to simulate prediction difference
   */
  whatIf: async (currentData, whatIfData) => {
    try {
      const payload = {
        current: {
          attendance_pct: parseFloat(currentData.attendance_pct),
          study_hours_week: parseFloat(currentData.study_hours_week),
          assignment_score: parseFloat(currentData.assignment_score),
          internal_marks: parseFloat(currentData.internal_marks),
          prev_sem_cgpa: parseFloat(currentData.prev_sem_cgpa),
          activity_score: parseFloat(currentData.activity_score)
        },
        what_if: {
          attendance_pct: parseFloat(whatIfData.attendance_pct),
          study_hours_week: parseFloat(whatIfData.study_hours_week),
          assignment_score: parseFloat(whatIfData.assignment_score),
          internal_marks: parseFloat(whatIfData.internal_marks),
          prev_sem_cgpa: parseFloat(whatIfData.prev_sem_cgpa),
          activity_score: parseFloat(whatIfData.activity_score)
        }
      };

      const response = await axios.post(API_ENDPOINTS.whatIf, payload, { headers: authHeaders() });

      if (response.data && response.data.what_if_prediction !== undefined) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Malformed response');
      }
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error)
      };
    }
  },

  /**
   * Fetch prediction log history
   */
  getHistory: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.history, { headers: authHeaders() });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error)
      };
    }
  },

  getWhatIfHistory: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.whatIfHistory, { headers: authHeaders() });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error)
      };
    }
  },
};
export default predictionApi;
