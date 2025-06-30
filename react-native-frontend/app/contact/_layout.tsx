import React from 'react';
import { Stack } from 'expo-router';

export default function ContactLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1a1d29' },
      }}
    >
      <Stack.Screen name="add" />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="import" />
    </Stack>
  );
}
