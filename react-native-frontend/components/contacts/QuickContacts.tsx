import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContactAvatar } from './ContactAvatar';
import { twMerge } from 'tailwind-merge';

interface QuickContact {
  id: string;
  name: string;
  phoneNumber: string;
  imageUri?: string;
}

interface QuickContactsProps {
  contacts: QuickContact[];
  onContactPress: (contact: QuickContact) => void;
  onAddPress: () => void;
  maxVisible?: number;
  className?: string;
}

export const QuickContacts: React.FC<QuickContactsProps> = ({
  contacts,
  onContactPress,
  onAddPress,
  maxVisible = 6,
  className,
}) => {
  const visibleContacts = contacts.slice(0, maxVisible - 1);
  const hasMore = contacts.length > maxVisible - 1;

  const QuickContactItem: React.FC<{
    contact?: QuickContact;
    isAddButton?: boolean;
    isMoreButton?: boolean;
    remainingCount?: number;
  }> = ({ contact, isAddButton, isMoreButton, remainingCount }) => (
    <TouchableOpacity
      onPress={() => {
        if (isAddButton) {
          onAddPress();
        } else if (contact) {
          onContactPress(contact);
        }
      }}
      className="items-center mr-4"
    >
      {isAddButton ? (
        <View className="w-16 h-16 rounded-full bg-gray-700 border-2 border-dashed border-gray-500 items-center justify-center mb-2">
          <Ionicons name="add" size={24} color="#9ca3af" />
        </View>
      ) : isMoreButton ? (
        <View className="w-16 h-16 rounded-full bg-gray-700 items-center justify-center mb-2">
          <Text className="text-white font-semibold">+{remainingCount}</Text>
        </View>
      ) : (
        <ContactAvatar
          name={contact?.name}
          imageUri={contact?.imageUri}
          size="large"
          className="mb-2"
        />
      )}
      
      <Text className="text-white text-xs text-center w-16" numberOfLines={1}>
        {isAddButton ? 'Add' : isMoreButton ? 'More' : contact?.name}
      </Text>
    </TouchableOpacity>
  );

  if (contacts.length === 0) {
    return (
      <View className={twMerge('p-4', className)}>
        <Text className="text-gray-400 text-center text-sm mb-4">
          No favorite contacts yet
        </Text>
        <TouchableOpacity
          onPress={onAddPress}
          className="items-center"
        >
          <View className="w-16 h-16 rounded-full bg-gray-700 border-2 border-dashed border-gray-500 items-center justify-center mb-2">
            <Ionicons name="add" size={24} color="#9ca3af" />
          </View>
          <Text className="text-white text-xs">Add Contact</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className={twMerge('py-4', className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {visibleContacts.map((contact) => (
          <QuickContactItem
            key={contact.id}
            contact={contact}
          />
        ))}
        
        {hasMore ? (
          <QuickContactItem
            isMoreButton
            remainingCount={contacts.length - visibleContacts.length}
          />
        ) : (
          <QuickContactItem isAddButton />
        )}
      </ScrollView>
    </View>
  );
};