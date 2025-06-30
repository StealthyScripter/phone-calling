export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY: '/auth/verify',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    LOGOUT: '/auth/logout',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
  },

  // Contacts
  CONTACTS: {
    BASE: '/contacts',
    BY_ID: (id: string) => `/contacts/${id}`,
    TOGGLE_FAVORITE: (id: string) => `/contacts/${id}/toggle-favorite`,
    SEARCH: '/contacts/search',
    BY_PHONE: (phone: string) => `/contacts/phone/${phone}`,
    CALL_HISTORY: (id: string) => `/contacts/${id}/call-history`,
    CALL_STATS: (id: string) => `/contacts/${id}/call-stats`,
  },

  // User-specific endpoints
  USER_CONTACTS: {
    BASE: (userId: string) => `/users/${userId}/contacts`,
    SEARCH: (userId: string) => `/users/${userId}/contacts/search`,
    BY_PHONE: (userId: string, phone: string) => `/users/${userId}/contacts/phone/${phone}`,
  },

  // Calls
  CALLS: {
    MAKE: '/calls/make',
    HANGUP: (callSid: string) => `/calls/hangup/${callSid}`,
    ACCEPT: (callSid: string) => `/calls/accept/${callSid}`,
    REJECT: (callSid: string) => `/calls/reject/${callSid}`,
    ACTIVE: '/calls/active',
    PENDING: '/calls/pending',
    BY_SID: (callSid: string) => `/calls/${callSid}`,
  },

  // Call History
  CALL_HISTORY: {
    BASE: (userId: string) => `/users/${userId}/call-history`,
    STATS: (userId: string) => `/users/${userId}/call-stats`,
  },

  // System
  SYSTEM: {
    HEALTH: '/health',
    CONFIG: '/config',
  },

  // Webhooks
  WEBHOOKS: {
    HEALTH: '/webhooks/health',
    TWILIO: '/webhooks/twilio',
  },

  // Test Endpoints (Development only)
  TEST: {
    CREATE_SAMPLE_DATA: '/test/create-sample-data',
    RESET_DATABASE: '/test/reset-database',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  ERROR: 'error',

  // Call Events
  INCOMING_CALL: 'incomingCall',
  CALL_INITIATED: 'callInitiated',
  CALL_ACCEPTED: 'callAccepted',
  CALL_REJECTED: 'callRejected',
  CALL_ENDED: 'callEnded',
  CALL_STATUS_UPDATE: 'callStatusUpdate',

  // User Events
  USER_STATUS_CHANGE: 'userStatusChange',
  PRESENCE_UPDATE: 'presenceUpdate',

  // System Events
  SYSTEM_MAINTENANCE: 'systemMaintenance',
  FORCE_LOGOUT: 'forceLogout',
} as const;

// Call States
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

// Error Codes
export const ERROR_CODES = {
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation
  INVALID_PHONE_NUMBER: 'INVALID_PHONE_NUMBER',
  INVALID_EMAIL: 'INVALID_EMAIL',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  
  // Calls
  CALL_FAILED: 'CALL_FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  MICROPHONE_ACCESS_DENIED: 'MICROPHONE_ACCESS_DENIED',
  
  // General
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;