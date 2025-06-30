import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePhone } from '../../lib/utils/validators';

interface RegisterFormProps {
  onNavigateToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onNavigateToLogin,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { register, loading } = useAuth();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register({
        email: formData.email,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again.');
    }
  };

  return (
    <ScrollView className="w-full" showsVerticalScrollIndicator={false}>
      <View className="flex-row space-x-3">
        <View className="flex-1">
          <Input
            label="First Name"
            placeholder="John"
            value={formData.firstName}
            onChangeText={(text) => updateField('firstName', text)}
            leftIcon={<Ionicons name="person-outline" size={20} color="#9ca3af" />}
            error={errors.firstName}
          />
        </View>
        <View className="flex-1">
          <Input
            label="Last Name"
            placeholder="Doe"
            value={formData.lastName}
            onChangeText={(text) => updateField('lastName', text)}
            error={errors.lastName}
          />
        </View>
      </View>

      <Input
        label="Email"
        placeholder="john@example.com"
        value={formData.email}
        onChangeText={(text) => updateField('email', text)}
        keyboardType="email-address"
        leftIcon={<Ionicons name="mail-outline" size={20} color="#9ca3af" />}
        error={errors.email}
      />

      <Input
        label="Username"
        placeholder="johndoe"
        value={formData.username}
        onChangeText={(text) => updateField('username', text.toLowerCase())}
        leftIcon={<Ionicons name="at-outline" size={20} color="#9ca3af" />}
        error={errors.username}
      />

      <Input
        label="Phone Number"
        placeholder="+1 (555) 123-4567"
        value={formData.phoneNumber}
        onChangeText={(text) => updateField('phoneNumber', text)}
        keyboardType="phone-pad"
        leftIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
        error={errors.phoneNumber}
      />

      <Input
        label="Password"
        placeholder="At least 8 characters"
        value={formData.password}
        onChangeText={(text) => updateField('password', text)}
        secureTextEntry
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />}
        error={errors.password}
      />

      <Input
        label="Confirm Password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChangeText={(text) => updateField('confirmPassword', text)}
        secureTextEntry
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />}
        error={errors.confirmPassword}
      />

      <TouchableOpacity
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        className="flex-row items-center mb-4"
      >
        <View className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
          agreedToTerms ? 'bg-green-400 border-green-400' : 'border-gray-400'
        }`}>
          {agreedToTerms && (
            <Ionicons name="checkmark" size={14} color="white" />
          )}
        </View>
        <Text className="text-gray-400 text-sm flex-1">
          I agree to the{' '}
          <Text className="text-green-400">Terms of Service</Text>
          {' '}and{' '}
          <Text className="text-green-400">Privacy Policy</Text>
        </Text>
      </TouchableOpacity>

      {errors.terms && (
        <Text className="text-red-500 text-sm mb-4">{errors.terms}</Text>
      )}

      <Button
        title="Create Account"
        onPress={handleRegister}
        loading={loading}
        className="mb-8"
      />

      <View className="flex-row justify-center">
        <Text className="text-gray-400 text-sm">
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={onNavigateToLogin}>
          <Text className="text-green-400 text-sm font-medium">
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};