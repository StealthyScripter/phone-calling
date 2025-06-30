import { callsAPI } from '../api/calls';
import { socketManager } from './socket';
import { audioManager } from '../utils/audio';
import { notificationManager } from '../utils/notifications';
import type { Call, OutgoingCallData, CallStatus } from './types';

class CallManager {
  private activeCall: Call | null = null;
  private callState: CallStatus = 'idle';
  private isMuted = false;
  private isSpeakerOn = false;

  async initialize(): Promise<void> {
    try {
      await audioManager.initialize();
      socketManager.connect();
      this.setupSocketListeners();
    } catch (error) {
      console.error('Failed to initialize call manager:', error);
      throw error;
    }
  }

  private setupSocketListeners(): void {
    socketManager.onIncomingCall((data) => {
      this.handleIncomingCall(data);
    });

    socketManager.onCallStatusUpdate((data) => {
      this.handleCallStatusUpdate(data);
    });

    socketManager.onCallEnded((data) => {
      this.handleCallEnded(data);
    });
  }

  private async handleIncomingCall(data: any): Promise<void> {
    try {
      this.activeCall = {
        callSid: data.callSid,
        phoneNumber: data.from,
        contact: data.contact,
        direction: 'inbound',
        status: 'ringing',
        startTime: new Date(),
      };

      this.callState = 'ringing';
      
      // Show incoming call notification
      await notificationManager.showIncomingCall(data);
      
      // Play ringtone
      await audioManager.playRingtone();
    } catch (error) {
      console.error('Failed to handle incoming call:', error);
    }
  }

  private handleCallStatusUpdate(data: any): void {
    if (this.activeCall && this.activeCall.callSid === data.callSid) {
      this.callState = data.status;
      this.activeCall.status = data.status;
      
      if (data.status === 'connected') {
        audioManager.stopRingtone();
        audioManager.startCallAudio();
      }
    }
  }

  private async handleCallEnded(data: any): Promise<void> {
    if (this.activeCall && this.activeCall.callSid === data.callSid) {
      this.activeCall.endTime = new Date();
      this.activeCall.duration = data.duration;
      this.activeCall.status = 'ended';
      
      await this.cleanup();
    }
  }

  async makeCall(phoneNumber: string): Promise<Call> {
    try {
      if (this.activeCall) {
        throw new Error('Another call is already in progress');
      }

      const callData: OutgoingCallData = {
        to: phoneNumber,
      };

      const response = await callsAPI.makeCall(callData);
      
      this.activeCall = {
        callSid: response.callSid,
        phoneNumber: response.to,
        contact: response.contact,
        direction: 'outbound',
        status: 'dialing',
        startTime: new Date(),
      };

      this.callState = 'dialing';
      
      // Configure audio for outgoing call
      await audioManager.configureForCall({
        enableEchoCancellation: true,
        enableNoiseSuppression: true,
        enableAutoGainControl: true,
      });

      return this.activeCall;
    } catch (error) {
      console.error('Failed to make call:', error);
      this.callState = 'failed';
      throw error;
    }
  }

  async answerCall(callSid: string): Promise<Call> {
    try {
      if (!this.activeCall || this.activeCall.callSid !== callSid) {
        throw new Error('No matching incoming call found');
      }

      await callsAPI.acceptCall(callSid);
      
      this.activeCall.status = 'connecting';
      this.callState = 'connecting';
      
      // Configure audio for incoming call
      await audioManager.configureForCall({
        enableEchoCancellation: true,
        enableNoiseSuppression: true,
        enableAutoGainControl: true,
      });

      await audioManager.stopRingtone();
      
      return this.activeCall;
    } catch (error) {
      console.error('Failed to answer call:', error);
      throw error;
    }
  }

  async endCall(callSid: string): Promise<void> {
    try {
      await callsAPI.hangupCall(callSid);
      await this.cleanup();
    } catch (error) {
      console.error('Failed to end call:', error);
      await this.cleanup(); // Still cleanup local state
    }
  }

  async rejectCall(callSid: string): Promise<void> {
    try {
      await callsAPI.rejectCall(callSid);
      await this.cleanup();
    } catch (error) {
      console.error('Failed to reject call:', error);
      await this.cleanup(); // Still cleanup local state
    }
  }

  async setMuted(muted: boolean): Promise<void> {
    try {
      await audioManager.setMuted(muted);
      this.isMuted = muted;
    } catch (error) {
      console.error('Failed to set muted state:', error);
      throw error;
    }
  }

  async setSpeakerOn(speakerOn: boolean): Promise<void> {
    try {
      const route = speakerOn ? 'speaker' : 'earpiece';
      await audioManager.setAudioRoute(route);
      this.isSpeakerOn = speakerOn;
    } catch (error) {
      console.error('Failed to set speaker state:', error);
      throw error;
    }
  }

  async sendDTMF(digit: string): Promise<void> {
    try {
      if (!this.activeCall) {
        throw new Error('No active call to send DTMF');
      }

      // Note: DTMF implementation would depend on Twilio SDK
      // This is a placeholder for the actual implementation
      socketManager.emit('sendDTMF', {
        callSid: this.activeCall.callSid,
        digit,
      });
    } catch (error) {
      console.error('Failed to send DTMF:', error);
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      await audioManager.stopCallAudio();
      await audioManager.stopRingtone();
      
      this.activeCall = null;
      this.callState = 'idle';
      this.isMuted = false;
      this.isSpeakerOn = false;
    } catch (error) {
      console.error('Failed to cleanup call resources:', error);
    }
  }

  // Getters
  get currentCall(): Call | null {
    return this.activeCall;
  }

  get currentStatus(): CallStatus {
    return this.callState;
  }

  get muted(): boolean {
    return this.isMuted;
  }

  get speakerOn(): boolean {
    return this.isSpeakerOn;
  }
}

export const callManager = new CallManager();
