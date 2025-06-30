import io, { Socket } from 'socket.io-client';
import { Config } from '../../constants/Config';
import { SOCKET_EVENTS } from '../../constants/API';
import { authStorage } from '../auth/storage';
import type { IncomingCallData, CallStatusUpdate } from './types';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Config.websocket.reconnectAttempts;
  private reconnectDelay = Config.websocket.reconnectDelay;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(Config.websocket.url, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();
    this.authenticate();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const token = await authStorage.getToken();
      if (token && this.socket) {
        // Fixed: Replace optional chaining assignment with explicit check
        this.socket.auth = { token };
        this.socket.connect();
      }
    } catch (error) {
      console.error('Socket authentication failed:', error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on(SOCKET_EVENTS.RECONNECT, (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('Socket error:', error);
    });
  }

  emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }

  // Call-specific methods
  onIncomingCall(callback: (data: IncomingCallData) => void): void {
    this.on(SOCKET_EVENTS.INCOMING_CALL, callback);
  }

  onCallStatusUpdate(callback: (data: CallStatusUpdate) => void): void {
    this.on(SOCKET_EVENTS.CALL_STATUS_UPDATE, callback);
  }

  onCallEnded(callback: (data: CallStatusUpdate) => void): void {
    this.on(SOCKET_EVENTS.CALL_ENDED, callback);
  }
}

export const socketManager = new SocketManager();