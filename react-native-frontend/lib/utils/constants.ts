export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CALL_STATES = {
  IDLE: 'idle',
  DIALING: 'dialing',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  HOLD: 'hold',
  MUTED: 'muted',
  ENDED: 'ended',
  FAILED: 'failed',
  BUSY: 'busy',
  NO_ANSWER: 'no_answer',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'smartconnect_token',
  REFRESH_TOKEN: 'smartconnect_refresh_token',
  USER_PREFERENCES: 'smartconnect_preferences',
  CONTACTS: 'smartconnect_contacts',
  CALL_HISTORY: 'smartconnect_call_history',
  ONBOARDING_COMPLETE: 'smartconnect_onboarding',
} as const;

export const API_TIMEOUTS = {
  DEFAULT: 10000,
  UPLOAD: 30000,
  DOWNLOAD: 30000,
} as const;

export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  INPUT: 500,
  API_CALL: 1000,
} as const;