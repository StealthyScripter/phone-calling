export const Config = {
  // App Information
  app: {
    name: 'SmartConnect',
    version: '1.0.0',
    bundleId: 'com.smartconnect.app',
  },

  // API Configuration
  api: {
    baseUrl: __DEV__ 
      ? 'http://localhost:3000/api' 
      : 'https://api.smartconnect.app/api',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // WebSocket Configuration
  websocket: {
    url: __DEV__ 
      ? 'ws://localhost:3000' 
      : 'wss://api.smartconnect.app',
    reconnectAttempts: 5,
    reconnectDelay: 2000,
  },

  // Authentication
  auth: {
    tokenKey: 'smartconnect_token',
    refreshTokenKey: 'smartconnect_refresh_token',
    biometricKey: 'smartconnect_biometric',
    tokenExpiryBuffer: 300000, // 5 minutes in milliseconds
  },

  // Call Configuration
  calls: {
    maxDuration: 3600, // 1 hour in seconds
    recordingEnabled: false,
    videoCallEnabled: false,
    conferenceCallEnabled: false,
    supportedCountries: ['+1', '+44', '+33', '+49', '+81', '+86'],
  },

  // Storage Keys
  storage: {
    contacts: 'smartconnect_contacts',
    callHistory: 'smartconnect_call_history',
    userPreferences: 'smartconnect_preferences',
    onboardingComplete: 'smartconnect_onboarding',
  },

  // Feature Flags
  features: {
    biometricAuth: true,
    pushNotifications: true,
    callRecording: false,
    videoCall: false,
    conferenceCall: false,
    contactSync: true,
    analytics: true,
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // Validation
  validation: {
    minPasswordLength: 8,
    maxPasswordLength: 128,
    minUsernameLength: 3,
    maxUsernameLength: 30,
    phoneNumberRegex: /^\+?[1-9]\d{1,14}$/,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  // Audio Settings
  audio: {
    enableEchoCancellation: true,
    enableNoiseSuppression: true,
    enableAutoGainControl: true,
    sampleRate: 44100,
    bitRate: 128000,
  },

  // UI Settings
  ui: {
    animationDuration: 300,
    toastDuration: 3000,
    debounceDelay: 300,
    longPressDuration: 500,
  },

  // Security
  security: {
    certificatePinning: !__DEV__,
    requireBiometricReauth: 300000, // 5 minutes
    sessionTimeout: 1800000, // 30 minutes
  },
} as const;
