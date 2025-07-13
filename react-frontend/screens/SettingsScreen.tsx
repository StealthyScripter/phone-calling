import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Switch,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { SettingsIcon, BrainIcon, BatteryIcon } from '../components/Icons';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [aiRouting, setAiRouting] = useState(true);
  const [hdVoice, setHdVoice] = useState(true);
  const [callRecording, setCallRecording] = useState(false);
  const [smartNotifications, setSmartNotifications] = useState(true);

  const settingsItems = [
    {
      title: 'Profile',
      subtitle: 'Manage your account',
      action: () => navigation.navigate('Profile'),
      type: 'navigation'
    },
    {
      title: 'AI Route Optimization',
      subtitle: 'Find best call routes automatically',
      action: () => setAiRouting(!aiRouting),
      type: 'toggle',
      value: aiRouting
    },
    {
      title: 'HD Voice',
      subtitle: 'Enhanced call quality',
      action: () => setHdVoice(!hdVoice),
      type: 'toggle',
      value: hdVoice
    },
    {
      title: 'Call Recording',
      subtitle: 'Record calls',
      action: () => setCallRecording(!callRecording),
      type: 'toggle',
      value: callRecording
    },
    {
      title: 'Notifications',
      subtitle: 'Turn on Notifications',
      action: () => setSmartNotifications(!smartNotifications),
      type: 'toggle',
      value: smartNotifications
    },
    {
      title: 'Data Usage',
      subtitle: 'Monitor and optimize usage',
      action: () => {},
      type: 'navigation'
    },
    {
      title: 'About SmartConnect',
      subtitle: 'Version 2.1.0',
      action: () => {},
      type: 'navigation'
    }
  ];

  const renderSettingItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.settingItem}
      onPress={item.action}
      activeOpacity={0.8}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
      </View>
      
      <View style={styles.settingAction}>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.action}
            trackColor={{ false: Colors.cardBackground, true: Colors.accent }}
            thumbColor={item.value ? Colors.primary : Colors.textSecondary}
            style={styles.switch}
          />
        ) : (
          <Text style={styles.navigationArrow}>→</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={Colors.backgroundGradient}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Optimize your experience</Text>
        </View>

        {/* AI Optimization Banner */}
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerContent}>
            <BrainIcon size={24} color={Colors.accent} />
            <View style={styles.aiBannerText}>
              <Text style={styles.aiBannerTitle}>AI Optimization Active</Text>
              <Text style={styles.aiBannerSubtitle}>
                Saving you 68% on average • $47.80 saved this month
              </Text>
            </View>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsList}>
          {settingsItems.map((item, index) => renderSettingItem(item, index))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusTime: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingVertical: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  aiBanner: {
    backgroundColor: Colors.savingsBackground,
    borderColor: Colors.savingsBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiBannerText: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  aiBannerSubtitle: {
    fontSize: 14,
    color: Colors.accent,
  },
  settingsList: {
    flex: 1,
    paddingTop: 8,
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
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  settingAction: {
    marginLeft: 16,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  navigationArrow: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
});
