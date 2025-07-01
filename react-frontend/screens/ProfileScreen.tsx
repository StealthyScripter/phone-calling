import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  Alert 
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { User, CallStats } from '../types';
import { ApiService } from '../services/api';

export const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Using userId 1 as default - in real app, get from auth context
      const [userData, statsData] = await Promise.all([
        ApiService.getUserDetails(1),
        ApiService.getUserCallStats(1)
      ]);
      setUser(userData);
      setCallStats(statsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
  }) => (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar name={user?.name || 'User'} size={100} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name || 'Unknown User'}</Text>
            <Text style={styles.phone}>{user?.phone || 'No phone number'}</Text>
            <Text style={styles.email}>{user?.email || 'No email'}</Text>
          </View>
          
          <Button 
            title="Edit Profile"
            onPress={() => Alert.alert('Edit Profile', 'Edit profile functionality coming soon!')}
            variant="secondary"
          />
        </View>

        {/* Call Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Statistics</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Calls"
              value={callStats?.totalCalls || 0}
              subtitle="All time"
            />
            
            <StatCard
              title="Talk Time"
              value={formatDuration(callStats?.totalDuration || 0)}
              subtitle="Total duration"
            />
            
            <StatCard
              title="Average Call"
              value={formatDuration(callStats?.averageDuration || 0)}
              subtitle="Per call"
            />
            
            <StatCard
              title="This Week"
              value="12"
              subtitle="Calls made"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionText}>Recent Calls</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Contacts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text>📞</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Called +1 (555) 987-6543</Text>
                <Text style={styles.activityTime}>2 hours ago • 5m 32s</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text>📱</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Missed call from John Smith</Text>
                <Text style={styles.activityTime}>4 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text>👥</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Added new contact: Sarah Johnson</Text>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  profileInfo: {
    alignItems: 'center',
    marginVertical: 16,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  phone: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: 2,
  },
  email: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  statValue: {
    color: Colors.accent,
    fontSize: 24,
    fontWeight: '700',
  },
  statTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  statSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  activityTime: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
