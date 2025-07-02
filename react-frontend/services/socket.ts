import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '../types';

const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.emit('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      this.emit('disconnect');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    // Call-related events
    this.socket.on('incomingCall', (data) => {
      console.log('Incoming call:', data);
      this.emit('incomingCall', data);
    });

    this.socket.on('callInitiated', (data) => {
      console.log('Call initiated:', data);
      this.emit('callInitiated', data);
    });

    this.socket.on('callStatusUpdate', (data) => {
      console.log('Call status update:', data);
      this.emit('callStatusUpdate', data);
    });

    this.socket.on('callEnded', (data) => {
      console.log('Call ended:', data);
      this.emit('callEnded', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    if (!this.listeners.has(event)) {
      return;
    }

    const callbacks = this.listeners.get(event)!;
    if (callback) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.set(event, []);
    }
  }

  private emit(event: string, data?: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods for sending events
  joinUserRoom(userId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('joinUserRoom', { userId });
    }
  }

  leaveUserRoom(userId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveUserRoom', { userId });
    }
  }
}

export const socketService = new SocketService();