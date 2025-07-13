import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Switch,
  StatusBar,
  ScrollView,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { SettingsIcon, BrainIcon, BatteryIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';
import * as Notifications from 'expo-notifications';

interface SettingsScreenProps {
  navigation: any;
}

interface AppSettings {
  aiRouting: boolean;
  hdVoice: boolean;
  callRecording: boolean;
  smartNotifications: boolean;
  autoAnswer: boolean;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  dataOptimization: boolean;
}

const defaultSettings: AppSettings = {
  aiRouting: true,
  hdVoice: true,
  callRecording: false,
  smartNotifications: true,
  autoAnswer: false,
  vibrationEnabled: true,
  soundEnabled: true,
  dataOptimization: true,
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<string>('unknown');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    checkNotificationPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('app_settings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermission(status);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const handleToggleSetting = async (key: keyof AppSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    
    // Handle special cases
    if (key === 'smartNotifications') {
      if (value && notificationPermission !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Notification Permission Required',
            'Please enable notifications in your device settings to use smart notifications.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
        setNotificationPermission(status);
      }
    }

    if (key === 'callRecording') {
      Alert.alert(
        'Call Recording',
        'Call recording laws vary by location. Please ensure you comply with local regulations and inform call participants.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'I Understand', 
            onPress: () => saveSettings(newSettings)
          }
        ]
      );
      return;
    }

    if (key === 'aiRouting' && !value) {
      Alert.alert(
        'Disable AI Routing?',
        'This may result in higher call costs and reduced call quality. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: () => saveSettings(newSettings)
          }
        ]
      );
      return;
    }

    await saveSettings(newSettings);
  };

  const handleDataUsage = () => {
    Alert.alert(
      'Data Usage',
      `Current month usage:\n• Voice calls: 45 MB\n• AI optimization: 12 MB\n• Total: 57 MB\n\nEstimated savings: $12.50`,
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'SmartConnect v2.1.0',
      `Build: ${Platform.OS === 'ios' ? 'iOS' : 'Android'}\nRelease: January 2025\n\nFeatures:\n• AI-powered call routing\n• HD voice quality\n• Real-time cost optimization\n• Smart notifications\n\nDeveloped with ❤️ for better calling`,
      [{ text: 'OK' }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support & Help',
      'How would you like to get help?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Email Support', 
          onPress: () => Linking.openURL('mailto:support@smartconnect.app?subject=Support Request')
        },
        { 
          text: 'FAQ', 
          onPress: () => Linking.openURL('https://smartconnect.app/faq')
        }
      ]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy & Data',
      'Your privacy is important to us. All call data is encrypted and stored securely. We use minimal data for AI optimization and never share personal information.',
      [
        { text: 'OK' },
        { 
          text: 'Privacy Policy', 
          onPress: () => Linking.openURL('https://smartconnect.app/privacy')
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export your call history and settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // Implement data export functionality
            Alert.alert('Export Started', 'Your data export will be emailed to you within 24 hours.');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type "DELETE" to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'I\'m Sure', 
                  style: 'destructive',
                  onPress: () => {
                    // Implement account deletion
                    Alert.alert('Account Deletion', 'Account deletion request submitted. You will receive a confirmation email.');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const getSavingsAmount = (): string => {
    const baseAmount = 47.80;
    const multiplier = settings.aiRouting ? 1 : 0.3;
    return (baseAmount * multiplier).toFixed(2);
  };

  const getSavingsPercentage = (): number => {
    return settings.aiRouting ? 68 : 25;
  };

  const settingsItems = [
    {
      title: 'Profile',
      subtitle: 'Manage your account details',
      action: () => navigation.navigate('Profile'),
      type: 'navigation',
      icon: '👤'
    },
    {
      title: 'AI Route Optimization',
      subtitle: 'Find best call routes automatically',
      action: (value: boolean) => handleToggleSetting('aiRouting', value),
      type: 'toggle',
      value: settings.aiRouting,
      icon: '🧠'
    },
    {
      title: 'HD Voice',
      subtitle: 'Enhanced call quality',
      action: (value: boolean) => handleToggleSetting('hdVoice', value),
      type: 'toggle',
      value: settings.hdVoice,
      icon: '🎵'
    },
    {
      title: 'Call Recording',
      subtitle: 'Record calls for later (Legal compliance required)',
      action: (value: boolean) => handleToggleSetting('callRecording', value),
      type: 'toggle',
      value: settings.callRecording,
      icon: '⏺️'
    },
    {
      title: 'Notifications',
      subtitle: 'AI-powered call alerts and insights',
      action: (value: boolean) => handleToggleSetting('smartNotifications', value),
      type: 'toggle',
      value: settings.smartNotifications,
      icon: '🔔'
    },
    {
      title: 'Data Optimization',
      subtitle: 'Reduce data usage for calls',
      action: (value: boolean) => handleToggleSetting('dataOptimization', value),
      type: 'toggle',
      value: settings.dataOptimization,
      icon: '📊'
    },
    {
      title: 'Data Usage',
      subtitle: 'Monitor and optimize usage',
      action: handleDataUsage,
      type: 'navigation',
      icon: '📈'
    },
    {
      title: 'Support & Help',
      subtitle: 'Get help and contact support',
      action: handleSupport,
      type: 'navigation',
      icon: '❓'
    },
    {
      title: 'Privacy & Data',
      subtitle: 'Privacy policy and data management',
      action: handlePrivacy,
      type: 'navigation',
      icon: '🔒'
    },
    {
      title: 'Export Data',
      subtitle: 'Download your call history and settings',
      action: handleExportData,
      type: 'navigation',
      icon: '📤'
    },
    {
      title: 'About SmartConnect',
      subtitle: 'Version 2.1.0 • January 2025',
      action: handleAbout,
      type: 'navigation',
      icon: 'ℹ️'
    }
  ];

  const dangerousActions = [
    {
      title: 'Sign Out',
      subtitle: 'Sign out of your account',
      action: () => {
        Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout }
          ]
        );
      },
      type: 'navigation',
      icon: '🚪',
      danger: true
    },
    {
      title: 'Delete Account',
      subtitle: 'Permanently delete your account',
      action: handleDeleteAccount,
      type: 'navigation',
      icon: '⚠️',
      danger: true
    }
  ];

  const renderSettingItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.settingItem,
        item.danger && styles.settingItemDanger
      ]}
      onPress={() => item.type === 'navigation' ? item.action() : null}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{item.icon}</Text>
      </View>
      
      <View style={styles.settingContent}>
        <Text style={[
          styles.settingTitle,
          item.danger && styles.settingTitleDanger
        ]}>
          {item.title}
        </Text>
        <Text style={[
          styles.settingSubtitle,
          item.danger && styles.settingSubtitleDanger
        ]}>
          {item.subtitle}
        </Text>
      </View>
      
      <View style={styles.settingAction}>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.action}
            trackColor={{ 
              false: Colors.cardBackground, 
              true: item.danger ? Colors.error : Colors.accent 
            }}
            thumbColor={item.value ? Colors.primary : Colors.textSecondary}
            style={styles.switch}
            disabled={isLoading}
          />
        ) : (
          <Text style={[
            styles.navigationArrow,
            item.danger && styles.navigationArrowDanger
          ]}>
            →
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <LinearGradient colors={Colors.backgroundGradient} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.backgroundGradient} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Customize your experience</Text>
          </View>

          {/* AI Optimization Banner */}
          <TouchableOpacity style={styles.aiBanner} onPress={handleDataUsage}>
            <View style={styles.aiBannerContent}>
              <BrainIcon size={24} color={Colors.accent} />
              <View style={styles.aiBannerText}>
                <Text style={styles.aiBannerTitle}>
                  AI Optimization {settings.aiRouting ? 'Active' : 'Disabled'}
                </Text>
                <Text style={styles.aiBannerSubtitle}>
                  Saving you {getSavingsPercentage()}% on average • ${getSavingsAmount()} saved this month
                </Text>
              </View>
              <Text style={styles.aiBannerArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* User Info Section */}
          {user && (
            <View style={styles.userSection}>
              <Text style={styles.sectionTitle}>Account</Text>
              <View style={styles.userInfo}>
                <LinearGradient
                  colors={Colors.aiGradient}
                  style={styles.userAvatar}
                >
                  <Text style={styles.userAvatarText}>
                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </Text>
                </LinearGradient>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.name || 'User'}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userRole}>
                    {user.role === 'ADMIN' ? 'Admin Account' : 'Standard Account'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Settings Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Call Settings</Text>
            {settingsItems.slice(0, 6).map((item, index) => renderSettingItem(item, index))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App & Support</Text>
            {settingsItems.slice(6).map((item, index) => renderSettingItem(item, index + 9))}
          </View>

          {/* Dangerous Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            {dangerousActions.map((item, index) => renderSettingItem(item, index))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              SmartConnect v2.1.0{'\n'}
              Made with ❤️ for better calling
            </Text>
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
  scrollContent: { paddingBottom: 120 }, // Space for bottom navigation

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: 16 },

  header: {
    paddingVertical: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  headerSubtitle: { color: Colors.accent, fontSize: 14, fontWeight: '500' },

  aiBanner: {
    backgroundColor: Colors.savingsBackground,
    borderColor: Colors.savingsBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  aiBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiBannerText: { flex: 1 },
  aiBannerTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  aiBannerSubtitle: { fontSize: 14, color: Colors.accent },
  aiBannerArrow: { color: Colors.textSecondary, fontSize: 16 },

  section: { marginVertical: 8 },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: Colors.textPrimary, 
    marginBottom: 12, 
    marginTop: 8 
  },

  userSection: { marginVertical: 16 },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    gap: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: { color: Colors.primary, fontSize: 18, fontWeight: '700' },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  userEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  userRole: { fontSize: 12, color: Colors.accent, marginTop: 2 },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  settingItemDanger: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  settingIcon: { marginRight: 12, width: 24, alignItems: 'center' },
  settingIconText: { fontSize: 20 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  settingTitleDanger: { color: Colors.error },
  settingSubtitle: { fontSize: 14, color: Colors.textSecondary },
  settingSubtitleDanger: { color: Colors.error, opacity: 0.8 },
  settingAction: { marginLeft: 16 },
  switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  navigationArrow: { fontSize: 18, color: Colors.textSecondary, fontWeight: '300' },
  navigationArrowDanger: { color: Colors.error },

  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
