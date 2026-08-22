import { authTokenStore } from '../services/predictionApi';

export const getCurrentAuth = () => {
  const token = authTokenStore.get();
  if (!token) {
    return { token: null, role: null, isAuthenticated: false };
  }

  try {
    const [, payloadPart] = token.split('.');
    const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
    const isExpired = payload.exp && Date.now() >= payload.exp * 1000;
    if (isExpired) {
      authTokenStore.clear();
      return { token: null, role: null, isAuthenticated: false };
    }
    return { token, role: payload.role || null, isAuthenticated: true };
  } catch {
    authTokenStore.clear();
    return { token: null, role: null, isAuthenticated: false };
  }
};
