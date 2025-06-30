import React from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/common/Header';
import { ContactForm } from '../../components/contacts/ContactForm';
import { useContacts } from '../../hooks/useContacts';

export default function AddContactScreen() {
  const router = useRouter();
  const { createContact } = useContacts();

  const handleSubmit = async (data: any) => {
    try {
      await createContact(data);
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
        title="Add Contact"
        showBackButton
        onLeftPress={() => router.back()}
      />

      <ContactForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditing={false}
      />
    </SafeAreaView>
  );
}
