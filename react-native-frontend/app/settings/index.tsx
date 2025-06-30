import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/ui';
import { useAuthSelectors } from '../../store';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuthSelectors();

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          title: 'Profile',
          subtitle: 'Edit your personal information',
          onPress: () => router.push('/settings/profile'),
        },
        {
          icon: 'shield-outline',
          title: 'Privacy & Security',
          subtitle: 'Manage your privacy settings',
          onPress: () => router.push('/settings/privacy'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Configure notification preferences',
          onPress: () => router.push('/settings/notifications'),
        },
        {
          icon: 'volume-high-outline',
          title: 'Audio & Calls',
          subtitle: 'Ringtones and audio settings',
          onPress: () => router.push('/settings/audio'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          onPress: () => {},
        },
        {
          icon: 'information-circle-outline',
          title: 'About',
          subtitle: 'App version and legal information',
          onPress: () => router.push('/settings/about'),
        },
      ],
    },
  ];

  const renderSettingsItem = (item: any) => (
    <TouchableOpacity
      key={item.title}
      onPress={item.onPress}
      className="flex-row items-center py-4 border-b border-gray-700 last:border-b-0"
    >
      <View className="w-10 h-10 bg-gray-700 rounded-full items-center justify-center mr-4">
        <Ionicons name={item.icon} size={20} color="#9ca3af" />
      </View>
      
      <View className="flex-1">
        <Text className="text-white text-base font-medium mb-1">
          {item.title}
        </Text>
        <Text className="text-gray-400 text-sm">
          {item.subtitle}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header
        title="Settings"
        showBackButton
        onLeftPress={() => router.back()}
      />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, index) => (
          <View key={section.title} className="mb-6">
            <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
              {section.title.toUpperCase()}
            </Text>
            
            <Card padding="none">
              {section.items.map(renderSettingsItem)}
            </Card>
          </View>
        ))}

        {/* App Version */}
        <View className="items-center py-8">
          <Text className="text-gray-500 text-sm">
            SmartConnect v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}