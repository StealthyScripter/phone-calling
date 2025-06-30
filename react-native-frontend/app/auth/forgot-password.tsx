import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { Input, Button } from '../../components/ui';
import { validateEmail } from '../../lib/utils/validators';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      // API call to send reset email
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setEmailSent(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center px-6">
          <AuthHeader
            title="Check Your Email"
            subtitle={`We've sent a password reset link to ${email}`}
            showLogo={false}
          />
          
          <Text className="text-gray-400 text-center mb-8 leading-6">
            Click the link in the email to reset your password. 
            If you don&#39;t see it, check your spam folder.
          </Text>

          <Button
            title="Back to Sign In"
            onPress={handleBackToLogin}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 justify-center px-6">
        <AuthHeader
          title="Reset Password"
          subtitle="Enter your email address and we'll send you a link to reset your password"
          showLogo={false}
        />

        <Input
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title="Send Reset Link"
          onPress={handleResetPassword}
          loading={loading}
          disabled={!email.trim()}
          className="mb-4"
        />

        <Button
          title="Back to Sign In"
          onPress={handleBackToLogin}
          variant="outline"
        />
      </View>
    </SafeAreaView>
  );
}
