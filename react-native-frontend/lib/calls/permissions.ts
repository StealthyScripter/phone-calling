import * as Permissions from 'expo-permissions';
import { Platform } from 'react-native';

export type CallPermission = 'microphone' | 'camera' | 'phone';
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

class CallPermissions {
  async checkMicrophonePermission(): Promise<PermissionStatus> {
    try {
      const { status } = await Permissions.getAsync(Permissions.AUDIO_RECORDING);
      return this.mapPermissionStatus(status);
    } catch (error) {
      console.error('Failed to check microphone permission:', error);
      return 'undetermined';
    }
  }

  async requestMicrophonePermission(): Promise<PermissionStatus> {
    try {
      const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
      return this.mapPermissionStatus(status);
    } catch (error) {
      console.error('Failed to request microphone permission:', error);
      return 'denied';
    }
  }

  async checkCameraPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await Permissions.getAsync(Permissions.CAMERA);
      return this.mapPermissionStatus(status);
    } catch (error) {
      console.error('Failed to check camera permission:', error);
      return 'undetermined';
    }
  }

  async requestCameraPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await Permissions.askAsync(Permissions.CAMERA);
      return this.mapPermissionStatus(status);
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      return 'denied';
    }
  }

  async checkPhonePermission(): Promise<PermissionStatus> {
    if (Platform.OS === 'ios') {
      // iOS doesn't require explicit phone permission for VoIP calls
      return 'granted';
    }

    try {
      // For Android, you might need to check CALL_PHONE permission
      // This would depend on your specific implementation
      return 'granted'; // Placeholder
    } catch (error) {
      console.error('Failed to check phone permission:', error);
      return 'undetermined';
    }
  }

  async requestPhonePermission(): Promise<PermissionStatus> {
    if (Platform.OS === 'ios') {
      return 'granted';
    }

    try {
      // Android phone permission request would go here
      return 'granted'; // Placeholder
    } catch (error) {
      console.error('Failed to request phone permission:', error);
      return 'denied';
    }
  }

  async checkAllCallPermissions(): Promise<Record<CallPermission, PermissionStatus>> {
    const [microphone, camera, phone] = await Promise.all([
      this.checkMicrophonePermission(),
      this.checkCameraPermission(),
      this.checkPhonePermission(),
    ]);

    return { microphone, camera, phone };
  }

  async requestAllCallPermissions(): Promise<Record<CallPermission, PermissionStatus>> {
    const [microphone, camera, phone] = await Promise.all([
      this.requestMicrophonePermission(),
      this.requestCameraPermission(),
      this.requestPhonePermission(),
    ]);

    return { microphone, camera, phone };
  }

  private mapPermissionStatus(status: string): PermissionStatus {
    switch (status) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      default:
        return 'undetermined';
    }
  }

  async hasRequiredPermissions(): Promise<boolean> {
    const permissions = await this.checkAllCallPermissions();
    return permissions.microphone === 'granted' && permissions.phone === 'granted';
  }

  async requestRequiredPermissions(): Promise<boolean> {
    const permissions = await this.requestAllCallPermissions();
    return permissions.microphone === 'granted' && permissions.phone === 'granted';
  }
}

export const callPermissions = new CallPermissions();