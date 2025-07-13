import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { BackIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, updateProfile } = useAuth();
  
  // Form state - properly initialized with current user data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    phoneNumber: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name || '',
        // Handle both phoneNumber and legacy phone field
        phoneNumber: user.phoneNumber || user.phone || '',
      });
    }
  }, [user]);

  // Track if form has changes
  useEffect(() => {
    if (user) {
      const currentPhone = user.phoneNumber || user.phone || '';
      const hasChanges = 
        formData.firstName !== (user.firstName || '') ||
        formData.lastName !== (user.lastName || '') ||
        formData.name !== (user.name || '') ||
        formData.phoneNumber !== currentPhone;
      
      setHasChanges(hasChanges);
    }
  }, [formData, user]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    // At least name or first/last name should be provided
    if (!formData.name.trim() && !formData.firstName.trim() && !formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Please provide at least a name or first/last name');
      return false;
    }

    // If phone is provided, do basic validation
    if (formData.phoneNumber.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        Alert.alert('Validation Error', 'Please enter a valid phone number');
        return false;
      }
    }

    return true;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Prepare update data - only include fields that have values
      const updateData: any = {};

      if (formData.firstName.trim()) {
        updateData.firstName = formData.firstName.trim();
      }
      
      if (formData.lastName.trim()) {
        updateData.lastName = formData.lastName.trim();
      }
      
      if (formData.name.trim()) {
        updateData.name = formData.name.trim();
      }
      
      if (formData.phoneNumber.trim()) {
        updateData.phoneNumber = formData.phoneNumber.trim();
      }

      // If no name is provided but we have first/last names, create combined name
      if (!updateData.name && (updateData.firstName || updateData.lastName)) {
        updateData.name = `${updateData.firstName || ''} ${updateData.lastName || ''}`.trim();
      }

      console.log('📝 Updating profile with data:', updateData);

      await updateProfile(updateData);
      
      Alert.alert('Success', 'Profile updated successfully');
      setHasChanges(false);
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      let errorMessage = 'Failed to update profile';
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const getDisplayName = (): string => {
    if (user?.name) return user.name;
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.username || user?.email || 'User';
  };

  const getInitials = (): string => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  };

  // Helper function to get creation date
  const getCreationDate = (): string => {
    if (!user) return 'Unknown';
    
    // Handle both camelCase and snake_case date formats
    const dateString = user.createdAt || user.created_at;
    if (!dateString) return 'Unknown';
    
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // Helper function to get last login date
  const getLastLoginDate = (): string => {
    if (!user?.lastLogin) return 'First time';
    
    try {
      return new Date(user.lastLogin).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  // Helper function to get current phone number
  const getCurrentPhone = (): string => {
    return user?.phoneNumber || user?.phone || '';
  };

  if (!user) {
    return (
      <LinearGradient colors={Colors.backgroundGradient} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorState}>
            <Text style={styles.errorText}>Please log in to view profile</Text>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.errorButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.backgroundGradient} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <BackIcon size={20} color={Colors.accent} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          {/* Profile Avatar */}
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={Colors.aiGradient}
              style={styles.profileAvatar}
            >
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </LinearGradient>
            <Text style={styles.profileName}>{getDisplayName()}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Text style={styles.profileStatus}>
              {user.role === 'ADMIN' ? 'Admin User' : 'Standard User'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textSecondary}
                editable={!isLoading}
              />
              <Text style={styles.helpText}>This will be displayed as your main name</Text>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>First Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.firstName}
                  onChangeText={(value) => updateField('firstName', value)}
                  placeholder="First name"
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Last Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.lastName}
                  onChangeText={(value) => updateField('lastName', value)}
                  placeholder="Last name"
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput
                style={[styles.formInput, styles.formInputDisabled]}
                value={user.email}
                placeholder="Email address"
                placeholderTextColor={Colors.textSecondary}
                editable={false}
              />
              <Text style={styles.helpText}>Email cannot be changed from this screen</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                value={formData.phoneNumber}
                onChangeText={(value) => updateField('phoneNumber', value)}
                placeholder="+1234567890"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            {/* Account Info */}
            <View style={styles.accountInfo}>
              <Text style={styles.accountInfoTitle}>Account Information</Text>
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Username:</Text>
                <Text style={styles.accountInfoValue}>{user.username || 'Not set'}</Text>
              </View>
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Member since:</Text>
                <Text style={styles.accountInfoValue}>{getCreationDate()}</Text>
              </View>
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Last login:</Text>
                <Text style={styles.accountInfoValue}>{getLastLoginDate()}</Text>
              </View>
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Current phone:</Text>
                <Text style={styles.accountInfoValue}>{getCurrentPhone() || 'Not set'}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[
                  styles.primaryButton,
                  (!hasChanges || isLoading) && styles.primaryButtonDisabled
                ]}
                onPress={handleUpdateProfile}
                disabled={!hasChanges || isLoading}
              >
                <LinearGradient
                  colors={(!hasChanges || isLoading) ? [Colors.cardBackground, Colors.cardBackground] : Colors.aiGradient}
                  style={styles.primaryButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.textSecondary} size="small" />
                  ) : (
                    <Text style={[
                      styles.primaryButtonText,
                      (!hasChanges || isLoading) && styles.primaryButtonTextDisabled
                    ]}>
                      {hasChanges ? 'Save Changes' : 'No Changes'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleSignOut}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 16 },
  scrollView: { flex: 1 },
  
  header: {
    paddingVertical: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backText: { color: Colors.accent, fontSize: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },

  profileHeader: { alignItems: 'center', paddingVertical: 32 },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { color: Colors.primary, fontSize: 36, fontWeight: '700' },
  profileName: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  profileEmail: { fontSize: 16, color: Colors.textSecondary, marginBottom: 4 },
  profileStatus: { fontSize: 14, color: Colors.accent },

  form: { flex: 1, paddingBottom: 100 },
  formGroup: { marginBottom: 20 },
  formGroupHalf: { flex: 1 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '500', color: Colors.accent, marginBottom: 8 },
  formInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  formInputDisabled: {
    backgroundColor: Colors.cardBackground,
    opacity: 0.6,
  },
  helpText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, fontStyle: 'italic' },

  accountInfo: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  accountInfoTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  accountInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  accountInfoLabel: { fontSize: 14, color: Colors.textSecondary },
  accountInfoValue: { fontSize: 14, color: Colors.textPrimary },

  actionButtons: { gap: 12, paddingBottom: 32 },
  primaryButton: { borderRadius: 12 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  primaryButtonTextDisabled: { color: Colors.textSecondary },
  
  secondaryButton: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },

  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  errorText: { color: Colors.textPrimary, fontSize: 18, textAlign: 'center' },
  errorButton: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  errorButtonText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
});
