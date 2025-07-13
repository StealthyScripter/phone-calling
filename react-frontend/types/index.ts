export interface User {
  id: number | string;
  name: string; // Required field from backend schema
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string; // Legacy field
  role?: string;
  isActive?: boolean;
  lastLogin?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string;
  avatar_url?: string;
  preferences?: any;
}

export interface Contact {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  email?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: number;
  call_sid: string;
  user_id: number | string;
  direction: 'incoming' | 'outgoing';
  from_number: string;
  to_number: string;
  contact_name?: string;
  phone_number: string;
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer' | 'canceled' | 'missed' | 'initiating';
  duration?: number;
  start_time: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

export interface CallHistory {
  id: number;
  call_sid: string;
  user_id: number;
  contact_name: string;
  phone_number: string;
  direction: 'incoming' | 'outgoing';
  status: 'completed' | 'missed' | 'failed';
  duration: number;
  created_at: string;
  location?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CallApiResponse {
  success: boolean;
  callSid?: string;
  status?: string;
  to?: string;
  from?: string;
  message?: string;
  error?: string;
}

export interface SocketEvents {
  connect: () => void;
  disconnect: () => void;
  incomingCall: (data: Call) => void;
  callInitiated: (data: Call) => void;
  callStatusUpdate: (data: { callSid: string; status: string; duration?: number }) => void;
  callEnded: (data: { callSid: string; duration?: number }) => void;
  callAccepted: (data: { callSid: string; duration?: number }) => void; 
  callRejected: (data: { callSid: string; duration?: number }) => void; 
  error: (data: { message: string }) => void;
}

export type NavigationParamList = {
  Main: undefined;
  Dialer: undefined;
  Recent: undefined;
  Contacts: undefined;
  Settings: undefined;
  Profile: undefined;
  ContactDetail: { contact: Contact };
  AddContact: { phoneNumber?: string };
  ActiveCall: { call: Call };
  IncomingCall: { call: Call };
  Login: undefined;
  Register: undefined;
};

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, name?: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface AvatarProps {
  name: string;
  size?: number;
}

export interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}