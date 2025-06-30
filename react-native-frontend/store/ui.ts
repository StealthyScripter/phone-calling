import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UIState } from './types';

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      isKeyboardVisible: false,
      activeScreen: 'dialer',
      showIncomingCall: false,
      showActiveCall: false,
      notifications: [],

      setTheme: (theme) => {
        set({ theme });
      },

      setKeyboardVisible: (visible) => {
        set({ isKeyboardVisible: visible });
      },

      setActiveScreen: (screen) => {
        set({ activeScreen: screen });
      },

      setShowIncomingCall: (show) => {
        set({ showIncomingCall: show });
      },

      setShowActiveCall: (show) => {
        set({ showActiveCall: show });
      },

      addNotification: (notification) => {
        const { notifications } = get();
        const newNotifications = [...notifications, notification];
        set({ notifications: newNotifications });

        // Auto-remove notification after duration
        if (notification.duration) {
          setTimeout(() => {
            get().removeNotification(notification.id);
          }, notification.duration);
        }
      },

      removeNotification: (id) => {
        const { notifications } = get();
        const newNotifications = notifications.filter(n => n.id !== id);
        set({ notifications: newNotifications });
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
