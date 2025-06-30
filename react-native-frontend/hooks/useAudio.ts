import { useState, useEffect, useCallback } from 'react';
import { audioManager } from '../lib/utils/audio';
import type { AudioRoute, AudioConfig } from '../lib/utils/audio';

export const useAudio = () => {
  const [currentRoute, setCurrentRoute] = useState<AudioRoute>('earpiece');
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<AudioRoute[]>([]);

  useEffect(() => {
    initializeAudio();
    return () => {
      cleanup();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      await audioManager.initialize();
      const routes = await audioManager.getAvailableRoutes();
      const current = await audioManager.getCurrentRoute();
      
      setAvailableRoutes(routes);
      setCurrentRoute(current);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const setAudioRoute = useCallback(async (route: AudioRoute) => {
    try {
      await audioManager.setAudioRoute(route);
      setCurrentRoute(route);
    } catch (error) {
      console.error('Failed to set audio route:', error);
      throw error;
    }
  }, []);

  const configureForCall = useCallback(async (config: AudioConfig) => {
    try {
      await audioManager.configureForCall(config);
    } catch (error) {
      console.error('Failed to configure audio for call:', error);
      throw error;
    }
  }, []);

  const startCallAudio = useCallback(async () => {
    try {
      await audioManager.startCallAudio();
    } catch (error) {
      console.error('Failed to start call audio:', error);
      throw error;
    }
  }, []);

  const stopCallAudio = useCallback(async () => {
    try {
      await audioManager.stopCallAudio();
    } catch (error) {
      console.error('Failed to stop call audio:', error);
      throw error;
    }
  }, []);

  const setMuted = useCallback(async (muted: boolean) => {
    try {
      await audioManager.setMuted(muted);
    } catch (error) {
      console.error('Failed to set muted state:', error);
      throw error;
    }
  }, []);

  const cleanup = useCallback(() => {
    audioManager.cleanup();
  }, []);

  return {
    currentRoute,
    availableRoutes,
    isInitialized,
    setAudioRoute,
    configureForCall,
    startCallAudio,
    stopCallAudio,
    setMuted,
  };
};