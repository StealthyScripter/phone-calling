import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export type AudioRoute = 'earpiece' | 'speaker' | 'bluetooth' | 'headphones';

export interface AudioConfig {
  enableEchoCancellation?: boolean;
  enableNoiseSuppression?: boolean;
  enableAutoGainControl?: boolean;
  sampleRate?: number;
  bitRate?: number;
}

class AudioManager {
  private isInitialized = false;
  private ringtoneSound: Audio.Sound | null = null;
  private currentRoute: AudioRoute = 'earpiece';

  async initialize(): Promise<void> {
    try {
      await Audio.requestPermissionsAsync();
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: true,
        staysActiveInBackground: true,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  async configureForCall(config: AudioConfig): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: this.currentRoute === 'earpiece',
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.error('Failed to configure audio for call:', error);
      throw error;
    }
  }

  async startCallAudio(): Promise<void> {
    try {
      await this.stopRingtone();
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: this.currentRoute === 'earpiece',
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.error('Failed to start call audio:', error);
      throw error;
    }
  }

  async stopCallAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error('Failed to stop call audio:', error);
    }
  }

  async playRingtone(): Promise<void> {
    try {
      if (this.ringtoneSound) {
        await this.ringtoneSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/ringtone.mp3'),
        { shouldPlay: true, isLooping: true }
      );

      this.ringtoneSound = sound;
    } catch (error) {
      console.error('Failed to play ringtone:', error);
    }
  }

  async stopRingtone(): Promise<void> {
    try {
      if (this.ringtoneSound) {
        await this.ringtoneSound.stopAsync();
        await this.ringtoneSound.unloadAsync();
        this.ringtoneSound = null;
      }
    } catch (error) {
      console.error('Failed to stop ringtone:', error);
    }
  }

  async setAudioRoute(route: AudioRoute): Promise<void> {
    try {
      this.currentRoute = route;
      
      if (Platform.OS === 'ios') {
        // iOS audio route configuration
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: route === 'earpiece',
          staysActiveInBackground: true,
        });
      } else {
        // Android audio route configuration
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: route === 'earpiece',
          staysActiveInBackground: true,
        });
      }
    } catch (error) {
      console.error('Failed to set audio route:', error);
      throw error;
    }
  }

  async setMuted(muted: boolean): Promise<void> {
    try {
      // Note: Actual muting would be handled by the call SDK (Twilio)
      // This is a placeholder for the interface
      console.log('Set muted:', muted);
    } catch (error) {
      console.error('Failed to set muted state:', error);
      throw error;
    }
  }

  async getCurrentRoute(): Promise<AudioRoute> {
    return this.currentRoute;
  }

  async getAvailableRoutes(): Promise<AudioRoute[]> {
    // This would typically query the system for available audio routes
    const routes: AudioRoute[] = ['earpiece', 'speaker'];
    
    // Add additional routes based on what's available
    // This is simplified - actual implementation would detect connected devices
    return routes;
  }

  cleanup(): void {
    if (this.ringtoneSound) {
      this.ringtoneSound.unloadAsync().catch(console.error);
      this.ringtoneSound = null;
    }
  }
}

export const audioManager = new AudioManager();
