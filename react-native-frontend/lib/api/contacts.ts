import { API_ENDPOINTS } from '../../constants/API';
import { apiClient } from './client';
import type { 
  Contact, 
  ContactCreateRequest, 
  ApiResponse,
  PaginatedResponse 
} from './types';

class ContactsAPI {
  async getContacts(page = 1, limit = 50): Promise<Contact[]> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Contact>>>(
      `${API_ENDPOINTS.CONTACTS.BASE}?page=${page}&limit=${limit}`
    );
    return response.data.data.data;
  }

  async getContact(id: string): Promise<Contact> {
    const response = await apiClient.get<ApiResponse<Contact>>(
      API_ENDPOINTS.CONTACTS.BY_ID(id)
    );
    return response.data.data;
  }

  async createContact(contactData: ContactCreateRequest): Promise<Contact> {
    const response = await apiClient.post<ApiResponse<Contact>>(
      API_ENDPOINTS.CONTACTS.BASE,
      contactData
    );
    return response.data.data;
  }

  async updateContact(id: string, updates: Partial<ContactCreateRequest>): Promise<Contact> {
    const response = await apiClient.put<ApiResponse<Contact>>(
      API_ENDPOINTS.CONTACTS.BY_ID(id),
      updates
    );
    return response.data.data;
  }

  async deleteContact(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.CONTACTS.BY_ID(id)
    );
  }

  async toggleFavorite(id: string): Promise<Contact> {
    const response = await apiClient.post<ApiResponse<Contact>>(
      API_ENDPOINTS.CONTACTS.TOGGLE_FAVORITE(id)
    );
    return response.data.data;
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const response = await apiClient.get<ApiResponse<Contact[]>>(
      `${API_ENDPOINTS.CONTACTS.SEARCH}?q=${encodeURIComponent(query)}`
    );
    return response.data.data;
  }

  async getContactByPhone(phoneNumber: string): Promise<Contact | null> {
    try {
      const response = await apiClient.get<ApiResponse<Contact>>(
        API_ENDPOINTS.CONTACTS.BY_PHONE(phoneNumber)
      );
      return response.data.data;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getCallHistory(contactId: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      API_ENDPOINTS.CONTACTS.CALL_HISTORY(contactId)
    );
    return response.data.data;
  }

  async getCallStats(contactId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      API_ENDPOINTS.CONTACTS.CALL_STATS(contactId)
    );
    return response.data.data;
  }
}

export const contactsAPI = new ContactsAPI();
