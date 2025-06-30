import React, { createContext, useContext, useEffect, useState } from 'react';
import { authStorage } from './storage';
import { authAPI } from '../api/auth';
import type { User, AuthState } from './types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await authStorage.getToken();
      
      if (token) {
        // Check if token is expired
        if (authStorage.isTokenExpired(token)) {
          await refreshToken();
        } else {
          const userData = await authAPI.verifyToken();
          setAuthState({
            user: userData,
            isAuthenticated: true,
            loading: false,
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      await logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const response = await authAPI.login({ email, password });
      await authStorage.saveTokens(response.token, response.refreshToken);
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const response = await authAPI.register(userData);
      await authStorage.saveTokens(response.token, response.refreshToken);
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // Call logout API (don't await as it might fail)
      authAPI.logout().catch(console.error);
      
      // Clear local storage
      await authStorage.clearTokens();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = await authStorage.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      const response = await authAPI.refreshToken(refreshTokenValue);
      await authStorage.saveTokens(response.token, response.refreshToken);
      
      // Verify the new token and get user data
      const userData = await authAPI.verifyToken();
      setAuthState({
        user: userData,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};