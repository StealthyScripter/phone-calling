export interface ApiRequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  timestamp: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  password: string;
  agreeToTerms: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatar?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    calls: boolean;
    marketing: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowContactSync: boolean;
    shareUsageData: boolean;
  };
  audio: {
    ringtone: string;
    volume: number;
    vibration: boolean;
  };
}

// Contact API types
export interface ContactRequest {
  name: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
  tags?: string[];
}

export interface ContactResponse {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  formattedPhoneNumber: string;
  email?: string;
  notes?: string;
  tags: string[];
  avatar?: string;
  isFavorite: boolean;
  isBlocked: boolean;
  contactFrequency: number;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
  callStats: {
    totalCalls: number;
    totalDuration: number;
    lastCallAt?: string;
  };
}

// Call API types
export interface CallRequest {
  to: string;
  from?: string;
  recordCall?: boolean;
  metadata?: Record<string, any>;
}

export interface CallResponse {
  callSid: string;
  status: CallStatus;
  direction: CallDirection;
  from: string;
  to: string;
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
  duration?: number;
  recordingUrl?: string;
  cost?: number;
  contact?: ContactResponse;
  metadata?: Record<string, any>;
}

export interface CallHistoryResponse {
  id: string;
  callSid: string;
  direction: CallDirection;
  from: string;
  to: string;
  contactName?: string;
  contactAvatar?: string;
  status: CallStatus;
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
  duration: number;
  recordingUrl?: string;
  cost?: number;
  notes?: string;
  tags: string[];
}

export interface CallStatsResponse {
  totalCalls: number;
  totalDuration: number;
  averageDuration: number;
  callsByDirection: {
    inbound: number;
    outbound: number;
  };
  callsByStatus: {
    completed: number;
    missed: number;
    failed: number;
    busy: number;
  };
  callsByTimeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  callTrends: {
    daily: Array<{ date: string; count: number; duration: number }>;
    weekly: Array<{ week: string; count: number; duration: number }>;
    monthly: Array<{ month: string; count: number; duration: number }>;
  };
}

export type CallStatus = 
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'failed'
  | 'no-answer'
  | 'canceled';

export type CallDirection = 'inbound' | 'outbound';

// WebSocket types
export interface SocketMessage<T = any> {
  event: string;
  data: T;
  timestamp: number;
  id?: string;
}

export interface IncomingCallEvent {
  callSid: string;
  from: string;
  to: string;
  contact?: ContactResponse;
  timestamp: string;
}

export interface CallStatusEvent {
  callSid: string;
  status: CallStatus;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserPresenceEvent {
  userId: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  lastSeen?: string;
}
