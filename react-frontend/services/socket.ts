import io, { Socket } from 'socket.io-client';

export type CallEventHandler = (data: any) => void;

export class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, CallEventHandler[]> = new Map();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    // Setup event listeners
    this.socket.on('incomingCall', (data: any) => {
      this.emit('incomingCall', data);
    });

    this.socket.on('callInitiated', (data: any) => {
      this.emit('callInitiated', data);
    });

    this.socket.on('callStatusUpdate', (data: any) => {
      this.emit('callStatusUpdate', data);
    });

    this.socket.on('callEnded', (data: any) => {
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

  on(event: string, handler: CallEventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  off(event: string, handler?: CallEventHandler): void {
    if (!handler) {
      this.listeners.delete(event);
      return;
    }

    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
export const socketService = new SocketService();
