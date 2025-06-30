export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

// Contact Types
export interface Contact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
  isFavorite: boolean;
  formattedPhone: string;
  createdAt: string;
  avatar?: string;
}

export interface ContactCreateRequest {
  name: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
}

// Call Types
export interface CallRequest {
  to: string;
  from?: string;
}

export interface CallResponse {
  callSid: string;
  status: CallStatus;
  to: string;
  from: string;
  contact?: Contact;
  userId: string;
  direction: CallDirection;
  startedAt: string;
}

export interface CallHistoryItem {
  id: string;
  callSid: string;
  direction: CallDirection;
  phoneNumber: string;
  contactName?: string;
  status: CallStatus;
  duration: number;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
}

export interface CallStats {
  totalCalls: number;
  totalDuration: number;
  averageDuration: number;
  inboundCalls: number;
  outboundCalls: number;
  missedCalls: number;
  completedCalls: number;
}

export type CallStatus = 'calling' | 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'missed';
export type CallDirection = 'inbound' | 'outbound';
