import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity 
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Toggle } from '../components/Toggle';
import { Avatar } from '../components/Avatar';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    vibration: true,
    darkMode: true,
    autoAnswer: false,
    callRecording: false,
    voicemail: true,
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange 
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Toggle value={value} onValueChange={onValueChange} />
    </View>
  );

  const MenuButton = ({ 
    title, 
    subtitle, 
    onPress,
    showArrow = true 
  }: {
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.menuInfo}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileCard}>
            <Avatar name="John Doe" size={60} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>John Doe</Text>
              <Text style={styles.profilePhone}>+1 (555) 123-4567</Text>
              <Text style={styles.profileEmail}>john.doe@example.com</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Call Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Settings</Text>
          
          <SettingItem
            title="Auto Answer"
            subtitle="Automatically answer incoming calls"
            value={settings.autoAnswer}
            onValueChange={(value) => handleSettingChange('autoAnswer', value)}
          />
          
          <SettingItem
            title="Call Recording"
            subtitle="Record all calls automatically"
            value={settings.callRecording}
            onValueChange={(value) => handleSettingChange('callRecording', value)}
          />
          
          <SettingItem
            title="Voicemail"
            subtitle="Enable voicemail for missed calls"
            value={settings.voicemail}
            onValueChange={(value) => handleSettingChange('voicemail', value)}
          />
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingItem
            title="Push Notifications"
            subtitle="Get notified about incoming calls"
            value={settings.notifications}
            onValueChange={(value) => handleSettingChange('notifications', value)}
          />
          
          <SettingItem
            title="Vibration"
            subtitle="Vibrate for incoming calls"
            value={settings.vibration}
            onValueChange={(value) => handleSettingChange('vibration', value)}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <SettingItem
            title="Dark Mode"
            subtitle="Use dark theme"
            value={settings.darkMode}
            onValueChange={(value) => handleSettingChange('darkMode', value)}
          />
          
          <MenuButton
            title="Audio Quality"
            subtitle="HD Voice enabled"
            onPress={() => console.log('Audio quality pressed')}
          />
          
          <MenuButton
            title="Storage"
            subtitle="Manage call recordings and data"
            onPress={() => console.log('Storage pressed')}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <MenuButton
            title="Help & FAQ"
            onPress={() => console.log('Help pressed')}
          />
          
          <MenuButton
            title="Contact Support"
            onPress={() => console.log('Contact support pressed')}
          />
          
          <MenuButton
            title="Privacy Policy"
            onPress={() => console.log('Privacy policy pressed')}
          />
          
          <MenuButton
            title="Terms of Service"
            onPress={() => console.log('Terms pressed')}
          />
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <MenuButton
            title="App Version"
            subtitle="1.0.0"
            onPress={() => console.log('App version pressed')}
            showArrow={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  profilePhone: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  profileEmail: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  menuSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  arrow: {
    color: Colors.textSecondary,
    fontSize: 20,
    fontWeight: '300',
  },
});
