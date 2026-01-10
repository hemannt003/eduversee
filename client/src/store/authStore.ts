import { create } from 'zustand';
import axios from 'axios';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

axios.defaults.baseURL = API_URL;

// Define setToken before it's used
const setToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const useAuthStore = create<AuthState>((set) => {
  // Load from localStorage on init
  const loadFromStorage = () => {
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
        const response = await axios.post('/auth/login', { email, password });
        const { token, user } = response.data.data;
        setToken(token);
        localStorage.setItem('auth-storage', JSON.stringify({ user, token }));
        set({ user, token, loading: false });
      } catch (error: any) {
        set({ loading: false });
        throw new Error(error.response?.data?.message || 'Login failed');
      }
    },
    register: async (username: string, email: string, password: string) => {
      set({ loading: true });
      try {
        const response = await axios.post('/auth/register', {
          username,
          email,
          password,
        });
        const { token, user } = response.data.data;
        setToken(token);
        localStorage.setItem('auth-storage', JSON.stringify({ user, token }));
        set({ user, token, loading: false });
      } catch (error: any) {
        set({ loading: false });
        throw new Error(error.response?.data?.message || 'Registration failed');
      }
    },
    logout: () => {
      setToken(null);
      localStorage.removeItem('auth-storage');
      set({ user: null, token: null });
    },
    updateUser: (user: User) => {
      const current = localStorage.getItem('auth-storage');
      if (current) {
        const parsed = JSON.parse(current);
        localStorage.setItem('auth-storage', JSON.stringify({ ...parsed, user }));
      }
      set({ user });
    },
  };
});

// Initialize token from storage
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
