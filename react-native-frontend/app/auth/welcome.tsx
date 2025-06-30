import { Link } from 'expo-router';
import React from 'react';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui';

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 justify-center items-center px-6">
        <Image
          source={require('../../assets/images/logo.png')}
          className="w-24 h-24 mb-8"
          resizeMode="contain"
        />
        
        <Text className="text-white text-3xl font-bold text-center mb-4">
          Welcome to SmartConnect
        </Text>
        
        <Text className="text-gray-400 text-lg text-center mb-12 leading-7">
          Make crystal clear calls with advanced AI-powered routing and cost savings tracking.
        </Text>

        <View className="w-full space-y-4">
          <Link href="/auth/login" asChild>
            <Button title="Sign In" />
          </Link>
          
          <Link href="/auth/register" asChild>
            <Button title="Create Account" variant="outline" />
          </Link>
        </View>

        <Text className="text-gray-500 text-sm text-center mt-8">
          By continuing, you agree to our{' '}
          <Text className="text-green-400">Terms of Service</Text>
          {' '}and{' '}
          <Text className="text-green-400">Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
