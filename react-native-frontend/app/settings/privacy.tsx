import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card, Button } from '../../components/ui';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    showOnlineStatus: true,
    allowContactSync: true,
    shareUsageData: false,
    blockUnknownCallers: false,
    enableTwoFactor: false,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleChangePassword = () => {
    Alert.alert('Coming Soon', 'Password change functionality will be available soon.');
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your data export will be prepared and sent to your email.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Coming Soon', 'Account deletion functionality will be available soon.');
        }},
      ]
    );
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

  const ActionRow = ({ 
    title, 
    subtitle, 
    icon, 
    onPress,
    destructive = false
  }: {
    title: string;
    subtitle?: string;
    icon: string;
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-4 border-b border-gray-700 last:border-b-0"
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={destructive ? '#ef4444' : '#9ca3af'} 
      />
      <View className="flex-1 ml-4">
        <Text className={`text-base font-medium ${destructive ? 'text-red-400' : 'text-white'}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-gray-400 text-sm mt-1">{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header
        title="Privacy & Security"
        showBackButton
        onLeftPress={() => router.back()}
      />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Privacy Settings */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            PRIVACY
          </Text>
          <Card padding="none">
            <SettingRow
              title="Show Online Status"
              subtitle="Let others see when you're online"
              value={settings.showOnlineStatus}
              onValueChange={(value) => updateSetting('showOnlineStatus', value)}
            />
            <SettingRow
              title="Contact Sync"
              subtitle="Sync contacts with your device"
              value={settings.allowContactSync}
              onValueChange={(value) => updateSetting('allowContactSync', value)}
            />
            <SettingRow
              title="Share Usage Data"
              subtitle="Help improve the app by sharing anonymous usage data"
              value={settings.shareUsageData}
              onValueChange={(value) => updateSetting('shareUsageData', value)}
            />
            <SettingRow
              title="Block Unknown Callers"
              subtitle="Automatically block calls from unknown numbers"
              value={settings.blockUnknownCallers}
              onValueChange={(value) => updateSetting('blockUnknownCallers', value)}
            />
          </Card>
        </View>

        {/* Security Settings */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            SECURITY
          </Text>
          <Card padding="none">
            <SettingRow
              title="Two-Factor Authentication"
              subtitle="Add an extra layer of security"
              value={settings.enableTwoFactor}
              onValueChange={(value) => updateSetting('enableTwoFactor', value)}
            />
            <ActionRow
              title="Change Password"
              subtitle="Update your account password"
              icon="lock-closed-outline"
              onPress={handleChangePassword}
            />
          </Card>
        </View>

        {/* Data Management */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            DATA MANAGEMENT
          </Text>
          <Card padding="none">
            <ActionRow
              title="Export My Data"
              subtitle="Download a copy of your data"
              icon="download-outline"
              onPress={handleExportData}
            />
            <ActionRow
              title="Delete Account"
              subtitle="Permanently delete your account and data"
              icon="trash-outline"
              onPress={handleDeleteAccount}
              destructive
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
