import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuthSelectors, useCallSelectors } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import { formatDuration, formatNumber } from '../../lib/utils/formatters';

export default function ProfileScreen() {
  const { user } = useAuthSelectors();
  const { callHistory } = useCallSelectors();
  const { logout } = useAuth();

  const totalCalls = callHistory.length;
  const totalDuration = callHistory.reduce((sum, call) => sum + (call.duration || 0), 0);
  const missedCalls = callHistory.filter(call => call.status === 'missed').length;

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    { icon: 'person-outline', title: 'Edit Profile', onPress: () => {} },
    { icon: 'settings-outline', title: 'Settings', onPress: () => {} },
    { icon: 'notifications-outline', title: 'Notifications', onPress: () => {} },
    { icon: 'shield-outline', title: 'Privacy & Security', onPress: () => {} },
    { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => {} },
    { icon: 'information-circle-outline', title: 'About', onPress: () => {} },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header title="Profile" />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <Card className="mb-6 items-center">
          <Avatar
            name={user ? `${user.firstName} ${user.lastName}` : ''}
            source={user?.avatar}
            size="xlarge"
            className="mb-4"
          />
          <Text className="text-white text-xl font-semibold mb-1">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-gray-400 text-base mb-3">
            {user?.email}
          </Text>
          <Badge text={user?.role || 'USER'} variant="info" />
        </Card>

        {/* Call Statistics */}
        <Card className="mb-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Call Statistics
          </Text>
          
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-green-400 text-2xl font-bold">
                {formatNumber(totalCalls)}
              </Text>
              <Text className="text-gray-400 text-sm">Total Calls</Text>
            </View>
            
            <View className="items-center flex-1">
              <Text className="text-blue-400 text-2xl font-bold">
                {formatDuration(totalDuration)}
              </Text>
              <Text className="text-gray-400 text-sm">Total Time</Text>
            </View>
            
            <View className="items-center flex-1">
              <Text className="text-yellow-400 text-2xl font-bold">
                {formatNumber(missedCalls)}
              </Text>
              <Text className="text-gray-400 text-sm">Missed</Text>
            </View>
          </View>
        </Card>

        {/* Menu Items */}
        <Card padding="none" className="mb-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              onPress={item.onPress}
              className={`flex-row items-center p-4 ${
                index < menuItems.length - 1 ? 'border-b border-gray-700' : ''
              }`}
            >
              <Ionicons name={item.icon as any} size={24} color="#9ca3af" />
              <Text className="text-white text-base ml-4 flex-1">
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500 p-4 rounded-lg mb-8 flex-row items-center justify-center"
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}