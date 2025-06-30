import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthSelectors } from '../../store';

export default function TabLayout() {
  const { isLoggedIn } = useAuthSelectors();

  if (!isLoggedIn) {
    return null; // Will redirect to auth
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.brightGreen,
        tabBarInactiveTintColor: Colors.primary.lightGray,
        tabBarStyle: {
          backgroundColor: Colors.primary.darkBlue,
          borderTopColor: Colors.gray[800],
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dialer',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="keypad" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recent"
        options={{
          title: 'Recent',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
