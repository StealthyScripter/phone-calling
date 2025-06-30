import * as Permissions from 'expo-permissions';
import { Platform, Alert, Linking } from 'react-native';

export type PermissionType = 'microphone' | 'camera' | 'contacts' | 'notifications' | 'phone';
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

class PermissionManager {
  async checkPermission(type: PermissionType): Promise<PermissionStatus> {
    try {
      let permissionType;
      
      switch (type) {
        case 'microphone':
          permissionType = Permissions.AUDIO_RECORDING;
          break;
        case 'camera':
          permissionType = Permissions.CAMERA;
          break;
        case 'contacts':
          permissionType = Permissions.CONTACTS;
          break;
        case 'notifications':
          permissionType = Permissions.NOTIFICATIONS;
          break;
        case 'phone':
          // Phone permission is platform-specific
          if (Platform.OS === 'ios') {
            return 'granted'; // iOS doesn't require explicit phone permission for VoIP
          }
          return 'granted'; // Placeholder for Android
        default:
          return 'undetermined';
      }

      const { status } = await Permissions.getAsync(permissionType);
      return this.mapPermissionStatus(status);
    } catch (error) {
      console.error(`Failed to check ${type} permission:`, error);
      return 'undetermined';
    }
  }

  async requestPermission(type: PermissionType): Promise<PermissionStatus> {
    try {
      let permissionType;
      
      switch (type) {
        case 'microphone':
          permissionType = Permissions.AUDIO_RECORDING;
          break;
        case 'camera':
          permissionType = Permissions.CAMERA;
          break;
        case 'contacts':
          permissionType = Permissions.CONTACTS;
          break;
        case 'notifications':
          permissionType = Permissions.NOTIFICATIONS;
          break;
        case 'phone':
          if (Platform.OS === 'ios') {
            return 'granted';
          }
          return 'granted'; // Placeholder for Android
        default:
          return 'denied';
      }

      const { status } = await Permissions.askAsync(permissionType);
      const permissionStatus = this.mapPermissionStatus(status);

      if (permissionStatus === 'denied') {
        this.showPermissionDeniedAlert(type);
      }

      return permissionStatus;
    } catch (error) {
      console.error(`Failed to request ${type} permission:`, error);
      return 'denied';
    }
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

  private showPermissionDeniedAlert(type: PermissionType) {
    const permissionNames = {
      microphone: 'Microphone',
      camera: 'Camera',
      contacts: 'Contacts',
      notifications: 'Notifications',
      phone: 'Phone',
    };

    const messages = {
      microphone: 'Microphone access is required to make and receive calls.',
      camera: 'Camera access is required for video calls.',
      contacts: 'Contact access is required to sync your contacts.',
      notifications: 'Notification access is required to alert you of incoming calls.',
      phone: 'Phone access is required for calling functionality.',
    };

    Alert.alert(
      `${permissionNames[type]} Permission Required`,
      `${messages[type]} Please enable it in your device settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }

  async requestMultiplePermissions(types: PermissionType[]): Promise<Record<PermissionType, PermissionStatus>> {
    const results: Record<string, PermissionStatus> = {};

    for (const type of types) {
      results[type] = await this.requestPermission(type);
    }

    return results as Record<PermissionType, PermissionStatus>;
  }

  async hasAllPermissions(types: PermissionType[]): Promise<boolean> {
    for (const type of types) {
      const status = await this.checkPermission(type);
      if (status !== 'granted') {
        return false;
      }
    }
    return true;
  }

  getPermissionMessage(type: PermissionType): string {
    const messages = {
      microphone: 'We need access to your microphone to make and receive calls.',
      camera: 'We need access to your camera for video calls.',
      contacts: 'We need access to your contacts to sync and manage your contact list.',
      notifications: 'We need to send you notifications for incoming calls and messages.',
      phone: 'We need phone access to handle calls properly.',
    };

    return messages[type];
  }
}

export const permissionManager = new PermissionManager();
