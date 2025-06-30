import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../lib/utils/validators';

interface LoginFormProps {
  onNavigateToRegister: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onNavigateToRegister,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, loading } = useAuth();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again.');
    }
  };

  return (
    <View className="w-full">
      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors({ ...errors, email: undefined });
        }}
        keyboardType="email-address"
        leftIcon={<Ionicons name="mail-outline" size={20} color="#9ca3af" />}
        error={errors.email}
      />

      <Input
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors({ ...errors, password: undefined });
        }}
        secureTextEntry
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />}
        error={errors.password}
      />

      <TouchableOpacity onPress={onForgotPassword} className="self-end mb-6">
        <Text className="text-green-400 text-sm font-medium">
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <Button
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
        className="mb-6"
      />

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-gray-600" />
        <Text className="text-gray-400 px-4 text-sm">or</Text>
        <View className="flex-1 h-px bg-gray-600" />
      </View>

      <Button
        title="Sign in with Biometrics"
        onPress={() => {
          // TODO: Implement biometric login
          Alert.alert('Coming Soon', 'Biometric authentication will be available soon.');
        }}
        variant="outline"
        icon={<Ionicons name="finger-print" size={20} color="#00ff87" />}
        className="mb-8"
      />

      <View className="flex-row justify-center">
        <Text className="text-gray-400 text-sm">
          Don&#39;t have an account?{' '}
        </Text>
        <TouchableOpacity onPress={onNavigateToRegister}>
          <Text className="text-green-400 text-sm font-medium">
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
