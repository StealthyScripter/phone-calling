import { Contact, ContactGroup } from './types';
import { formatPhoneNumber } from '../utils/formatters';

export class ContactUtils {
  static groupContactsByLetter(contacts: Contact[]): ContactGroup[] {
    const groups: { [key: string]: Contact[] } = {};
    
    contacts.forEach(contact => {
      const firstLetter = contact.name.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
      
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(contact);
    });

    // Sort contacts within each group
    Object.keys(groups).forEach(letter => {
      groups[letter].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Convert to array and sort letters
    return Object.keys(groups)
      .sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
      })
      .map(letter => ({
        letter,
        contacts: groups[letter],
      }));
  }

  static filterContacts(contacts: Contact[], query: string): Contact[] {
    if (!query.trim()) return contacts;

    const lowercaseQuery = query.toLowerCase();
    
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowercaseQuery) ||
      contact.phoneNumber.includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(lowercaseQuery)) ||
      contact.formattedPhone.includes(query)
    );
  }

  static sortContacts(contacts: Contact[], sortBy: 'name' | 'recent' | 'frequency' = 'name'): Contact[] {
    const sorted = [...contacts];

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'recent':
        return sorted.sort((a, b) => {
          const aTime = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
          const bTime = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
          return bTime - aTime;
        });
      
      case 'frequency':
        return sorted.sort((a, b) => {
          const aFreq = a.contactFrequency || 0;
          const bFreq = b.contactFrequency || 0;
          return bFreq - aFreq;
        });
      
      default:
        return sorted;
    }
  }

  static validateContact(contact: Partial<Contact>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!contact.name || contact.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!contact.phoneNumber || contact.phoneNumber.trim().length === 0) {
      errors.push('Phone number is required');
    } else if (!this.isValidPhoneNumber(contact.phoneNumber)) {
      errors.push('Invalid phone number format');
    }

    if (contact.email && !this.isValidEmail(contact.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    return phoneRegex.test(cleanedNumber);
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static formatContactForDisplay(contact: Contact): Contact {
    return {
      ...contact,
      formattedPhone: formatPhoneNumber(contact.phoneNumber),
    };
  }

  static generateAvatar(name: string): string {
    // Generate initials for avatar
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  static getContactColor(name: string): string {
    // Generate consistent color based on name
    const colors = [
      '#ef4444', '#10b981', '#3b82f6', '#fbbf24',
      '#8b5cf6', '#ec4899', '#6366f1', '#f97316',
      '#06b6d4', '#84cc16'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  static mergeContacts(contact1: Contact, contact2: Contact): Contact {
    // Merge two contacts, preferring newer data
    const newer = new Date(contact1.updatedAt || contact1.createdAt) > 
                  new Date(contact2.updatedAt || contact2.createdAt) ? contact1 : contact2;
    const older = newer === contact1 ? contact2 : contact1;

    return {
      ...older,
      ...newer,
      // Merge specific fields intelligently
      email: newer.email || older.email,
      notes: newer.notes || older.notes,
      avatar: newer.avatar || older.avatar,
      isFavorite: newer.isFavorite || older.isFavorite,
      contactFrequency: (newer.contactFrequency || 0) + (older.contactFrequency || 0),
    };
  }

  static findDuplicates(contacts: Contact[]): Contact[][] {
    const duplicates: Contact[][] = [];
    const seen = new Set<string>();

    contacts.forEach((contact, index) => {
      const normalizedPhone = contact.phoneNumber.replace(/[^\d+]/g, '');
      
      if (seen.has(normalizedPhone)) {
        return;
      }

      const duplicateGroup = contacts.filter((c, i) => 
        i !== index && c.phoneNumber.replace(/[^\d+]/g, '') === normalizedPhone
      );

      if (duplicateGroup.length > 0) {
        duplicates.push([contact, ...duplicateGroup]);
        seen.add(normalizedPhone);
      }
    });

    return duplicates;
  }

  static exportContacts(contacts: Contact[]): string {
    // Export contacts to vCard format
    return contacts.map(contact => this.toVCard(contact)).join('\n\n');
  }

  private static toVCard(contact: Contact): string {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${contact.name}`,
      `TEL:${contact.phoneNumber}`,
    ];

    if (contact.email) {
      vcard.push(`EMAIL:${contact.email}`);
    }

    if (contact.notes) {
      vcard.push(`NOTE:${contact.notes}`);
    }

    vcard.push('END:VCARD');
    return vcard.join('\n');
  }
}