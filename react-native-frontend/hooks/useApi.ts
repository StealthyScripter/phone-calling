import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { useAuth } from './useAuth';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showLoading?: boolean;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshToken } = useAuth();

  const makeRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    options: UseApiOptions = {}
  ): Promise<T | null> => {
    try {
      if (options.showLoading !== false) {
        setLoading(true);
      }
      setError(null);

      const response = await requestFn();
      
      if (options.onSuccess) {
        options.onSuccess(response);
      }
      
      return response;
    } catch (err: any) {
      console.error('API request failed:', err);
      
      // Handle token expiration
      if (err.status === 401 && err.code === 'TOKEN_EXPIRED') {
        try {
          await refreshToken();
          // Retry the request
          return await requestFn();
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(err);
      }
      
      return null;
    } finally {
      if (options.showLoading !== false) {
        setLoading(false);
      }
    }
  }, [refreshToken]);

  const get = useCallback(<T>(url: string, options?: UseApiOptions) => {
    return makeRequest<T>(() => apiClient.get<T>(url).then(res => res.data), options);
  }, [makeRequest]);

  const post = useCallback(<T>(url: string, data?: any, options?: UseApiOptions) => {
    return makeRequest<T>(() => apiClient.post<T>(url, data).then(res => res.data), options);
  }, [makeRequest]);

  const put = useCallback(<T>(url: string, data?: any, options?: UseApiOptions) => {
    return makeRequest<T>(() => apiClient.put<T>(url, data).then(res => res.data), options);
  }, [makeRequest]);

  const del = useCallback(<T>(url: string, options?: UseApiOptions) => {
    return makeRequest<T>(() => apiClient.delete<T>(url).then(res => res.data), options);
  }, [makeRequest]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    clearError,
    makeRequest,
  };
};
