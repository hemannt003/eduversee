import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Validate API URL configuration
const isProduction = import.meta.env.PROD;
const isLocalhost = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');

// Warn if using localhost in production
if (isProduction && isLocalhost) {
  console.error(
    '⚠️ WARNING: API URL is set to localhost in production!',
    '\nPlease set VITE_API_URL environment variable in Vercel.',
    '\nCurrent API URL:', API_URL
  );
}

// Log API URL to help diagnose connection issues
if (import.meta.env.DEV) {
  console.log('🔗 API URL:', API_URL);
} else if (isProduction) {
  console.log('🔗 API URL:', API_URL, '(Production)');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout (increased for slower connections)
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
    // Enhanced error logging for debugging
    if (error.response) {
      // Server responded with error status
      console.error('❌ API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        message: error.response.data?.message || error.message,
      });
      return Promise.reject(error);
    } else if (error.request) {
      // Request was made but no response received
      // This could be a network error, CORS issue, or server down
      console.error('❌ API Network Error:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
        code: error.code,
        hint: isProduction && isLocalhost 
          ? 'API URL is set to localhost. Set VITE_API_URL in Vercel environment variables.'
          : 'Check if backend is running and accessible.',
      });
      return Promise.reject(error);
    } else {
      // Something else happened
      console.error('❌ API Error:', error.message);
      return Promise.reject(error);
    }
  }
);

export default api;
