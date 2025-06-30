import { API_ENDPOINTS } from '../../constants/API';
import { apiClient } from './client';
import type { User, ApiResponse } from './types';

class UsersAPI {
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>(
      API_ENDPOINTS.USERS.BASE
    );
    return response.data.data;
  }

  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_ENDPOINTS.USERS.BY_ID(id)
    );
    return response.data.data;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      API_ENDPOINTS.USERS.BASE,
      userData
    );
    return response.data.data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      API_ENDPOINTS.USERS.BY_ID(id),
      updates
    );
    return response.data.data;
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.USERS.BY_ID(id)
    );
  }

  async getCurrentUserProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_ENDPOINTS.USERS.PROFILE
    );
    return response.data.data;
  }
}

export const usersAPI = new UsersAPI();