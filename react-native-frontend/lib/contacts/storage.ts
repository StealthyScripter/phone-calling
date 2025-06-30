import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import { Config } from '../../constants/Config';
import { formatPhoneNumber } from '../utils/formatters';
import type { Contact, ContactFormData, DeviceContact, ContactImportResult } from './types';

class ContactStorage {
  private readonly STORAGE_KEY = Config.storage.contacts;
  private readonly SYNC_KEY = `${Config.storage.contacts}_sync`;

  async getContacts(): Promise<Contact[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get contacts from storage:', error);
      return [];
    }
  }

  async saveContacts(contacts: Contact[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(contacts));
      await this.updateSyncTimestamp();
    } catch (error) {
      console.error('Failed to save contacts to storage:', error);
      throw error;
    }
  }

  async addContact(contact: Contact): Promise<void> {
    try {
      const contacts = await this.getContacts();
      contacts.push(contact);
      await this.saveContacts(contacts);
    } catch (error) {
      console.error('Failed to add contact to storage:', error);
      throw error;
    }
  }

  async updateContact(contactId: string, updates: Partial<Contact>): Promise<void> {
    try {
      const contacts = await this.getContacts();
      const index = contacts.findIndex(c => c.id === contactId);
      
      if (index !== -1) {
        contacts[index] = { ...contacts[index], ...updates, updatedAt: new Date().toISOString() };
        await this.saveContacts(contacts);
      }
    } catch (error) {
      console.error('Failed to update contact in storage:', error);
      throw error;
    }
  }

  async removeContact(contactId: string): Promise<void> {
    try {
      const contacts = await this.getContacts();
      const filtered = contacts.filter(c => c.id !== contactId);
      await this.saveContacts(filtered);
    } catch (error) {
      console.error('Failed to remove contact from storage:', error);
      throw error;
    }
  }

  async findContactByPhone(phoneNumber: string): Promise<Contact | null> {
    try {
      const contacts = await this.getContacts();
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      return contacts.find(contact => 
        this.normalizePhoneNumber(contact.phoneNumber) === normalizedPhone
      ) || null;
    } catch (error) {
      console.error('Failed to find contact by phone:', error);
      return null;
    }
  }

  async getFavoriteContacts(): Promise<Contact[]> {
    try {
      const contacts = await this.getContacts();
      return contacts.filter(contact => contact.isFavorite);
    } catch (error) {
      console.error('Failed to get favorite contacts:', error);
      return [];
    }
  }

  async searchContacts(query: string): Promise<Contact[]> {
    try {
      const contacts = await this.getContacts();
      const lowercaseQuery = query.toLowerCase();
      
      return contacts.filter(contact =>
        contact.name.toLowerCase().includes(lowercaseQuery) ||
        contact.phoneNumber.includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('Failed to search contacts:', error);
      return [];
    }
  }

  async importFromDevice(): Promise<ContactImportResult> {
    try {
      // Check permissions first
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Contact permission not granted');
      }

      // Get device contacts
      const { data: deviceContacts } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      const existingContacts = await this.getContacts();
      const result: ContactImportResult = {
        imported: 0,
        skipped: 0,
        errors: 0,
        details: [],
      };

      for (const deviceContact of deviceContacts) {
        try {
          const importDetail = await this.processDeviceContact(deviceContact, existingContacts);
          result.details.push(importDetail);
          
          switch (importDetail.status) {
            case 'imported':
              result.imported++;
              break;
            case 'skipped':
              result.skipped++;
              break;
            case 'error':
              result.errors++;
              break;
          }
        } catch (error) {
          result.errors++;
          result.details.push({
            name: deviceContact.name || 'Unknown',
            phoneNumber: '',
            status: 'error',
            reason: 'Processing failed',
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to import contacts from device:', error);
      throw error;
    }
  }

  private async processDeviceContact(
    deviceContact: any,
    existingContacts: Contact[]
  ): Promise<ContactImportDetail> {
    const name = deviceContact.name || `Contact ${deviceContact.id}`;
    
    if (!deviceContact.phoneNumbers || deviceContact.phoneNumbers.length === 0) {
      return {
        name,
        phoneNumber: '',
        status: 'skipped',
        reason: 'No phone number',
      };
    }

    const primaryPhone = deviceContact.phoneNumbers[0].number;
    const normalizedPhone = this.normalizePhoneNumber(primaryPhone);

    // Check if contact already exists
    const existingContact = existingContacts.find(contact =>
      this.normalizePhoneNumber(contact.phoneNumber) === normalizedPhone
    );

    if (existingContact) {
      return {
        name,
        phoneNumber: primaryPhone,
        status: 'skipped',
        reason: 'Already exists',
      };
    }

    // Create new contact
    const newContact: Contact = {
      id: `imported_${Date.now()}_${Math.random()}`,
      userId: '', // Will be set by the API
      name,
      phoneNumber: primaryPhone,
      email: deviceContact.emails?.[0]?.email,
      formattedPhone: formatPhoneNumber(primaryPhone),
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    await this.addContact(newContact);

    return {
      name,
      phoneNumber: primaryPhone,
      status: 'imported',
    };
  }

  async syncContacts(serverContacts: Contact[]): Promise<void> {
    try {
      const localContacts = await this.getContacts();
      const mergedContacts = this.mergeContacts(localContacts, serverContacts);
      await this.saveContacts(mergedContacts);
    } catch (error) {
      console.error('Failed to sync contacts:', error);
      throw error;
    }
  }

  private mergeContacts(local: Contact[], server: Contact[]): Contact[] {
    const merged = [...server];
    
    // Add local contacts that don't exist on server
    local.forEach(localContact => {
      const existsOnServer = server.some(serverContact => 
        serverContact.id === localContact.id ||
        this.normalizePhoneNumber(serverContact.phoneNumber) === 
        this.normalizePhoneNumber(localContact.phoneNumber)
      );
      
      if (!existsOnServer) {
        merged.push(localContact);
      }
    });

    return merged;
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  private async updateSyncTimestamp(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Failed to update sync timestamp:', error);
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(this.SYNC_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  async clearContacts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(this.SYNC_KEY);
    } catch (error) {
      console.error('Failed to clear contacts:', error);
      throw error;
    }
  }
}

export const contactStorage = new ContactStorage();
