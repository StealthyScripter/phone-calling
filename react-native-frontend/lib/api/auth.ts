import { API_ENDPOINTS } from '../../constants/API';
import { apiClient } from './client';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User,
  ApiResponse 
} from './types';

class AuthAPI {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    return response.data.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    );
    return response.data.data;
  }

  async verifyToken(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_ENDPOINTS.AUTH.VERIFY
    );
    return response.data.data;
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const response = await apiClient.post<ApiResponse<{ token: string; refreshToken: string }>>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    return response.data.data;
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_ENDPOINTS.AUTH.PROFILE
    );
    return response.data.data;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      API_ENDPOINTS.AUTH.PROFILE,
      updates
    );
    return response.data.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      {
        currentPassword,
        newPassword,
      }
    );
  }

  async logout(): Promise<void> {
    await apiClient.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.LOGOUT);
  }
}

export const authAPI = new AuthAPI();
