import { useState, useEffect, useCallback, useRef } from 'react';
import { useCallStore } from '../store/calls';
import { socketManager } from '../lib/calls/socket';
import { SOCKET_EVENTS } from '../constants/API';
import type { IncomingCallData, CallStatusUpdate } from '../lib/calls/types';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { setActiveCall, setCallState, clearActiveCall } = useCallStore();
  const socketRef = useRef(socketManager);

  useEffect(() => {
    const socket = socketRef.current;

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionAttempts(0);
      console.log('Socket connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    };

    const handleReconnect = (attemptNumber: number) => {
      setConnectionAttempts(attemptNumber);
      console.log('Socket reconnection attempt:', attemptNumber);
    };

    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('Incoming call:', data);
      setActiveCall({
        callSid: data.callSid,
        phoneNumber: data.from,
        direction: 'inbound',
        status: 'ringing',
        startTime: new Date(),
        contact: data.contact,
      });
      setCallState('ringing');
    };

    const handleCallAccepted = (data: CallStatusUpdate) => {
      console.log('Call accepted:', data);
      setCallState('connected');
    };

    const handleCallRejected = (data: CallStatusUpdate) => {
      console.log('Call rejected:', data);
      clearActiveCall();
      setCallState('idle');
    };

    const handleCallEnded = (data: CallStatusUpdate) => {
      console.log('Call ended:', data);
      clearActiveCall();
      setCallState('idle');
    };

    const handleCallStatusUpdate = (data: CallStatusUpdate) => {
      console.log('Call status update:', data);
      setCallState(data.status as any);
    };

    // Register event listeners
    socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
    socket.on(SOCKET_EVENTS.RECONNECT, handleReconnect);
    socket.on(SOCKET_EVENTS.INCOMING_CALL, handleIncomingCall);
    socket.on(SOCKET_EVENTS.CALL_ACCEPTED, handleCallAccepted);
    socket.on(SOCKET_EVENTS.CALL_REJECTED, handleCallRejected);
    socket.on(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);
    socket.on(SOCKET_EVENTS.CALL_STATUS_UPDATE, handleCallStatusUpdate);

    // Connect socket
    socket.connect();

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      socket.off(SOCKET_EVENTS.RECONNECT, handleReconnect);
      socket.off(SOCKET_EVENTS.INCOMING_CALL, handleIncomingCall);
      socket.off(SOCKET_EVENTS.CALL_ACCEPTED, handleCallAccepted);
      socket.off(SOCKET_EVENTS.CALL_REJECTED, handleCallRejected);
      socket.off(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);
      socket.off(SOCKET_EVENTS.CALL_STATUS_UPDATE, handleCallStatusUpdate);
      socket.disconnect();
    };
  }, [setActiveCall, setCallState, clearActiveCall]);

  const emit = useCallback((event: string, data?: any) => {
    const socket = socketRef.current;
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }, [isConnected]);

  return {
    isConnected,
    connectionAttempts,
    emit,
  };
};

