import { useState, useEffect, useCallback } from 'react';
import { useContactStore } from '../store/contacts';
import { contactsAPI } from '../lib/api/contacts';
import { contactStorage } from '../lib/contacts/storage';
import type { Contact, ContactFormData } from '../lib/contacts/types';

export const useContacts = () => {
  const {
    contacts,
    favorites,
    loading,
    setContacts,
    addContact,
    updateContact,
    removeContact,
    setLoading,
  } = useContactStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchQuery]);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load from local storage first
      const localContacts = await contactStorage.getContacts();
      setContacts(localContacts);
      
      // Then sync with server
      const serverContacts = await contactsAPI.getContacts();
      
      // Merge and update local storage
      await contactStorage.syncContacts(serverContacts);
      setContacts(serverContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [setContacts, setLoading]);

  const filterContacts = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.phoneNumber.includes(query) ||
      contact.email?.toLowerCase().includes(query)
    );
    
    setFilteredContacts(filtered);
  }, [contacts, searchQuery]);

  const createContact = useCallback(async (contactData: ContactFormData) => {
    try {
      setLoading(true);
      const newContact = await contactsAPI.createContact(contactData);
      
      addContact(newContact);
      await contactStorage.addContact(newContact);
      
      return newContact;
    } catch (error) {
      console.error('Failed to create contact:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addContact, setLoading]);

  const editContact = useCallback(async (contactId: string, updates: Partial<ContactFormData>) => {
    try {
      setLoading(true);
      const updatedContact = await contactsAPI.updateContact(contactId, updates);
      
      updateContact(contactId, updatedContact);
      await contactStorage.updateContact(contactId, updatedContact);
      
      return updatedContact;
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateContact, setLoading]);

  const deleteContact = useCallback(async (contactId: string) => {
    try {
      setLoading(true);
      await contactsAPI.deleteContact(contactId);
      
      removeContact(contactId);
      await contactStorage.removeContact(contactId);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [removeContact, setLoading]);

  const toggleFavorite = useCallback(async (contactId: string) => {
    try {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;

      const updatedContact = await contactsAPI.toggleFavorite(contactId);
      updateContact(contactId, updatedContact);
      await contactStorage.updateContact(contactId, updatedContact);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }, [contacts, updateContact]);

  const searchContacts = useCallback(async (query: string) => {
    try {
      if (query.trim().length < 2) {
        return contacts;
      }
      
      return await contactsAPI.searchContacts(query);
    } catch (error) {
      console.error('Failed to search contacts:', error);
      return [];
    }
  }, [contacts]);

  const getContactByPhone = useCallback(async (phoneNumber: string) => {
    try {
      return await contactsAPI.getContactByPhone(phoneNumber);
    } catch (error) {
      console.error('Failed to get contact by phone:', error);
      return null;
    }
  }, []);

  const importContacts = useCallback(async () => {
    try {
      setLoading(true);
      const deviceContacts = await contactStorage.importFromDevice();
      
      for (const contact of deviceContacts) {
        try {
          const newContact = await contactsAPI.createContact(contact);
          addContact(newContact);
        } catch (error) {
          console.warn('Failed to import contact:', contact.name, error);
        }
      }
    } catch (error) {
      console.error('Failed to import contacts:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addContact, setLoading]);

  return {
    contacts: filteredContacts,
    allContacts: contacts,
    favorites,
    loading,
    searchQuery,
    setSearchQuery,
    loadContacts,
    createContact,
    editContact,
    deleteContact,
    toggleFavorite,
    searchContacts,
    getContactByPhone,
    importContacts,
  };
};
