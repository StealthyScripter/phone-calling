import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { PhoneIcon, PhoneCallIcon } from '../components/Icons';
import { CallHistory } from '../types';
import { ApiService } from '../services/api';

interface RecentCallsScreenProps {
  navigation: any;
  onMakeCall?: (phoneNumber: string, contactName?: string) => void;
}

export const RecentCallsScreen: React.FC<RecentCallsScreenProps> = ({ 
  navigation, 
  onMakeCall 
}) => {
  const [recentCalls, setRecentCalls] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    // Initialize user - in production, get from auth context
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      // TODO: Replace with actual auth context
      // const { user } = useAuth();
      // setCurrentUserId(user?.id);
      
      // For demo, try to get first user or default to 1
      const userId = 1; // This should come from your auth system
      setCurrentUserId(userId);
      
      if (userId) {
        await loadRecentCalls(userId);
      }
    } catch (error) {
      console.warn('Failed to initialize user:', error);
      setError('Authentication required');
    }
  };

  const loadRecentCalls = async (userId: number) => {
    if (loading) return; // Prevent multiple simultaneous requests
    
    try {
      setLoading(true);
      setError(null);
      
      const callsData = await ApiService.getCallHistory(userId);
      
      // Ensure we always get an array
      const calls = Array.isArray(callsData) ? callsData : [];
      setRecentCalls(calls);
      
    } catch (error: any) {
      console.warn('Failed to load call history:', error);
      
      // Handle different error types gracefully
      if (error.message?.includes('404')) {
        setError('Call history not available');
      } else if (error.message?.includes('403')) {
        setError('Access denied');
      } else if (error.message?.includes('500')) {
        setError('Server error - please try again later');
      } else {
        setError('Unable to load call history');
      }
      
      // Set empty array on any error
      setRecentCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (phone: string, contactName?: string) => {
    if (!phone?.trim()) return;
    
    try {
      if (!currentUserId) {
        setError('Please log in to make calls');
        return;
      }
      
      // Use the parent's onMakeCall if provided, otherwise use API directly
      if (onMakeCall) {
        onMakeCall(phone, contactName);
      } else {
        await ApiService.makeCall(phone, currentUserId);
      }
      
      console.log(`Initiated call to ${phone}`);
      
    } catch (error: any) {
      console.warn('Failed to make call:', error);
      
      // Don't show error alert - let the UI handle it naturally
      if (error.message?.includes('404')) {
        setError('Calling service not available');
      }
    }
  };

  const handleRefresh = async () => {
    if (currentUserId) {
      await loadRecentCalls(currentUserId);
    }
  };

  const getContactInitials = (name: string | null | undefined): string => {
    if (!name?.trim()) return 'UK';
    
    try {
      return name
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    } catch {
      return 'UK';
    }
  };

  const getCallIcon = (direction: string): string => {
    return direction === 'outgoing' ? '↗' : '↙';
  };

  const getCallTypeText = (direction: string, status: string): string => {
    try {
      if (direction === 'outgoing') {
        return 'Outgoing';
      } else if (status === 'missed') {
        return 'Missed';
      } else {
        return 'Incoming';
      }
    } catch {
      return 'Call';
    }
  };

  const getTimeAgo = (date: string): string => {
    try {
      const now = new Date();
      const callDate = new Date(date);
      
      if (isNaN(callDate.getTime())) return 'Unknown time';
      
      const diffInMinutes = Math.floor((now.getTime() - callDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
      if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      }
      if (diffInMinutes < 2880) return 'Yesterday';
      
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } catch {
      return 'Unknown time';
    }
  };

  const getCallDuration = (duration: number): string | null => {
    try {
      if (!duration || duration === 0) return null;
      
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      if (minutes === 0) {
        return `${seconds}s`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch {
      return null;
    }
  };

  const getCallStatusText = (item: CallHistory): string => {
    try {
      const parts: string[] = [];
      
      // Add duration if available
      const duration = getCallDuration(item.duration);
      if (duration) {
        parts.push(duration);
      }
      
      // Add status-based text
      if (item.status === 'completed' && duration) {
        parts.push('Completed');
      } else if (item.status === 'missed') {
        parts.push('Missed call');
      } else if (item.status === 'failed') {
        parts.push('Failed');
      } else {
        parts.push('Ended');
      }
      
      return parts.length > 0 ? parts.join(' • ') : 'Call ended';
    } catch {
      return 'Call ended';
    }
  };

  const formatPhoneNumber = (phoneNumber: string): string => {
    try {
      if (!phoneNumber) return 'Unknown number';
      
      // Basic phone number formatting for US numbers
      if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
        const digits = phoneNumber.slice(2);
        return `+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      }
      
      return phoneNumber;
    } catch {
      return 'Unknown number';
    }
  };

  const renderCallItem = ({ item }: { item: CallHistory }) => (
    <TouchableOpacity 
      style={styles.callCard}
      onPress={() => handleCall(item.phone_number, item.contact_name)}
      activeOpacity={0.8}
    >
      <View style={styles.callInfo}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={Colors.aiGradient}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {getContactInitials(item.contact_name)}
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.callDetails}>
          <Text style={styles.callerName} numberOfLines={1}>
            {item.contact_name || 'Unknown Contact'}
          </Text>
          
          <View style={styles.callMeta}>
            <Text style={styles.callDirection}>
              {getCallIcon(item.direction)} {getCallTypeText(item.direction, item.status)}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.phoneNumber} numberOfLines={1}>
              {formatPhoneNumber(item.phone_number)}
            </Text>
          </View>
          
          <Text style={styles.callTime}>
            {getCallStatusText(item)} • {getTimeAgo(item.created_at)}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.callButton}
        onPress={() => handleCall(item.phone_number, item.contact_name)}
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <PhoneCallIcon size={48} color={Colors.textSecondary} />
      
      {error ? (
        <>
          <Text style={styles.emptyText}>Unable to load calls</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </>
      ) : loading ? (
        <>
          <Text style={styles.emptyText}>Loading calls...</Text>
          <Text style={styles.emptySubtext}>Please wait</Text>
        </>
      ) : !currentUserId ? (
        <>
          <Text style={styles.emptyText}>Sign in required</Text>
          <Text style={styles.emptySubtext}>Please sign in to view your call history</Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyText}>No recent calls</Text>
          <Text style={styles.emptySubtext}>Make your first call to see it here</Text>
        </>
      )}
    </View>
  );

  const getHeaderSubtitle = (): string => {
    if (error) return 'Unable to load';
    if (loading) return 'Loading...';
    if (recentCalls.length === 0) return '';
    if (recentCalls.length === 1) return '1 call';
    return `${recentCalls.length} calls`;
  };

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
          <Text style={styles.headerSubtitle}>
            {getHeaderSubtitle()}
          </Text>
        </View>

        {/* Calls List */}
        <FlatList
          data={recentCalls}
          renderItem={renderCallItem}
          keyExtractor={(item) => `call-${item.id}`}
          style={styles.callsList}
          contentContainerStyle={[
            styles.callsListContent,
            recentCalls.length === 0 && styles.emptyListContent
          ]}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
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
  emptyListContent: {
    flexGrow: 1,
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
    minWidth: 0,
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
    minWidth: 0,
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
    minWidth: 0,
  },
  callDirection: {
    color: Colors.textSecondary,
    fontSize: 14,
    flexShrink: 0,
  },
  separator: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginHorizontal: 8,
    flexShrink: 0,
  },
  phoneNumber: {
    color: Colors.textSecondary,
    fontSize: 14,
    flex: 1,
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
    marginLeft: 12,
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
    paddingHorizontal: 32,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: Colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});