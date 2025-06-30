export interface Contact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
  isFavorite: boolean;
  formattedPhone: string;
  createdAt: string;
  updatedAt?: string;
  avatar?: string;
  lastContactedAt?: string;
  contactFrequency?: number;
}

export interface ContactFormData {
  name: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
}

export interface ContactGroup {
  letter: string;
  contacts: Contact[];
}

export interface ContactSearchResult {
  contacts: Contact[];
  query: string;
  total: number;
}

export interface ContactImportResult {
  imported: number;
  skipped: number;
  errors: number;
  details: ContactImportDetail[];
}

export interface ContactImportDetail {
  name: string;
  phoneNumber: string;
  status: 'imported' | 'skipped' | 'error';
  reason?: string;
}

export interface DeviceContact {
  id: string;
  name: string;
  phoneNumbers: Array<{
    number: string;
    label?: string;
  }>;
  emails?: Array<{
    email: string;
    label?: string;
  }>;
}
