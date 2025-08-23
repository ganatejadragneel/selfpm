import { create } from 'zustand';
import type { User, LoginCredentials, RegisterCredentials } from '../types/auth';
import { authService } from '../services/authService';

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

// Simple localStorage helper for persistence
const STORAGE_KEY = 'selfpm-auth-storage';

const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { user: parsed.user, isAuthenticated: parsed.isAuthenticated };
    }
  } catch (error) {
    console.error('Error parsing stored auth:', error);
  }
  return { user: null, isAuthenticated: false };
};

const setStoredAuth = (user: User | null, isAuthenticated: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, isAuthenticated }));
  } catch (error) {
    console.error('Error storing auth:', error);
  }
};

export const useAuthStore = create<AuthStore>((set, get) => {
  const stored = getStoredAuth();
  
  return {
      user: stored.user,
      loading: false,
      error: null,
      isAuthenticated: stored.isAuthenticated,

      login: async (credentials: LoginCredentials) => {
        set({ loading: true, error: null });
        
        try {
          const response = await authService.login(credentials);
          const newState = { 
            user: response.user, 
            loading: false, 
            error: null,
            isAuthenticated: true 
          };
          set(newState);
          setStoredAuth(response.user, true);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          const errorState = { 
            user: null, 
            loading: false, 
            error: message,
            isAuthenticated: false 
          };
          set(errorState);
          setStoredAuth(null, false);
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ loading: true, error: null });
        
        try {
          await authService.register(credentials);
          // Don't automatically log in after registration
          // User needs to log in manually for better security
          set({ 
            user: null, 
            loading: false, 
            error: null,
            isAuthenticated: false 
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ 
            user: null, 
            loading: false, 
            error: message,
            isAuthenticated: false 
          });
          throw error;
        }
      },

      logout: () => {
        const logoutState = { 
          user: null, 
          loading: false, 
          error: null,
          isAuthenticated: false 
        };
        set(logoutState);
        setStoredAuth(null, false);
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const { user } = get();
        
        if (!user) {
          set({ isAuthenticated: false });
          return;
        }

        set({ loading: true });
        
        try {
          // Verify user still exists and is active
          const currentUser = await authService.getUserById(user.id);
          
          if (currentUser) {
            set({ 
              user: currentUser, 
              loading: false, 
              isAuthenticated: true,
              error: null 
            });
          } else {
            // User no longer exists or is inactive
            set({ 
              user: null, 
              loading: false, 
              isAuthenticated: false,
              error: null 
            });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ 
            user: null, 
            loading: false, 
            isAuthenticated: false,
            error: null 
          });
        }
      },
    };
});