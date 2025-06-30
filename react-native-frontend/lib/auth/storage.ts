import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Config } from '../../constants/Config';

class AuthStorage {
  private readonly TOKEN_KEY = Config.auth.tokenKey;
  private readonly REFRESH_TOKEN_KEY = Config.auth.refreshTokenKey;
  private readonly BIOMETRIC_KEY = Config.auth.biometricKey;

  async saveTokens(token: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(this.TOKEN_KEY, token),
        SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, refreshToken),
      ]);
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(this.TOKEN_KEY),
        SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.BIOMETRIC_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      return false;
    }
  }

  async enableBiometric(): Promise<boolean> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        await SecureStore.setItemAsync(this.BIOMETRIC_KEY, 'enabled');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      return false;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const status = await SecureStore.getItemAsync(this.BIOMETRIC_KEY);
      return status === 'enabled';
    } catch (error) {
      console.error('Failed to check biometric status:', error);
      return false;
    }
  }

  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign in',
        cancelLabel: 'Use password instead',
        disableDeviceFallback: true,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_KEY);
    } catch (error) {
      console.error('Failed to disable biometric:', error);
    }
  }

  // Utility method to check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = Config.auth.tokenExpiryBuffer; // 5 minutes buffer
      
      return currentTime >= (expirationTime - bufferTime);
    } catch (error) {
      console.error('Failed to parse token:', error);
      return true; // Assume expired if we can't parse
    }
  }

  // Get user info from token
  getUserFromToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user || payload;
    } catch (error) {
      console.error('Failed to extract user from token:', error);
      return null;
    }
  }
}

export const authStorage = new AuthStorage();
