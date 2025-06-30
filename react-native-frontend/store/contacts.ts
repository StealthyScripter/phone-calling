import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ContactState } from './types';

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      contacts: [],
      favorites: [],
      loading: false,
      searchQuery: '',
      selectedContact: null,

      setContacts: (contacts) => {
        const favorites = contacts.filter(contact => contact.isFavorite);
        set({ contacts, favorites });
      },

      addContact: (contact) => {
        const { contacts } = get();
        const newContacts = [...contacts, contact];
        const favorites = newContacts.filter(c => c.isFavorite);
        set({ contacts: newContacts, favorites });
      },

      updateContact: (id, updates) => {
        const { contacts } = get();
        const newContacts = contacts.map(contact =>
          contact.id === id ? { ...contact, ...updates } : contact
        );
        const favorites = newContacts.filter(c => c.isFavorite);
        set({ contacts: newContacts, favorites });
      },

      removeContact: (id) => {
        const { contacts } = get();
        const newContacts = contacts.filter(contact => contact.id !== id);
        const favorites = newContacts.filter(c => c.isFavorite);
        set({ contacts: newContacts, favorites });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSelectedContact: (contact) => {
        set({ selectedContact: contact });
      },

      clearContacts: () => {
        set({
          contacts: [],
          favorites: [],
          selectedContact: null,
          searchQuery: '',
        });
      },
    }),
    {
      name: 'contacts-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        contacts: state.contacts,
        favorites: state.favorites,
      }),
    }
  )
);
