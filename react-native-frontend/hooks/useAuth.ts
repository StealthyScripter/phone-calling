import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { authAPI } from '../lib/api/auth';
import { authStorage } from '../lib/auth/storage';
import type { LoginCredentials, RegisterData, User } from '../lib/auth/types';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    loading,
    setUser,
    setAuthenticated,
    setLoading,
    clearAuth,
  } = useAuthStore();

  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    initializeAuth();
    checkBiometricAvailability();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const token = await authStorage.getToken();
      
      if (token) {
        const userData = await authAPI.verifyToken();
        setUser(userData);
        setAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const available = await authStorage.isBiometricAvailable();
      setBiometricAvailable(available);
    } catch (error) {
      setBiometricAvailable(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      await authStorage.saveTokens(response.token, response.refreshToken);
      setUser(response.user);
      setAuthenticated(true);
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      
      await authStorage.saveTokens(response.token, response.refreshToken);
      setUser(response.user);
      setAuthenticated(true);
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await authStorage.clearTokens();
      clearAuth();
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');
      
      const response = await authAPI.refreshToken(refreshToken);
      await authStorage.saveTokens(response.token, response.refreshToken);
      
      return response.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setLoading(true);
      const updatedUser = await authAPI.updateProfile(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      await authAPI.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithBiometric = async () => {
    try {
      setLoading(true);
      const success = await authStorage.authenticateWithBiometric();
      
      if (success) {
        const token = await authStorage.getToken();
        if (token) {
          const userData = await authAPI.verifyToken();
          setUser(userData);
          setAuthenticated(true);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Biometric login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    biometricAvailable,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    loginWithBiometric,
  };
};
