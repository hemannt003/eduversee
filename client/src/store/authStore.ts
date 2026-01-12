import { create } from 'zustand';
import api from '../api/api';

interface User {
  id: string;
  username: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Define setToken before it's used
// Note: We still need to set the token on the api instance for the interceptor
const setToken = (token: string | null) => {
  if (typeof window === 'undefined') {
    return; // Guard against SSR/build-time execution
  }

  if (token) {
    // Store token in localStorage for the interceptor to pick up
    const current = localStorage.getItem('auth-storage');
    if (current) {
      // Update existing storage
      try {
        const parsed = JSON.parse(current);
        localStorage.setItem('auth-storage', JSON.stringify({ ...parsed, token }));
      } catch (e) {
        // If parsing fails, initialize new storage
        localStorage.setItem('auth-storage', JSON.stringify({ token }));
      }
    } else {
      // Initialize storage if it doesn't exist (first login/registration)
      localStorage.setItem('auth-storage', JSON.stringify({ token }));
    }
  } else {
    // Remove token from localStorage
    const current = localStorage.getItem('auth-storage');
    if (current) {
      try {
        const parsed = JSON.parse(current);
        delete parsed.token;
        localStorage.setItem('auth-storage', JSON.stringify(parsed));
      } catch (e) {
        // If parsing fails, remove storage entirely
        localStorage.removeItem('auth-storage');
      }
    }
  }
};

export const useAuthStore = create<AuthState>((set) => {
  // Load from localStorage on init
  // Guard against SSR/build-time execution (though this is client-side only)
  const loadFromStorage = () => {
    if (typeof window === 'undefined') {
      return { user: null, token: null };
    }
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          setToken(parsed.token);
          return { user: parsed.user, token: parsed.token };
        }
      }
    } catch (e) {
      // Ignore
    }
    return { user: null, token: null };
  };

  const initialState = loadFromStorage();

  return {
    ...initialState,
    loading: false,
    login: async (email: string, password: string) => {
      set({ loading: true });
      try {
        const response = await api.post('/auth/login', { email, password });
        
        // Validate response structure
        if (!response.data || !response.data.data) {
          throw new Error('Invalid response from server');
        }
        
        const { token, user } = response.data.data;
        
        if (!token || !user) {
          throw new Error('Missing token or user data in response');
        }
        
        setToken(token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-storage', JSON.stringify({ user, token }));
        }
        set({ user, token, loading: false });
      } catch (error: any) {
        set({ loading: false });
        
        // Handle different error types
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.message || error.response.data?.error || 'Login failed';
          throw new Error(message);
        } else if (error.request) {
          // Request was made but no response received (network error)
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const isLocalhost = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
          
          if (isLocalhost && import.meta.env.PROD) {
            throw new Error(
              'Backend connection failed. The API URL is set to localhost in production. ' +
              'Please configure VITE_API_URL in Vercel environment variables.'
            );
          } else if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout. The server is taking too long to respond. Please try again.');
          } else if (error.code === 'ERR_NETWORK') {
            throw new Error(
              'Network error. Unable to reach the server. ' +
              'Please check if the backend is running and the API URL is correct.'
            );
          } else {
            throw new Error(
              'Unable to connect to server. ' +
              'Please check your internet connection and ensure the backend is running.'
            );
          }
        } else {
          // Something else happened
          throw new Error(error.message || 'Login failed. Please try again.');
        }
      }
    },
    register: async (username: string, email: string, password: string) => {
      set({ loading: true });
      try {
        const response = await api.post('/auth/register', {
          username,
          email,
          password,
        });
        
        // Validate response structure
        if (!response.data || !response.data.data) {
          throw new Error('Invalid response from server');
        }
        
        const { token, user } = response.data.data;
        
        if (!token || !user) {
          throw new Error('Missing token or user data in response');
        }
        
        setToken(token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-storage', JSON.stringify({ user, token }));
        }
        set({ user, token, loading: false });
      } catch (error: any) {
        set({ loading: false });
        
        // Handle different error types
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.message || error.response.data?.error || 'Registration failed';
          throw new Error(message);
        } else if (error.request) {
          // Request was made but no response received (network error)
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const isLocalhost = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
          
          if (isLocalhost && import.meta.env.PROD) {
            throw new Error(
              'Backend connection failed. The API URL is set to localhost in production. ' +
              'Please configure VITE_API_URL in Vercel environment variables.'
            );
          } else if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout. The server is taking too long to respond. Please try again.');
          } else if (error.code === 'ERR_NETWORK') {
            throw new Error(
              'Network error. Unable to reach the server. ' +
              'Please check if the backend is running and the API URL is correct.'
            );
          } else {
            throw new Error(
              'Unable to connect to server. ' +
              'Please check your internet connection and ensure the backend is running.'
            );
          }
        } else {
          // Something else happened
          throw new Error(error.message || 'Registration failed. Please try again.');
        }
      }
    },
    logout: () => {
      setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
      }
      set({ user: null, token: null });
    },
    updateUser: (user: User) => {
      if (typeof window !== 'undefined') {
        const current = localStorage.getItem('auth-storage');
        if (current) {
          const parsed = JSON.parse(current);
          localStorage.setItem('auth-storage', JSON.stringify({ ...parsed, user }));
        }
      }
      set({ user });
    },
  };
});

// Initialize token from storage
// Guard against SSR/build-time execution (though this is client-side only)
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('auth-storage');
  if (storedToken) {
    try {
      const parsed = JSON.parse(storedToken);
      // Handle both zustand persist format and our custom format
      const token = parsed.state?.token || parsed.token;
      if (token) {
        setToken(token);
      }
    } catch (e) {
      // Ignore
    }
  }
}
