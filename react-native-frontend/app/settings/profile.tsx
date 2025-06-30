import React, { useState } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/ui/Avatar';
import { Input, Button } from '../../components/ui';
import { useAuthSelectors } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../lib/utils/validators';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user } = useAuthSelectors();
  const { updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert('Coming Soon', 'Avatar change functionality will be available soon.');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header
        title="Edit Profile"
        showBackButton
        onLeftPress={() => router.back()}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View className="items-center py-8">
            <Avatar
              name={`${formData.firstName} ${formData.lastName}`}
              source={user?.avatar}
              size="xlarge"
              className="mb-4"
            />
            <Button
              title="Change Photo"
              variant="outline"
              onPress={handleChangeAvatar}
              className="px-6"
            />
          </View>

          {/* Form */}
          <View className="space-y-4">
            <Input
              label="First Name"
              placeholder="Enter first name"
              value={formData.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              error={errors.firstName}
            />

            <Input
              label="Last Name"
              placeholder="Enter last name"
              value={formData.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              error={errors.lastName}
            />

            <Input
              label="Email"
              placeholder="Enter email address"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              value={formData.phoneNumber}
              onChangeText={(value) => updateField('phoneNumber', value)}
              keyboardType="phone-pad"
              disabled
            />
          </View>

          <View className="py-8">
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              className="mb-4"
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => router.back()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
