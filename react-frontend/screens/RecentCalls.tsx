import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { PhoneIcon, PhoneCallIcon, BatteryIcon } from '../components/Icons';
import { CallHistory } from '../types';
import { ApiService } from '../services/api';

interface RecentCallsScreenProps {
  navigation: any;
}

export const RecentCallsScreen: React.FC<RecentCallsScreenProps> = ({ navigation }) => {
  const [recentCalls, setRecentCalls] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentCalls();
  }, []);

  const loadRecentCalls = async () => {
    try {
      setLoading(true);
      // Using userId 1 as default - in real app, get from auth context
      const callsData = await ApiService.getCallHistory(1);
      // Ensure callsData is always an array
      setRecentCalls(Array.isArray(callsData) ? callsData : []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load call history');
      console.error('Load calls error:', error);
      setRecentCalls([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (phone: string) => {
    try {
      await ApiService.makeCall(phone);
      Alert.alert('Call Initiated', `Calling ${phone}...`);
    } catch (error) {
      Alert.alert('Error', 'Failed to make call');
    }
  };

  const getContactInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getCallIcon = (direction: string) => {
    return direction === 'outgoing' ? '↗' : '↙';
  };

  const getCallTypeText = (direction: string, status: string) => {
    if (direction === 'outgoing') {
      return 'Outgoing';
    } else if (status === 'missed') {
      return 'Missed';
    } else {
      return 'Incoming';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const callDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - callDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return 'Yesterday';
  };

  const getSavingsText = () => {
    const savings = ['Saved $2.40', 'HD Quality', 'Saved $1.80', 'AI Routing'];
    return savings[Math.floor(Math.random() * savings.length)];
  };

  // Mock data for prototype - replace with actual API data
  const mockRecentCalls = [
    {
      id: 1,
      contact_name: 'Ahmed Kofi',
      phone_number: '+234 803 123 4567',
      direction: 'outgoing',
      status: 'completed',
      created_at: new Date(Date.now() - 120000).toISOString(), // 2 min ago
      duration: 180,
      location: 'Lagos, Nigeria'
    },
    {
      id: 2,
      contact_name: 'Maria Nkomo',
      phone_number: '+27 82 456 7890',
      direction: 'incoming',
      status: 'completed',
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      duration: 240,
      location: 'Cape Town, SA'
    },
    {
      id: 3,
      contact_name: 'John Doe',
      phone_number: '+254 701 234 567',
      direction: 'outgoing',
      status: 'completed',
      created_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      duration: 150,
      location: 'Nairobi, Kenya'
    },
    {
      id: 4,
      contact_name: 'Fatima Keita',
      phone_number: '+233 20 987 6543',
      direction: 'incoming',
      status: 'missed',
      created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      duration: 0,
      location: 'Accra, Ghana'
    }
  ];

  const displayCalls = recentCalls.length > 0 ? recentCalls : mockRecentCalls;

  const renderCallItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.callCard}
      onPress={() => handleCall(item.phone_number)}
      activeOpacity={0.8}
    >
      <View style={styles.callInfo}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={Colors.aiGradient}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getContactInitials(item.contact_name)}</Text>
          </LinearGradient>
        </View>
        <View style={styles.callDetails}>
          <Text style={styles.callerName}>{item.contact_name}</Text>
          <View style={styles.callMeta}>
            <Text style={styles.callDirection}>
              {getCallIcon(item.direction)} {getCallTypeText(item.direction, item.status)}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.callLocation}>{item.location}</Text>
          </View>
          <Text style={styles.callTime}>
            {getSavingsText()} • {getTimeAgo(item.created_at)}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.callButton}
        onPress={() => handleCall(item.phone_number)}
      >
        <LinearGradient
          colors={Colors.aiGradient}
          style={styles.callButtonGradient}
        >
          <PhoneIcon size={16} color={Colors.primary} />
        </LinearGradient>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Recent Calls</Text>
          <Text style={styles.headerSubtitle}>AI-optimized connections</Text>
        </View>

        {/* Recent Calls List */}
        <FlatList
          data={displayCalls}
          renderItem={renderCallItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.callsList}
          contentContainerStyle={styles.callsListContent}
          refreshing={loading}
          onRefresh={loadRecentCalls}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <PhoneCallIcon size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {loading ? 'Loading recent calls...' : 'No recent calls'}
              </Text>
              <Text style={styles.emptySubtext}>
                Make your first call to see it here
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
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
  callsList: {
    flex: 1,
  },
  callsListContent: {
    paddingBottom: 100,
    paddingTop: 16,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  callDetails: {
    flex: 1,
  },
  callerName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  callDirection: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  separator: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginHorizontal: 8,
  },
  callLocation: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  callTime: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  callButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 16,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
  },
});