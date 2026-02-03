import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, LoginCredentials, SignupCredentials, AuthResponse } from '../types';
import { authStorage } from '../lib/storage';
import { api } from '../services/apiClient';
import { API_ENDPOINTS } from '../lib/constants';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          // Echter API-Aufruf zum Backend
          const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);

          const { user, token } = response.data;

          authStorage.setToken(token);
          authStorage.setUser(user);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (credentials: SignupCredentials) => {
        set({ isLoading: true });
        try {
          // Echter API-Aufruf zum Backend
          const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, credentials);

          const { user, token } = response.data;

          authStorage.setToken(token);
          authStorage.setUser(user);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        authStorage.clearAuth();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User | null) => {
        set({ user });
        if (user) {
          authStorage.setUser(user);
        }
      },

      setToken: (token: string | null) => {
        set({ token });
        if (token) {
          authStorage.setToken(token);
        }
      },

      checkAuth: () => {
        const token = authStorage.getToken();
        const user = authStorage.getUser();

        if (token && user) {
          set({
            user: user as User,
            token,
            isAuthenticated: true,
          });
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
