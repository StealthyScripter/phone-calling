import { Contact, CallHistory, CallApiResponse, User } from '../types';

// Use environment variable or fallback to localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiError extends Error {
  status?: number;
  code?: string;
}

interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiServiceClass {
  private authToken: string | null = null;
  private currentUser: User | null = null;

  // Set authentication token
  setAuthToken(token: string | null): void {
    this.authToken = token;
    console.log('🔑 Auth token set:', token ? 'YES' : 'NO');
    console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'NULL');
  }

  // Set current user
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    console.log('👤 Current user set:', user ? user.name || user.email : 'NULL');
  }

  // Get current user
  getCurrentUserData(): User | null {
    return this.currentUser;
  }

  // Get auth headers
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Main request method with comprehensive error handling
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const url = `${API_BASE_URL}${endpoint}`;

    // Debug logging
    console.log('📡 API Request:', {
      url,
      method: options?.method || 'GET',
      hasAuthToken: !!this.authToken,
      hasBody: !!options?.body
    });

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);

      // Handle different HTTP status codes
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Try to get error details from response
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If we can't parse the error response, keep the original error
        }
        
        const error = new Error(errorMessage) as ApiError;
        error.status = response.status;
        
        console.error('📡 API Error:', {
          status: response.status,
          message: errorMessage,
          endpoint
        });
        
        throw error;
      }

      const data = await response.json();
      console.log('📡 Response success:', { endpoint, dataKeys: Object.keys(data) });
      return data;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      
      if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
        throw new Error('Network error - please check your internet connection');
      }
      
      // Re-throw with more context
      console.error(`📡 API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ===================================
  // AUTHENTICATION METHODS
  // ===================================

  async register(userData: {
    email: string;
    username: string;
    password: string;
    name: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success && response.token) {
        this.setAuthToken(response.token);
        this.setCurrentUser(response.user);
      }

      return response;
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  async login(credentials: {
    emailOrUsername: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.token) {
        this.setAuthToken(response.token);
        this.setCurrentUser(response.user);
      }

      return response;
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  async logout(): Promise<void> {
    this.setAuthToken(null);
    this.setCurrentUser(null);
    console.log('👋 User logged out');
  }

  async verifyToken(): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await this.request<{ success: boolean; valid: boolean; user: User }>('/auth/verify');
      
      if (response.success && response.valid && response.user) {
        this.setCurrentUser(response.user);
        return { valid: true, user: response.user };
      }
      
      return { valid: false };
    } catch (error) {
      console.warn('Token verification failed:', error);
      this.setAuthToken(null);
      this.setCurrentUser(null);
      return { valid: false };
    }
  }

  async refreshToken(): Promise<{ success: boolean; token?: string }> {
    try {
      const response = await this.request<{ success: boolean; token: string; user: User }>('/auth/refresh');
      
      if (response.success && response.token) {
        this.setAuthToken(response.token);
        this.setCurrentUser(response.user);
        return { success: true, token: response.token };
      }
      
      return { success: false };
    } catch (error) {
      console.warn('Token refresh failed:', error);
      return { success: false };
    }
  }

  // Get current authenticated user's profile
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.request<{ user: User; success: boolean }>('/auth/profile');
      
      if (response.success && response.user) {
        this.setCurrentUser(response.user);
        return response.user;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get current user:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    name?: string;
  }): Promise<User | null> {
    try {
      const response = await this.request<{ user: User; success: boolean }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      if (response.success && response.user) {
        this.setCurrentUser(response.user);
        return response.user;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error; // Re-throw for profile updates
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.request<{ success: boolean; message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
      });
      
      return response;
    } catch (error: any) {
      console.error('Failed to change password:', error);
      throw new Error(error.message || 'Failed to change password');
    }
  }

  // ===================================
  // USER METHODS (Legacy - for backward compatibility)
  // ===================================

  async getUsers(): Promise<User[]> {
    try {
      const response = await this.request<{ users: User[]; success: boolean }>('/users');
      return Array.isArray(response.users) ? response.users : [];
    } catch (error: any) {
      console.warn('Failed to fetch users:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async createUser(userData: Partial<User>): Promise<User | null> {
    try {
      const response = await this.request<{ user: User; success: boolean }>('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response.user || null;
    } catch (error) {
      console.warn('Failed to create user:', error);
      return null;
    }
  }

  // ===================================
  // CONTACT METHODS
  // ===================================

  async getContacts(userId?: string | number): Promise<Contact[]> {
    try {
      // If no userId provided, get contacts for current user
      if (!userId && this.currentUser) {
        userId = this.currentUser.id;
      }

      if (!userId) {
        console.warn('No user ID provided for contacts');
        return [];
      }

      const response = await this.request<{ contacts: Contact[]; success: boolean }>(`/users/${userId}/contacts`);
      return Array.isArray(response.contacts) ? response.contacts : [];
    } catch (error: any) {
      console.warn(`Failed to fetch contacts for user ${userId}:`, error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get contacts for current authenticated user
  async getCurrentUserContacts(): Promise<Contact[]> {
    try {
      if (!this.currentUser) {
        console.warn('No current user for contacts');
        return [];
      }
      
      return await this.getContacts(this.currentUser.id);
    } catch (error: any) {
      console.warn('Failed to fetch current user contacts:', error);
      return [];
    }
  }

  async createContact(contactData: {
    user_id?: string | number;
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    is_favorite?: boolean;
  }): Promise<Contact | null> {
    try {
      // Use current user if no user_id provided
      if (!contactData.user_id && this.currentUser) {
        contactData.user_id = this.currentUser.id;
      }

      const response = await this.request<{ contact: Contact; success: boolean }>('/contacts', {
        method: 'POST',
        body: JSON.stringify(contactData),
      });
      return response.contact || null;
    } catch (error) {
      console.warn('Failed to create contact:', error);
      return null;
    }
  }

  async updateContact(contactId: string | number, contactData: Partial<Contact>): Promise<Contact | null> {
    try {
      const response = await this.request<{ contact: Contact; success: boolean }>(`/contacts/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify(contactData),
      });
      return response.contact || null;
    } catch (error) {
      console.warn('Failed to update contact:', error);
      return null;
    }
  }

  async deleteContact(contactId: string | number): Promise<boolean> {
    try {
      await this.request(`/contacts/${contactId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.warn('Failed to delete contact:', error);
      return false;
    }
  }

  async toggleFavorite(contactId: string | number): Promise<Contact | null> {
    try {
      const response = await this.request<{ contact: Contact; success: boolean }>(`/contacts/${contactId}/toggle-favorite`, {
        method: 'POST',
      });
      return response.contact || null;
    } catch (error) {
      console.warn('Failed to toggle favorite:', error);
      return null;
    }
  }

  // ===================================
  // CALL METHODS
  // ===================================

  // Make call using current authenticated user
  async makeCall(phoneNumber: string, userId?: string | number, contactName?: string): Promise<CallApiResponse> {
    try {
      if (!phoneNumber?.trim()) {
        throw new Error('Phone number is required');
      }

      // Use current user if no userId provided
      const finalUserId = userId || this.currentUser?.id;

      if (!finalUserId) {
        throw new Error('User authentication required to make calls');
      }

      console.log('📞 Making call:', { 
        phoneNumber: phoneNumber.trim(), 
        userId: finalUserId,
        contactName 
      });

      const requestBody: any = {
        to: phoneNumber.trim(),
        user_id: finalUserId,
      };

      if (contactName) {
        requestBody.contact_name = contactName;
      }

      const response = await this.request<CallApiResponse>('/calls/make', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log('✅ Call initiated successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to make call:', error);
      
      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error('Calling service not available');
      } else if (error.status === 401 || error.status === 403) {
        throw new Error('Not authorized to make calls - please log in');
      } else if (error.status === 429) {
        throw new Error('Too many calls - please wait');
      } else if (error.message.includes('User not found')) {
        throw new Error('User authentication failed');
      } else if (error.message.includes('Phone number is required')) {
        throw new Error('Phone number is required');
      } else {
        throw new Error('Unable to make call - please try again');
      }
    }
  }

  // Simplified call method for current user
  async makeCallForCurrentUser(phoneNumber: string, contactName?: string): Promise<CallApiResponse> {
    if (!this.currentUser) {
      throw new Error('Please log in to make calls');
    }

    return this.makeCall(phoneNumber, this.currentUser.id, contactName);
  }

  async hangupCall(callSid: string): Promise<CallApiResponse | null> {
    try {
      const response = await this.request<CallApiResponse>(`/calls/hangup/${callSid}`, {
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.warn('Failed to hangup call:', error);
      return null;
    }
  }

  async acceptCall(callSid: string, userId?: string | number): Promise<CallApiResponse | null> {
    try {
      const finalUserId = userId || this.currentUser?.id;
      const requestBody = finalUserId ? { user_id: finalUserId } : {};
      
      const response = await this.request<CallApiResponse>(`/calls/accept/${callSid}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      return response;
    } catch (error) {
      console.warn('Failed to accept call:', error);
      return null;
    }
  }

  async rejectCall(callSid: string, userId?: string | number): Promise<CallApiResponse | null> {
    try {
      const finalUserId = userId || this.currentUser?.id;
      const requestBody = finalUserId ? { user_id: finalUserId } : {};
      
      const response = await this.request<CallApiResponse>(`/calls/reject/${callSid}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      return response;
    } catch (error) {
      console.warn('Failed to reject call:', error);
      return null;
    }
  }

  async getActiveCalls(): Promise<any[]> {
    try {
      const response = await this.request<{ calls: any[]; success: boolean }>('/calls/active');
      return Array.isArray(response.calls) ? response.calls : [];
    } catch (error) {
      console.warn('Failed to fetch active calls:', error);
      return [];
    }
  }

  async getPendingCalls(): Promise<any[]> {
    try {
      const response = await this.request<{ pendingCalls: any[]; success: boolean }>('/calls/pending');
      return Array.isArray(response.pendingCalls) ? response.pendingCalls : [];
    } catch (error) {
      console.warn('Failed to fetch pending calls:', error);
      return [];
    }
  }

  // ===================================
  // CALL HISTORY METHODS
  // ===================================

  async getCallHistory(userId?: string | number): Promise<CallHistory[]> {
    try {
      // Use current user if no userId provided
      const finalUserId = userId || this.currentUser?.id;

      if (!finalUserId) {
        console.warn('No user ID provided for call history');
        return [];
      }

      const response = await this.request<{ callHistory: CallHistory[]; success: boolean }>(`/users/${finalUserId}/call-history`);
      return Array.isArray(response.callHistory) ? response.callHistory : [];
    } catch (error: any) {
      console.warn(`Failed to fetch call history for user ${userId}:`, error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get call history for current authenticated user
  async getCurrentUserCallHistory(): Promise<CallHistory[]> {
    try {
      if (!this.currentUser) {
        console.warn('No current user for call history');
        return [];
      }
      
      return await this.getCallHistory(this.currentUser.id);
    } catch (error: any) {
      console.warn('Failed to fetch current user call history:', error);
      return [];
    }
  }

  async getUserStats(userId?: string | number): Promise<any> {
    try {
      const finalUserId = userId || this.currentUser?.id;
      
      if (!finalUserId) {
        return null;
      }

      const response = await this.request<{ stats: any; success: boolean }>(`/users/${finalUserId}/call-stats`);
      return response.stats || null;
    } catch (error) {
      console.warn('Failed to fetch user stats:', error);
      return null;
    }
  }

  async getContactCallHistory(contactId: string | number): Promise<CallHistory[]> {
    try {
      const response = await this.request<{ callHistory: CallHistory[]; success: boolean }>(`/contacts/${contactId}/call-history`);
      return Array.isArray(response.callHistory) ? response.callHistory : [];
    } catch (error) {
      console.warn('Failed to fetch contact call history:', error);
      return [];
    }
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  // Health check to test API availability
  async healthCheck(): Promise<{ available: boolean; database?: boolean; version?: string }> {
    try {
      const response = await this.request<{
        status: string;
        database?: any;
        version?: string;
      }>('/health');
      
      return {
        available: response.status === 'healthy',
        database: response.database?.connected || false,
        version: response.version
      };
    } catch (error) {
      console.warn('API health check failed:', error);
      return { available: false };
    }
  }

  // Quick connectivity check
  async isApiAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Debug method to test authentication
  async testAuth(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🧪 Testing authentication...');
      console.log('🔑 Current token:', this.authToken ? 'Present' : 'Missing');
      
      const response = await this.verifyToken();
      
      if (response.valid) {
        console.log('✅ Authentication test successful');
        return { success: true, user: response.user };
      } else {
        console.log('❌ Authentication test failed - invalid token');
        return { success: false, error: 'Invalid or expired token' };
      }
    } catch (error: any) {
      console.error('❌ Authentication test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get API base URL for debugging
  getApiBaseUrl(): string {
    return API_BASE_URL;
  }

  // Get current authentication status
  getAuthStatus(): {
    isAuthenticated: boolean;
    hasToken: boolean;
    user: User | null;
    tokenPreview: string | null;
  } {
    return {
      isAuthenticated: !!(this.authToken && this.currentUser),
      hasToken: !!this.authToken,
      user: this.currentUser,
      tokenPreview: this.authToken ? this.authToken.substring(0, 20) + '...' : null
    };
  }
}

export const ApiService = new ApiServiceClass();
