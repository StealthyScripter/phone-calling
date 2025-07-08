import { Contact, CallHistory, CallApiResponse, User } from '../types';

// Use environment variable or fallback to localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiError extends Error {
  status?: number;
  code?: string;
}

class ApiServiceClass {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: controller.signal,
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle different HTTP status codes
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as ApiError;
        error.status = response.status;
        
        // Try to get error details from response
        try {
          const errorData = await response.json();
          if (errorData.error) {
            error.message = errorData.error;
          }
        } catch {
          // If we can't parse the error response, keep the original error
        }
        
        throw error;
      }

      const data = await response.json();
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
      console.warn(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private authToken: string | null = null;

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

   private getAuthHeaders(): HeadersInit {
    const token = this.authToken;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // User endpoints with graceful fallbacks
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
      return await this.request<User>('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.warn('Failed to create user:', error);
      return null;
    }
  }

  // Contact endpoints with graceful fallbacks
  async getContacts(userId: number): Promise<Contact[]> {
    try {
      if (!userId || userId <= 0) {
        console.warn('Invalid user ID for contacts:', userId);
        return [];
      }

      const response = await this.request<{ contacts: Contact[]; success: boolean }>(`/users/${userId}/contacts`);
      return Array.isArray(response.contacts) ? response.contacts : [];
    } catch (error: any) {
      console.warn(`Failed to fetch contacts for user ${userId}:`, error);
      return []; // Return empty array instead of throwing
    }
  }

  async createContact(contactData: Partial<Contact>): Promise<Contact | null> {
    try {
      return await this.request<Contact>('/contacts', {
        method: 'POST',
        body: JSON.stringify(contactData),
      });
    } catch (error) {
      console.warn('Failed to create contact:', error);
      return null;
    }
  }

  async updateContact(contactId: number, contactData: Partial<Contact>): Promise<Contact | null> {
    try {
      return await this.request<Contact>(`/contacts/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify(contactData),
      });
    } catch (error) {
      console.warn('Failed to update contact:', error);
      return null;
    }
  }

  async deleteContact(contactId: number): Promise<boolean> {
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

  async toggleFavorite(contactId: number): Promise<Contact | null> {
    try {
      return await this.request<Contact>(`/contacts/${contactId}/toggle-favorite`, {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Failed to toggle favorite:', error);
      return null;
    }
  }

  // Call endpoints with graceful fallbacks
  async makeCall(phoneNumber: string, userId: number = 1): Promise<CallApiResponse | null> {
    try {
      if (!phoneNumber?.trim()) {
        throw new Error('Phone number is required');
      }

      if (!userId || userId <= 0) {
        throw new Error('Valid user ID is required');
      }

      return await this.request<CallApiResponse>('/calls/make', {
        method: 'POST',
        body: JSON.stringify({
          to: phoneNumber.trim(),
          user_id: userId,
        }),
      });
    } catch (error: any) {
      console.warn('Failed to make call:', error);
      
      // Re-throw call errors since they're critical
      if (error.status === 404) {
        throw new Error('Calling service not available');
      } else if (error.status === 403) {
        throw new Error('Not authorized to make calls');
      } else if (error.status === 429) {
        throw new Error('Too many calls - please wait');
      } else {
        throw new Error('Unable to make call - please try again');
      }
    }
  }

  async hangupCall(callSid: string): Promise<CallApiResponse | null> {
    try {
      return await this.request<CallApiResponse>(`/calls/hangup/${callSid}`, {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Failed to hangup call:', error);
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
      const response = await this.request<{ calls: any[]; success: boolean }>('/calls/pending');
      return Array.isArray(response.calls) ? response.calls : [];
    } catch (error) {
      console.warn('Failed to fetch pending calls:', error);
      return [];
    }
  }

  async getCallHistory(userId: number): Promise<CallHistory[]> {
    try {
      if (!userId || userId <= 0) {
        console.warn('Invalid user ID for call history:', userId);
        return [];
      }

      const response = await this.request<{ callHistory: CallHistory[]; success: boolean }>(`/users/${userId}/call-history`);
      return Array.isArray(response.callHistory) ? response.callHistory : [];
    } catch (error: any) {
      console.warn(`Failed to fetch call history for user ${userId}:`, error);
      return []; // Return empty array instead of throwing
    }
  }

  async getUserStats(userId: number): Promise<any> {
    try {
      return await this.request(`/users/${userId}/call-stats`);
    } catch (error) {
      console.warn('Failed to fetch user stats:', error);
      return null;
    }
  }

  async getContactCallHistory(contactId: number): Promise<any> {
    try {
      return await this.request(`/contacts/${contactId}/call-history`);
    } catch (error) {
      console.warn('Failed to fetch contact call history:', error);
      return null;
    }
  }

  async acceptCall(callSid: string, userId?: number): Promise<CallApiResponse | null> {
    try {
      const requestBody = userId ? { user_id: userId } : {};
      return await this.request<CallApiResponse>(`/calls/accept/${callSid}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.warn('Failed to accept call:', error);
      return null;
    }
  }

  async rejectCall(callSid: string, userId?: number): Promise<CallApiResponse | null> {
    try {
      const requestBody = userId ? { user_id: userId } : {};
      return await this.request<CallApiResponse>(`/calls/reject/${callSid}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.warn('Failed to reject call:', error);
      return null;
    }
  }

  async updateCallStatus(callSid: string, status: string): Promise<CallApiResponse | null> {
    try {
      return await this.request<CallApiResponse>(`/calls/status/${callSid}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.warn('Failed to update call status:', error);
      return null;
    }
  }

// Get current authenticated user's data
async getCurrentUser(): Promise<User | null> {
  try {
    const response = await this.request<{ user: User; success: boolean }>('/auth/profile');
    return response.user || null;
  } catch (error) {
    console.warn('Failed to get current user:', error);
    return null;
  }
}

// Update user profile
async updateProfile(profileData: Partial<User>): Promise<User | null> {
  try {
    const response = await this.request<{ user: User; success: boolean }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.user || null;
  } catch (error) {
    console.warn('Failed to update profile:', error);
    throw error; // Re-throw for profile updates
  }
}

// Use authenticated user for calls (no user_id needed)
async makeCallForCurrentUser(phoneNumber: string): Promise<CallApiResponse | null> {
  try {
    if (!phoneNumber?.trim()) {
      throw new Error('Phone number is required');
    }

    return await this.request<CallApiResponse>('/calls/make', {
      method: 'POST',
      body: JSON.stringify({
        to: phoneNumber.trim(),
        // Backend will get user_id from JWT token
      }),
    });
  } catch (error: any) {
    console.warn('Failed to make call:', error);
    
    if (error.status === 404) {
      throw new Error('Calling service not available');
    } else if (error.status === 403) {
      throw new Error('Not authorized to make calls');
    } else if (error.status === 429) {
      throw new Error('Too many calls - please wait');
    } else {
      throw new Error('Unable to make call - please try again');
    }
  }
}

// Get contacts for current authenticated user
async getCurrentUserContacts(): Promise<Contact[]> {
  try {
    // This would need a new backend endpoint: GET /api/auth/contacts
    const response = await this.request<{ contacts: Contact[]; success: boolean }>('/auth/contacts');
    return Array.isArray(response.contacts) ? response.contacts : [];
  } catch (error: any) {
    console.warn('Failed to fetch current user contacts:', error);
    return [];
  }
}

// Get call history for current authenticated user
async getCurrentUserCallHistory(): Promise<CallHistory[]> {
  try {
    // This would need a new backend endpoint: GET /api/auth/call-history
    const response = await this.request<{ callHistory: CallHistory[]; success: boolean }>('/auth/call-history');
    return Array.isArray(response.callHistory) ? response.callHistory : [];
  } catch (error: any) {
    console.warn('Failed to fetch current user call history:', error);
    return [];
  }
}

  // Utility method to check if API is available
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

  // Health check to test API availability
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }

  // Get API base URL for debugging
  getApiBaseUrl(): string {
    return API_BASE_URL;
  }
}

export const ApiService = new ApiServiceClass();