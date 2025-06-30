import { useState, useEffect, useCallback } from 'react';
import { useCallStore } from '../store/calls';
import { callManager } from '../lib/calls/manager';
import { useSocket } from './useSocket';
import { usePermissions } from './usePermissions';
import type { CallState, CallDirection } from '../lib/calls/types';

export const useCalls = () => {
  const {
    activeCall,
    callHistory,
    callState,
    isConnected,
    isMuted,
    isSpeakerOn,
    setActiveCall,
    setCallState,
    setMuted,
    setSpeakerOn,
    addToHistory,
    clearActiveCall,
  } = useCallStore();

  const { isConnected: socketConnected } = useSocket();
  const { checkPermission, requestPermission } = usePermissions();
  const [callTimer, setCallTimer] = useState(0);
  const [showKeypad, setShowKeypad] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeCall && callState === 'connected') {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - activeCall.startTime.getTime()) / 1000);
        setCallTimer(duration);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall, callState]);

  const makeCall = useCallback(async (phoneNumber: string) => {
    try {
      // Check microphone permission
      const hasPermission = await checkPermission('microphone');
      if (!hasPermission) {
        const granted = await requestPermission('microphone');
        if (!granted) {
          throw new Error('Microphone permission is required to make calls');
        }
      }

      if (!socketConnected) {
        throw new Error('No connection to calling service');
      }

      setCallState('dialing');
      const call = await callManager.makeCall(phoneNumber);
      setActiveCall(call);
      
      return call;
    } catch (error) {
      console.error('Failed to make call:', error);
      setCallState('idle');
      throw error;
    }
  }, [checkPermission, requestPermission, socketConnected, setCallState, setActiveCall]);

  const answerCall = useCallback(async (callSid: string) => {
    try {
      const hasPermission = await checkPermission('microphone');
      if (!hasPermission) {
        const granted = await requestPermission('microphone');
        if (!granted) {
          throw new Error('Microphone permission is required to answer calls');
        }
      }

      setCallState('connecting');
      const call = await callManager.answerCall(callSid);
      setActiveCall(call);
      
      return call;
    } catch (error) {
      console.error('Failed to answer call:', error);
      setCallState('idle');
      throw error;
    }
  }, [checkPermission, requestPermission, setCallState, setActiveCall]);

  const endCall = useCallback(async () => {
    try {
      if (activeCall) {
        await callManager.endCall(activeCall.callSid);
        addToHistory({
          ...activeCall,
          duration: callTimer,
          endTime: new Date(),
        });
      }
      
      clearActiveCall();
      setCallState('idle');
      setCallTimer(0);
      setShowKeypad(false);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }, [activeCall, callTimer, addToHistory, clearActiveCall, setCallState]);

  const rejectCall = useCallback(async (callSid: string) => {
    try {
      await callManager.rejectCall(callSid);
      setCallState('idle');
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  }, [setCallState]);

  const toggleMute = useCallback(async () => {
    try {
      const newMutedState = !isMuted;
      await callManager.setMuted(newMutedState);
      setMuted(newMutedState);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  }, [isMuted, setMuted]);

  const toggleSpeaker = useCallback(async () => {
    try {
      const newSpeakerState = !isSpeakerOn;
      await callManager.setSpeakerOn(newSpeakerState);
      setSpeakerOn(newSpeakerState);
    } catch (error) {
      console.error('Failed to toggle speaker:', error);
    }
  }, [isSpeakerOn, setSpeakerOn]);

  const sendDTMF = useCallback(async (digit: string) => {
    try {
      if (activeCall) {
        await callManager.sendDTMF(digit);
      }
    } catch (error) {
      console.error('Failed to send DTMF:', error);
    }
  }, [activeCall]);

  const toggleKeypad = useCallback(() => {
    setShowKeypad(!showKeypad);
  }, [showKeypad]);

  return {
    activeCall,
    callHistory,
    callState,
    isConnected,
    isMuted,
    isSpeakerOn,
    callTimer,
    showKeypad,
    makeCall,
    answerCall,
    endCall,
    rejectCall,
    toggleMute,
    toggleSpeaker,
    sendDTMF,
    toggleKeypad,
  };
};
