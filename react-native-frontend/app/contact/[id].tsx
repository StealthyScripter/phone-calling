import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/ui/Avatar';
import { Button, Card } from '../../components/ui';
import { CallHistoryItem } from '../../components/calls/CallHistoryItem';
import { FavoriteToggle } from '../../components/contacts/FavoriteToggle';
import { useContactSelectors } from '../../store';
import { useContacts } from '../../hooks/useContacts';
import { useCalls } from '../../hooks/useCalls';
import { formatPhoneNumber } from '../../lib/utils/formatters';

export default function ContactDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { contacts } = useContactSelectors();
  const { toggleFavorite, deleteContact } = useContacts();
  const { makeCall } = useCalls();

  const contact = contacts.find(c => c.id === id);

  if (!contact) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <Header title="Contact Not Found" showBackButton onLeftPress={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-lg">Contact not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCall = async () => {
    try {
      await makeCall(contact.phoneNumber);
    } catch (error: any) {
      Alert.alert('Call Failed', error.message);
    }
  };

  const handleMessage = () => {
    // Implement SMS functionality
    Alert.alert('Coming Soon', 'SMS functionality will be available soon.');
  };

  const handleEdit = () => {
    router.push(`/contact/edit/${contact.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(contact.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header
        title=""
        showBackButton
        onLeftPress={() => router.back()}
        rightIcon="create-outline"
        onRightPress={handleEdit}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Contact Header */}
        <View className="items-center px-6 py-8">
          <Avatar
            name={contact.name}
            source={contact.avatar}
            size="xlarge"
            className="mb-4"
          />
          
          <View className="flex-row items-center mb-2">
            <Text className="text-white text-2xl font-semibold mr-3">
              {contact.name}
            </Text>
            <FavoriteToggle
              isFavorite={contact.isFavorite}
              onToggle={() => toggleFavorite(contact.id)}
              size="large"
            />
          </View>

          <Text className="text-gray-400 text-lg mb-6">
            {formatPhoneNumber(contact.phoneNumber)}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row space-x-4 w-full">
            <Button
              title="Call"
              onPress={handleCall}
              icon={<Ionicons name="call" size={20} color="white" />}
              className="flex-1"
            />
            <Button
              title="Message"
              onPress={handleMessage}
              variant="outline"
              icon={<Ionicons name="chatbubble" size={20} color="#00ff87" />}
              className="flex-1"
            />
          </View>
        </View>

        {/* Contact Information */}
        <View className="px-6">
          <Card className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">
              Contact Information
            </Text>

            <View className="space-y-4">
              <View className="flex-row items-center">
                <Ionicons name="call-outline" size={20} color="#9ca3af" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-sm">Phone</Text>
                  <Text className="text-white text-base">
                    {formatPhoneNumber(contact.phoneNumber)}
                  </Text>
                </View>
              </View>

              {contact.email && (
                <View className="flex-row items-center">
                  <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-400 text-sm">Email</Text>
                    <Text className="text-white text-base">{contact.email}</Text>
                  </View>
                </View>
              )}

              {contact.notes && (
                <View className="flex-row items-start">
                  <Ionicons name="document-text-outline" size={20} color="#9ca3af" />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-400 text-sm">Notes</Text>
                    <Text className="text-white text-base">{contact.notes}</Text>
                  </View>
                </View>
              )}
            </View>
          </Card>

          {/* Call History */}
          <Card className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">
              Recent Calls
            </Text>
            
            {/* This would be populated with actual call history for this contact */}
            <Text className="text-gray-400 text-center py-8">
              No recent calls with this contact
            </Text>
          </Card>

          {/* Danger Zone */}
          <Card className="mb-8">
            <Text className="text-red-400 text-lg font-semibold mb-4">
              Danger Zone
            </Text>
            
            <TouchableOpacity
              onPress={handleDelete}
              className="flex-row items-center py-3"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text className="text-red-400 text-base ml-3">
                Delete Contact
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
