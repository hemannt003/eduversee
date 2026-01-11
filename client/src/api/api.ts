import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Log API URL in development to help diagnose connection issues
if (import.meta.env.DEV) {
  console.log('API URL:', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Guard against SSR/build-time execution
  if (typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        // Handle both zustand persist format and our custom format
        const token = parsed.state?.token || parsed.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        // Ignore
      }
    }
  }
  return config;
}, (error) => {
  // Handle request error
  return Promise.reject(error);
});

// Add response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  (error) => {
    // Handle response errors
    if (error.response) {
      // Server responded with error status
      // The error will be handled by the calling code
      return Promise.reject(error);
    } else if (error.request) {
      // Request was made but no response received
      // This could be a network error, CORS issue, or server down
      return Promise.reject(error);
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

export default api;
