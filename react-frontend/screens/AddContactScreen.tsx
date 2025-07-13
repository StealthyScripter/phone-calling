import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { BackIcon, StarIcon } from '../components/Icons';
import { ApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AddContactScreenProps {
  navigation: any;
  route?: any;
}

export const AddContactScreen: React.FC<AddContactScreenProps> = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    is_favorite: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { user } = useAuth();

  // Pre-fill phone number if passed from dialer
  React.useEffect(() => {
    if (route?.params?.phoneNumber) {
      setFormData(prev => ({ ...prev, phone: route.params.phoneNumber }));
    }
  }, [route?.params?.phoneNumber]);

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      // Basic phone validation - remove all non-digits
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 10) {
        newErrors.phone = 'Phone number must be at least 10 digits';
      } else if (digits.length > 15) {
        newErrors.phone = 'Phone number is too long';
      }
    }

    // Email validation (optional but validate format if provided)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    } else if (!digits.startsWith('+')) {
      return `+${digits}`;
    }
    
    return phone;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please log in to add contacts');
      return;
    }

    setIsLoading(true);
    try {
      const contactData = {
        name: formData.name.trim(),
        phone: formatPhoneNumber(formData.phone.trim()),
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        is_favorite: formData.is_favorite,
      };

      console.log('📝 Creating contact:', contactData);

      const newContact = await ApiService.createContact(contactData);

      if (newContact) {
        console.log('✅ Contact created successfully:', newContact);
        
        // Show success message
        Alert.alert(
          'Success', 
          'Contact added successfully!', 
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('Failed to create contact');
      }
    } catch (error: any) {
      console.error('❌ Failed to create contact:', error);
      
      let errorMessage = 'Failed to add contact';
      if (error.message?.includes('already exists')) {
        errorMessage = 'A contact with this phone number already exists';
      } else if (error.message?.includes('403') || error.message?.includes('401')) {
        errorMessage = 'Not authorized to add contacts - please log in again';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getContactInitials = (name: string): string => {
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'NC';
  };

  return (
    <LinearGradient colors={Colors.backgroundGradient} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <BackIcon size={20} color={Colors.accent} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Contact</Text>
            </View>

            {/* Contact Preview */}
            <View style={styles.contactPreview}>
              <LinearGradient
                colors={Colors.aiGradient}
                style={styles.previewAvatar}
              >
                <Text style={styles.previewAvatarText}>
                  {getContactInitials(formData.name || 'New Contact')}
                </Text>
              </LinearGradient>
              <Text style={styles.previewName}>
                {formData.name.trim() || 'New Contact'}
              </Text>
              <Text style={styles.previewPhone}>
                {formData.phone.trim() || 'No phone number'}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  placeholder="Enter contact name"
                  placeholderTextColor={Colors.textSecondary}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  value={formData.phone}
                  onChangeText={(text) => updateField('phone', text)}
                  placeholder="+1234567890"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  placeholder="email@example.com"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => updateField('notes', text)}
                  placeholder="Add notes about this contact..."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="done"
                />
              </View>

              {/* Favorite Toggle */}
              <TouchableOpacity 
                style={styles.favoriteToggle}
                onPress={() => updateField('is_favorite', !formData.is_favorite)}
                activeOpacity={0.8}
              >
                <View style={styles.favoriteToggleContent}>
                  <StarIcon 
                    size={24} 
                    color={formData.is_favorite ? Colors.accent : Colors.textSecondary}
                    filled={formData.is_favorite}
                  />
                  <Text style={styles.favoriteToggleText}>Add to Favorites</Text>
                </View>
                <View style={[
                  styles.favoriteToggleSwitch,
                  formData.is_favorite && styles.favoriteToggleSwitchActive
                ]}>
                  <View style={[
                    styles.favoriteToggleDot,
                    formData.is_favorite && styles.favoriteToggleDotActive
                  ]} />
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={Colors.aiGradient}
                    style={styles.saveButtonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.primary} size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Add Contact</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 50 },
  
  header: {
    marginBottom: 24,
  },
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 16 
  },
  backText: { color: Colors.accent, fontSize: 16 },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: Colors.textPrimary 
  },

  contactPreview: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatarText: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  previewName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  previewPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: Colors.accent 
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },

  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  favoriteToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favoriteToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  favoriteToggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  favoriteToggleSwitchActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  favoriteToggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.textSecondary,
    alignSelf: 'flex-start',
  },
  favoriteToggleDotActive: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
  },
  saveButtonDisabled: { 
    opacity: 0.6 
  },
  saveButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { 
    color: Colors.primary, 
    fontSize: 16, 
    fontWeight: '600' 
  },
});
