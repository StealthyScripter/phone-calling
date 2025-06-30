import React from 'react';
import { Stack } from 'expo-router';

export default function CallLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1a1d29' },
        presentation: 'fullScreenModal',
      }}
    >
      <Stack.Screen name="incoming" />
      <Stack.Screen name="active" />
    </Stack>
  );
}
