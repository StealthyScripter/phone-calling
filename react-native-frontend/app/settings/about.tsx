import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/ui';

export default function AboutScreen() {
  const router = useRouter();

  const appInfo = {
    version: '1.0.0',
    buildNumber: '1001',
    lastUpdated: '2024-01-15',
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  const LinkRow = ({ 
    title, 
    icon, 
    onPress 
  }: {
    title: string;
    icon: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-gray-700 last:border-b-0"
    >
      <View className="flex-row items-center flex-1">
        <Ionicons name={icon as any} size={20} color="#9ca3af" />
        <Text className="text-white text-base ml-4">{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header
        title="About"
        showBackButton
        onLeftPress={() => router.back()}
      />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View className="items-center py-8">
          <View className="w-20 h-20 bg-green-500 rounded-2xl items-center justify-center mb-4">
            <Ionicons name="call" size={32} color="white" />
          </View>
          <Text className="text-white text-2xl font-bold mb-2">SmartConnect</Text>
          <Text className="text-gray-400 text-base text-center leading-6">
            Crystal clear calls with AI-powered routing and cost savings tracking
          </Text>
        </View>

        {/* Version Info */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            VERSION INFORMATION
          </Text>
          <Card padding="none">
            <View className="py-4 border-b border-gray-700">
              <View className="flex-row justify-between">
                <Text className="text-white text-base">Version</Text>
                <Text className="text-gray-400 text-base">{appInfo.version}</Text>
              </View>
            </View>
            <View className="py-4 border-b border-gray-700">
              <View className="flex-row justify-between">
                <Text className="text-white text-base">Build Number</Text>
                <Text className="text-gray-400 text-base">{appInfo.buildNumber}</Text>
              </View>
            </View>
            <View className="py-4">
              <View className="flex-row justify-between">
                <Text className="text-white text-base">Last Updated</Text>
                <Text className="text-gray-400 text-base">{appInfo.lastUpdated}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Legal & Support */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            LEGAL & SUPPORT
          </Text>
          <Card padding="none">
            <LinkRow
              title="Terms of Service"
              icon="document-text-outline"
              onPress={() => handleOpenLink('https://smartconnect.app/terms')}
            />
            <LinkRow
              title="Privacy Policy"
              icon="shield-outline"
              onPress={() => handleOpenLink('https://smartconnect.app/privacy')}
            />
            <LinkRow
              title="Open Source Licenses"
              icon="code-outline"
              onPress={() => handleOpenLink('https://smartconnect.app/licenses')}
            />
            <LinkRow
              title="Contact Support"
              icon="help-circle-outline"
              onPress={() => handleOpenLink('mailto:support@smartconnect.app')}
            />
          </Card>
        </View>

        {/* Company Info */}
        <View className="items-center py-8">
          <Text className="text-gray-500 text-sm text-center">
            Made with ❤️ by the SmartConnect Team
          </Text>
          <Text className="text-gray-500 text-sm text-center mt-2">
            © 2024 SmartConnect Inc. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
