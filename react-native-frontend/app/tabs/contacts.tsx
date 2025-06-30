import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { SearchBar } from '../../components/common/SearchBar';
import { ContactCard } from '../../components/contacts/ContactCard';
import { QuickContacts } from '../../components/contacts/QuickContacts';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useContactSelectors } from '../../store';
import { useContacts } from '../../hooks/useContacts';
import { useCalls } from '../../hooks/useCalls';

export default function ContactsScreen() {
  const { 
    contacts, 
    favorites, 
    loading, 
    searchQuery, 
    setSearchQuery 
  } = useContactSelectors();
  const { toggleFavorite } = useContacts();
  const { makeCall } = useCalls();

  const handleContactPress = (contact: any) => {
    // Navigate to contact details
  };

  const handleCallPress = async (contact: any) => {
    try {
      await makeCall(contact.phoneNumber);
    } catch (error: any) {
      // Handle error
    }
  };

  const handleAddContact = () => {
    // Navigate to add contact screen
  };

  const renderContactItem = ({ item }: { item: any }) => (
    <ContactCard
      contact={item}
      onPress={() => handleContactPress(item)}
      onCallPress={() => handleCallPress(item)}
      onFavoriteToggle={toggleFavorite}
      variant="default"
    />
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-8">
      <Ionicons name="people-outline" size={64} color="#9ca3af" />
      <Text className="text-gray-400 text-lg text-center mb-4 mt-4">
        No contacts yet
      </Text>
      <Text className="text-gray-500 text-sm text-center mb-6">
        Add contacts to start making calls
      </Text>
      <TouchableOpacity
        onPress={handleAddContact}
        className="bg-green-500 px-6 py-3 rounded-lg"
      >
        <Text className="text-white font-semibold">Add Contact</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <LoadingSpinner text="Loading contacts..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header
        title="Contacts"
        rightIcon="add"
        onRightPress={handleAddContact}
      />

      <SearchBar
        placeholder="Search contacts..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Favorites Section */}
      {favorites.length > 0 && !searchQuery && (
        <View className="mb-4">
          <Text className="text-white text-lg font-semibold mb-4 px-4">
            Favorites
          </Text>
          <QuickContacts
            contacts={favorites}
            onContactPress={handleContactPress}
            onAddPress={handleAddContact}
            maxVisible={8}
          />
        </View>
      )}

      {/* Contacts List */}
      <FlatList
        data={contacts}
        renderItem={renderContactItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}
