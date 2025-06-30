import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthState } from './types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setAuthenticated: (authenticated) => {
        set({ isAuthenticated: authenticated });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
