export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface Contact {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  email?: string;
  is_favorite: boolean;
}

export interface Call {
  callSid: string;
  status: string;
  to: string;
  from: string;
  duration?: number;
}

export interface CallStats {
  totalCalls: number;
  totalDuration: number;
  averageDuration: number;
}
