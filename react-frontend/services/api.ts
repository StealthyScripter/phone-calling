import { Contact, CallHistory, CallApiResponse, User } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiServiceClass {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    const response = await this.request<{ users: User[]; success: boolean }>('/users');
    return response.users || [];
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Contact endpoints
  async getContacts(userId: number): Promise<Contact[]> {
    const response = await this.request<{ contacts: Contact[]; success: boolean }>(`/users/${userId}/contacts`);
    return response.contacts || [];
  }

  async createContact(contactData: Partial<Contact>): Promise<Contact> {
    return this.request<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async updateContact(contactId: number, contactData: Partial<Contact>): Promise<Contact> {
    return this.request<Contact>(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  async deleteContact(contactId: number): Promise<void> {
    await this.request(`/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  async toggleFavorite(contactId: number): Promise<Contact> {
    return this.request<Contact>(`/contacts/${contactId}/toggle-favorite`, {
      method: 'POST',
    });
  }

  // Call endpoints
  async makeCall(phoneNumber: string, userId: number = 1): Promise<CallApiResponse> {
    return this.request<CallApiResponse>('/calls/make', {
      method: 'POST',
      body: JSON.stringify({
        to: phoneNumber,
        user_id: userId,
      }),
    });
  }

  async hangupCall(callSid: string): Promise<CallApiResponse> {
    return this.request<CallApiResponse>(`/calls/hangup/${callSid}`, {
      method: 'POST',
    });
  }

  async getActiveCalls(): Promise<any[]> {
    const response = await this.request<{ calls: any[]; success: boolean }>('/calls/active');
    return response.calls || [];
  }

  async getPendingCalls(): Promise<any[]> {
    const response = await this.request<{ calls: any[]; success: boolean }>('/calls/pending');
    return response.calls || [];
  }

  async getCallHistory(userId: number): Promise<CallHistory[]> {
    const response = await this.request<{ calls: CallHistory[]; success: boolean }>(`/users/${userId}/call-history`);
    return response.calls || [];
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request('/health');
  }
}

export const ApiService = new ApiServiceClass();