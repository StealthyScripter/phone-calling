import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/ui';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    pushNotifications: true,
    incomingCalls: true,
    missedCalls: true,
    voicemail: true,
    messages: false,
    sounds: true,
    vibration: true,
    emailNotifications: false,
    marketingEmails: false,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const SettingRow = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange 
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-700 last:border-b-0">
      <View className="flex-1 pr-4">
        <Text className="text-white text-base font-medium">{title}</Text>
        {subtitle && (
          <Text className="text-gray-400 text-sm mt-1">{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#374151', true: '#00ff87' }}
        thumbColor={value ? '#ffffff' : '#9ca3af'}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header
        title="Notifications"
        showBackButton
        onLeftPress={() => router.back()}
      />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Push Notifications */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            PUSH NOTIFICATIONS
          </Text>
          <Card padding="none">
            <SettingRow
              title="Enable Push Notifications"
              subtitle="Receive notifications on this device"
              value={settings.pushNotifications}
              onValueChange={(value) => updateSetting('pushNotifications', value)}
            />
            <SettingRow
              title="Incoming Calls"
              subtitle="Get notified of incoming calls"
              value={settings.incomingCalls}
              onValueChange={(value) => updateSetting('incomingCalls', value)}
            />
            <SettingRow
              title="Missed Calls"
              subtitle="Get notified of missed calls"
              value={settings.missedCalls}
              onValueChange={(value) => updateSetting('missedCalls', value)}
            />
            <SettingRow
              title="Voicemail"
              subtitle="Get notified of new voicemails"
              value={settings.voicemail}
              onValueChange={(value) => updateSetting('voicemail', value)}
            />
          </Card>
        </View>

        {/* Alert Settings */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            ALERT SETTINGS
          </Text>
          <Card padding="none">
            <SettingRow
              title="Sounds"
              subtitle="Play notification sounds"
              value={settings.sounds}
              onValueChange={(value) => updateSetting('sounds', value)}
            />
            <SettingRow
              title="Vibration"
              subtitle="Vibrate for notifications"
              value={settings.vibration}
              onValueChange={(value) => updateSetting('vibration', value)}
            />
          </Card>
        </View>

        {/* Email Notifications */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            EMAIL NOTIFICATIONS
          </Text>
          <Card padding="none">
            <SettingRow
              title="Email Notifications"
              subtitle="Receive notifications via email"
              value={settings.emailNotifications}
              onValueChange={(value) => updateSetting('emailNotifications', value)}
            />
            <SettingRow
              title="Marketing Emails"
              subtitle="Receive updates and promotional content"
              value={settings.marketingEmails}
              onValueChange={(value) => updateSetting('marketingEmails', value)}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
