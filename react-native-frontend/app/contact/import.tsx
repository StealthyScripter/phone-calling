import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Button, Card } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useContacts } from '../../hooks/useContacts';

export default function ImportContactsScreen() {
  const router = useRouter();
  const { importContacts } = useContacts();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleImportFromDevice = async () => {
    try {
      setImporting(true);
      const result = await importContacts();
      setImportResult(result);
      
      Alert.alert(
        'Import Complete',
        `Imported ${result.imported} contacts. ${result.skipped} skipped, ${result.errors} errors.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Import Failed', error.message);
    } finally {
      setImporting(false);
    }
  };

  if (importing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <Header
          title="Import Contacts"
          showBackButton
          onLeftPress={() => router.back()}
        />
        <LoadingSpinner text="Importing contacts..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header
        title="Import Contacts"
        showBackButton
        onLeftPress={() => router.back()}
      />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-8">
          <View className="items-center mb-8">
            <Ionicons name="people-outline" size={64} color="#9ca3af" />
            <Text className="text-white text-xl font-semibold mt-4 mb-2 text-center">
              Import Your Contacts
            </Text>
            <Text className="text-gray-400 text-base text-center leading-6">
              Quickly add contacts from your device to start making calls
            </Text>
          </View>

          {/* Import Options */}
          <Card className="mb-6">
            <View className="items-center">
              <Ionicons name="phone-portrait-outline" size={32} color="#00ff87" />
              <Text className="text-white text-lg font-semibold mt-3 mb-2">
                From Device Contacts
              </Text>
              <Text className="text-gray-400 text-sm text-center mb-6 leading-5">
                Import contacts from your device's contact list. 
                We'll only import contacts with phone numbers.
              </Text>
              <Button
                title="Import from Device"
                onPress={handleImportFromDevice}
                icon={<Ionicons name="download" size={20} color="white" />}
              />
            </View>
          </Card>

          <Card>
            <View className="items-center">
              <Ionicons name="cloud-outline" size={32} color="#9ca3af" />
              <Text className="text-white text-lg font-semibold mt-3 mb-2">
                From Cloud Services
              </Text>
              <Text className="text-gray-400 text-sm text-center mb-6 leading-5">
                Import contacts from Google, iCloud, or other services.
              </Text>
              <Button
                title="Coming Soon"
                onPress={() => Alert.alert('Coming Soon', 'Cloud import will be available soon.')}
                variant="outline"
                disabled
              />
            </View>
          </Card>

          {/* Privacy Notice */}
          <View className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-400 font-medium mb-1">
                  Privacy Protected
                </Text>
                <Text className="text-gray-400 text-sm leading-5">
                  Your contacts are stored securely and never shared with third parties. 
                  You can delete imported contacts at any time.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}