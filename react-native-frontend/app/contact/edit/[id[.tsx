import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/common/Header';
import { ContactForm } from '../../../components/contacts/ContactForm';
import { useContactSelectors } from '../../../store';
import { useContacts } from '../../../hooks/useContacts';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { contacts } = useContactSelectors();
  const { editContact } = useContacts();

  const contact = contacts.find(c => c.id === id);

  if (!contact) {
    router.back();
    return null;
  }

  const handleSubmit = async (data: any) => {
    try {
      await editContact(contact.id, data);
      router.back();
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header
        title="Edit Contact"
        showBackButton
        onLeftPress={() => router.back()}
      />

      <ContactForm
        initialData={{
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          email: contact.email || '',
          notes: contact.notes || '',
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditing={true}
      />
    </SafeAreaView>
  );
}
