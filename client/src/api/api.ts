import axios from 'axios';

// Normalize and validate API URL
const normalizeApiUrl = (url: string | undefined): string => {
  if (!url) {
    return 'http://localhost:5000/api';
  }

  // Remove trailing slashes
  let normalized = url.trim().replace(/\/+$/, '');

  // Parse URL to check path
  try {
    const urlObj = new URL(normalized);
    const pathname = urlObj.pathname;

    // Check if /api is already in the path (at any position)
    // This handles cases like /api/v1, /api/v2, etc.
    if (pathname.includes('/api')) {
      // /api is already in the path, just ensure no trailing slash
      // Don't append /api again
      return normalized;
    }

    // /api is not in the path, add it
    // Ensure it's added to the pathname, not just concatenated
    if (pathname === '/' || pathname === '') {
      urlObj.pathname = '/api';
    } else {
      urlObj.pathname = pathname.endsWith('/') 
        ? pathname + 'api' 
        : pathname + '/api';
    }
    normalized = urlObj.toString().replace(/\/+$/, ''); // Remove trailing slash again
  } catch (e) {
    // If URL parsing fails, try simple string manipulation
    // Check if /api is already in the URL path
    const urlPath = normalized.split('://')[1]?.split('/').slice(1).join('/') || '';
    
    if (urlPath.includes('/api') || normalized.includes('/api/')) {
      // /api is already present, just normalize trailing slash
      return normalized;
    }

    // Simple append if URL parsing failed but URL seems valid
    normalized = normalized + '/api';
  }

  // Validate final URL format
  try {
    new URL(normalized);
  } catch (e) {
    console.error('⚠️ Invalid API URL format:', url, 'Using default localhost');
    return 'http://localhost:5000/api';
  }

  return normalized;
};

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

// Validate API URL configuration
const isProduction = import.meta.env.PROD;
const isLocalhost = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');

// Check if API URL is invalid for production
export const isApiUrlInvalid = isProduction && isLocalhost;

// Warn if using localhost in production
if (isApiUrlInvalid) {
  console.error(
    '⚠️ WARNING: API URL is set to localhost in production!',
    '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '\n🔧 QUICK FIX:',
    '\n1. Go to: https://vercel.com/dashboard',
    '\n2. Select your project → Settings → Environment Variables',
    '\n3. Add: VITE_API_URL = https://your-backend-url.com/api',
    '\n4. Redeploy your application',
    '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '\n📖 Full guide: See VERCEL_ENV_QUICK_SETUP.md in the repository',
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
  // Block requests if localhost is detected in production
  if (isApiUrlInvalid) {
    const error = new Error(
      'API URL is set to localhost in production. Please configure VITE_API_URL in Vercel environment variables.'
    );
    (error as any).isConfigError = true;
    return Promise.reject(error);
  }

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
