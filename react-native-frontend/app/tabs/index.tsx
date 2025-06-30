import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DialerScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-20 h-20 bg-green-500 rounded-2xl items-center justify-center mb-6">
          <Text className="text-white text-2xl">📞</Text>
        </View>
        
        <Text className="text-white text-3xl font-bold text-center mb-4">
          SmartConnect
        </Text>
        
        <Text className="text-gray-400 text-lg text-center mb-8">
          Your phone calling app is ready!
        </Text>
        
        <View className="bg-green-500 px-6 py-3 rounded-lg">
          <Text className="text-white font-semibold">🎉 App Running!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}