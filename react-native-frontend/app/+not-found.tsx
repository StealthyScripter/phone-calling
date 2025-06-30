import React from 'react';
import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Button } from '../components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 bg-gray-900 items-center justify-center p-6">
        <Text className="text-white text-2xl font-bold mb-4">
          Screen not found
        </Text>
        <Text className="text-gray-400 text-base text-center mb-8 leading-6">
          This screen doesn't exist. Go back to the home screen.
        </Text>
        <Link href="/" asChild>
          <Button title="Go to home screen" />
        </Link>
      </View>
    </>
  );
}
