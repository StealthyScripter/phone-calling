export interface Call {
  callSid: string;
  phoneNumber: string;
  contact?: Contact;
  direction: CallDirection;
  status: CallStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
}

export interface IncomingCallData {
  callSid: string;
  from: string;
  to: string;
  contact?: Contact;
}

export interface CallStatusUpdate {
  callSid: string;
  status: CallStatus;
  duration?: number;
  timestamp: string;
}

export interface OutgoingCallData {
  to: string;
  contact?: Contact;
}

export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 
  | 'idle'
  | 'dialing'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'hold'
  | 'muted'
  | 'ended'
  | 'failed'
  | 'busy'
  | 'missed'
  | 'no_answer';

export interface CallState {
  activeCall: Call | null;
  callHistory: Call[];
  currentStatus: CallStatus;
  isConnected: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isRecording: boolean;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  applicationSid: string;
  callerId: string;
}
