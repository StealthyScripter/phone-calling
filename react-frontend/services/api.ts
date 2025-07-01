import { User, Contact, Call } from '../types';

const BASE_URL = 'http://localhost:3000/api';

export class ApiService {
  // Call Management
  static async makeCall(to: string): Promise<Call> {
    const response = await fetch(`${BASE_URL}/calls/make`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to }),
    });
    if (!response.ok) throw new Error('Failed to make call');
    return response.json();
  }

  static async hangupCall(callSid: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/calls/hangup/${callSid}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to hangup call');
  }

  static async acceptCall(callSid: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/calls/accept/${callSid}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to accept call');
  }

  static async rejectCall(callSid: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/calls/reject/${callSid}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to reject call');
  }

  static async getActiveCalls(): Promise<Call[]> {
    const response = await fetch(`${BASE_URL}/calls/active`);
    if (!response.ok) throw new Error('Failed to get active calls');
    return response.json();
  }

  static async getPendingCalls(): Promise<Call[]> {
    const response = await fetch(`${BASE_URL}/calls/pending`);
    if (!response.ok) throw new Error('Failed to get pending calls');
    return response.json();
  }

  // User Management
  static async getUsers(): Promise<User[]> {
    const response = await fetch(`${BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to get users');
    return response.json();
  }

  static async createUser(user: Omit<User, 'id'>): Promise<User> {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }

  static async getUserDetails(id: number): Promise<User> {
    const response = await fetch(`${BASE_URL}/users/${id}`);
    if (!response.ok) throw new Error('Failed to get user details');
    return response.json();
  }

  static async getUserCallStats(id: number): Promise<any> {
    const response = await fetch(`${BASE_URL}/users/${id}/call-stats`);
    if (!response.ok) throw new Error('Failed to get call stats');
    return response.json();
  }

  // Contact Management
  static async getContacts(userId: number): Promise<Contact[]> {
    const response = await fetch(`${BASE_URL}/users/${userId}/contacts`);
    if (!response.ok) throw new Error('Failed to get contacts');
    return response.json();
  }

  static async createContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
    const response = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    if (!response.ok) throw new Error('Failed to create contact');
    return response.json();
  }

  static async updateContact(id: number, contact: Partial<Contact>): Promise<Contact> {
    const response = await fetch(`${BASE_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    if (!response.ok) throw new Error('Failed to update contact');
    return response.json();
  }

  static async deleteContact(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete contact');
  }

  static async toggleFavorite(id: number): Promise<Contact> {
    const response = await fetch(`${BASE_URL}/contacts/${id}/toggle-favorite`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to toggle favorite');
    return response.json();
  }
}
