import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Input, Button } from '../ui';
import { ContactAvatar } from './ContactAvatar';
import { validateEmail, validatePhone } from '../../lib/utils/validators';

interface ContactFormData {
  name: string;
  phoneNumber: string;
  email: string;
  notes: string;
}

interface ContactFormProps {
  initialData?: Partial<ContactFormData>;
  onSubmit: (data: ContactFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: initialData?.name || '',
    phoneNumber: initialData?.phoneNumber || '',
    email: initialData?.email || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const updateField = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save contact');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-900" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        {/* Avatar Section */}
        <View className="items-center mb-8">
          <ContactAvatar
            name={formData.name}
            size="xlarge"
            className="mb-4"
          />
          <Button
            title="Add Photo"
            variant="outline"
            onPress={() => {
              // TODO: Implement photo picker
              Alert.alert('Coming Soon', 'Photo picker will be available soon.');
            }}
            className="px-6"
          />
        </View>

        {/* Form Fields */}
        <Input
          label="Full Name *"
          placeholder="Enter full name"
          value={formData.name}
          onChangeText={(value) => updateField('name', value)}
          error={errors.name}
        />

        <Input
          label="Phone Number *"
          placeholder="+1 (555) 123-4567"
          value={formData.phoneNumber}
          onChangeText={(value) => updateField('phoneNumber', value)}
          keyboardType="phone-pad"
          error={errors.phoneNumber}
        />

        <Input
          label="Email"
          placeholder="contact@example.com"
          value={formData.email}
          onChangeText={(value) => updateField('email', value)}
          keyboardType="email-address"
          error={errors.email}
        />

        <Input
          label="Notes"
          placeholder="Add notes about this contact..."
          value={formData.notes}
          onChangeText={(value) => updateField('notes', value)}
          multiline
          numberOfLines={4}
          error={errors.notes}
        />

        {/* Action Buttons */}
        <View className="flex-row space-x-4 mt-6">
          <Button
            title="Cancel"
            variant="outline"
            onPress={onCancel}
            className="flex-1"
          />
          <Button
            title={isEditing ? 'Update' : 'Save'}
            onPress={handleSubmit}
            loading={loading}
            className="flex-1"
          />
        </View>
      </View>
    </ScrollView>
  );
};
