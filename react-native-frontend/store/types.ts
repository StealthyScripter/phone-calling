import type { User } from '../lib/auth/types';
import type { Contact } from '../lib/contacts/types';
import type { Call, CallStatus } from '../lib/calls/types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export interface CallState {
  activeCall: Call | null;
  callHistory: Call[];
  callState: CallStatus;
  isConnected: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isRecording: boolean;
  callTimer: number;
  setActiveCall: (call: Call | null) => void;
  setCallState: (state: CallStatus) => void;
  setConnected: (connected: boolean) => void;
  setMuted: (muted: boolean) => void;
  setSpeakerOn: (speakerOn: boolean) => void;
  setRecording: (recording: boolean) => void;
  setCallTimer: (timer: number) => void;
  addToHistory: (call: Call) => void;
  clearActiveCall: () => void;
  clearHistory: () => void;
}

export interface ContactState {
  contacts: Contact[];
  favorites: Contact[];
  loading: boolean;
  searchQuery: string;
  selectedContact: Contact | null;
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  removeContact: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedContact: (contact: Contact | null) => void;
  clearContacts: () => void;
}

export interface UIState {
  theme: 'light' | 'dark';
  isKeyboardVisible: boolean;
  activeScreen: string;
  showIncomingCall: boolean;
  showActiveCall: boolean;
  notifications: Notification[];
  setTheme: (theme: 'light' | 'dark') => void;
  setKeyboardVisible: (visible: boolean) => void;
  setActiveScreen: (screen: string) => void;
  setShowIncomingCall: (show: boolean) => void;
  setShowActiveCall: (show: boolean) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}
