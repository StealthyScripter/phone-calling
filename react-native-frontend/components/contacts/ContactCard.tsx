import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContactAvatar } from './ContactAvatar';
import { FavoriteToggle } from './FavoriteToggle';
import { formatPhoneNumber } from '../../lib/utils/formatters';
import { twMerge } from 'tailwind-merge';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  imageUri?: string;
  isFavorite: boolean;
  notes?: string;
}

interface ContactCardProps {
  contact: Contact;
  onPress: () => void;
  onCallPress: () => void;
  onMessagePress?: () => void;
  onFavoriteToggle: (contactId: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onPress,
  onCallPress,
  onMessagePress,
  onFavoriteToggle,
  showActions = true,
  variant = 'default',
  className,
}) => {
  const renderCompactVariant = () => (
    <TouchableOpacity
      onPress={onPress}
      className={twMerge('flex-row items-center py-3 px-4', className)}
    >
      <ContactAvatar
        name={contact.name}
        imageUri={contact.imageUri}
        size="medium"
      />
      
      <View className="flex-1 ml-3">
        <Text className="text-white font-medium text-base">
          {contact.name}
        </Text>
        <Text className="text-gray-400 text-sm">
          {formatPhoneNumber(contact.phoneNumber)}
        </Text>
      </View>

      {showActions && (
        <TouchableOpacity onPress={onCallPress} className="p-2">
          <Ionicons name="call" size={20} color="#00ff87" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderDetailedVariant = () => (
    <TouchableOpacity
      onPress={onPress}
      className={twMerge('bg-gray-800 rounded-xl p-4 m-2', className)}
    >
      <View className="flex-row items-start">
        <ContactAvatar
          name={contact.name}
          imageUri={contact.imageUri}
          size="large"
        />
        
        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white font-semibold text-lg">
              {contact.name}
            </Text>
            <FavoriteToggle
              isFavorite={contact.isFavorite}
              onToggle={() => onFavoriteToggle(contact.id)}
            />
          </View>
          
          <View className="mb-2">
            <View className="flex-row items-center mb-1">
              <Ionicons name="call-outline" size={16} color="#9ca3af" />
              <Text className="text-gray-400 text-sm ml-2">
                {formatPhoneNumber(contact.phoneNumber)}
              </Text>
            </View>
            
            {contact.email && (
              <View className="flex-row items-center">
                <Ionicons name="mail-outline" size={16} color="#9ca3af" />
                <Text className="text-gray-400 text-sm ml-2">
                  {contact.email}
                </Text>
              </View>
            )}
          </View>

          {contact.notes && (
            <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>
              {contact.notes}
            </Text>
          )}

          {showActions && (
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={onCallPress}
                className="flex-1 bg-green-500 py-2 px-4 rounded-lg flex-row items-center justify-center"
              >
                <Ionicons name="call" size={16} color="white" />
                <Text className="text-white font-medium ml-2">Call</Text>
              </TouchableOpacity>
              
              {onMessagePress && (
                <TouchableOpacity
                  onPress={onMessagePress}
                  className="flex-1 bg-gray-700 py-2 px-4 rounded-lg flex-row items-center justify-center"
                >
                  <Ionicons name="chatbubble" size={16} color="white" />
                  <Text className="text-white font-medium ml-2">Message</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDefaultVariant = () => (
    <TouchableOpacity
      onPress={onPress}
      className={twMerge('flex-row items-center py-3 px-4 border-b border-gray-800', className)}
    >
      <ContactAvatar
        name={contact.name}
        imageUri={contact.imageUri}
        size="medium"
      />
      
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-white font-medium text-base">
            {contact.name}
          </Text>
          <FavoriteToggle
            isFavorite={contact.isFavorite}
            onToggle={() => onFavoriteToggle(contact.id)}
            size="small"
          />
        </View>
        
        <Text className="text-gray-400 text-sm">
          {formatPhoneNumber(contact.phoneNumber)}
        </Text>
      </View>

      {showActions && (
        <View className="flex-row ml-3">
          {onMessagePress && (
            <TouchableOpacity onPress={onMessagePress} className="p-2 mr-2">
              <Ionicons name="chatbubble-outline" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={onCallPress} className="p-2">
            <Ionicons name="call" size={20} color="#00ff87" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  switch (variant) {
    case 'compact':
      return renderCompactVariant();
    case 'detailed':
      return renderDetailedVariant();
    default:
      return renderDefaultVariant();
  }
};
