import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CallState } from './types';

export const useCallStore = create<CallState>()(
  persist(
    (set, get) => ({
      activeCall: null,
      callHistory: [],
      callState: 'idle',
      isConnected: false,
      isMuted: false,
      isSpeakerOn: false,
      isRecording: false,
      callTimer: 0,

      setActiveCall: (call) => {
        set({ activeCall: call });
      },

      setCallState: (state) => {
        set({ callState: state });
      },

      setConnected: (connected) => {
        set({ isConnected: connected });
      },

      setMuted: (muted) => {
        set({ isMuted: muted });
      },

      setSpeakerOn: (speakerOn) => {
        set({ isSpeakerOn: speakerOn });
      },

      setRecording: (recording) => {
        set({ isRecording: recording });
      },

      setCallTimer: (timer) => {
        set({ callTimer: timer });
      },

      addToHistory: (call) => {
        const { callHistory } = get();
        const newHistory = [call, ...callHistory].slice(0, 100); // Keep last 100 calls
        set({ callHistory: newHistory });
      },

      clearActiveCall: () => {
        set({
          activeCall: null,
          callState: 'idle',
          isMuted: false,
          isSpeakerOn: false,
          isRecording: false,
          callTimer: 0,
        });
      },

      clearHistory: () => {
        set({ callHistory: [] });
      },
    }),
    {
      name: 'calls-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        callHistory: state.callHistory,
      }),
    }
  )
);
