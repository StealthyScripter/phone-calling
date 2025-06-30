import { useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { RegisterForm } from '../../components/auth/RegisterForm';

export default function RegisterScreen() {
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 py-8">
          <AuthHeader
            title="Create Account"
            subtitle="Join SmartConnect to start making smarter calls"
          />
          
          <RegisterForm onNavigateToLogin={handleNavigateToLogin} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
