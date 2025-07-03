import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Animated,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { PhoneIcon, PhoneOffIcon } from '../components/Icons';
import { Call } from '../types';
import { ApiService } from '../services/api';

interface IncomingCallScreenProps {
  call?: Call;
  onAccept: () => void;
  onReject: () => void;
  route?: any; // Using any to avoid complex typing
}

export const IncomingCallScreen: React.FC<IncomingCallScreenProps> = ({ 
  call: propCall,
  onAccept, 
  onReject,
  route
}) => {
  // Use call from route params if available, otherwise fallback to prop
  const call = route?.params?.call || propCall;
  
  const [pulseAnim] = useState(new Animated.Value(1));

  const handleAccept = async () => {
  if (call?.call_sid) {
    try {
      await ApiService.acceptCall(call.call_sid);
      onAccept();
    } catch (error) {
      console.error('Accept call error:', error);
      Alert.alert('Error', 'Failed to accept call');
    }
  }
};

const handleReject = async () => {
  if (call?.call_sid) {
    try {
      await ApiService.rejectCall(call.call_sid);
      onReject();
    } catch (error) {
      console.error('Reject call error:', error);
      Alert.alert('Error', 'Failed to reject call');
    }
  }
};

  useEffect(() => {
    // Create pulsing animation for incoming call
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const getContactInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UK';
  };

  // If no call data, show error state
  if (!call) {
    return (
      <LinearGradient
        colors={Colors.backgroundGradient}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorState}>
            <Text style={styles.errorText}>Call data not available</Text>
            <TouchableOpacity onPress={onReject} style={styles.errorButton}>
              <Text style={styles.errorButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={Colors.backgroundGradient}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.callInfo}>
          <Text style={styles.callStatus}>Incoming Call</Text>
          <Text style={styles.callSubStatus}>AI Route: Best Quality • HD Voice</Text>
          
          <Animated.View 
            style={[
              styles.callerAvatar,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <LinearGradient
              colors={Colors.aiGradient}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {getContactInitials(call.contact_name || 'Unknown')}
              </Text>
            </LinearGradient>
          </Animated.View>
          
          <Text style={styles.callerName}>{call.contact_name || 'Unknown Caller'}</Text>
          <Text style={styles.callerNumber}>{call.phone_number}</Text>
          
          <Text style={styles.callDetails}>
            International call • Estimated cost: $0.12/min
          </Text>
        </View>

        {/* Call Action Buttons */}
        <View style={styles.callActions}>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={onReject}
          >
            <PhoneOffIcon size={32} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={onAccept}
          >
            <LinearGradient
              colors={Colors.aiGradient}
              style={styles.acceptButtonGradient}
            >
              <PhoneIcon size={32} color={Colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Swipe Hint */}
        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>
            Swipe up to accept • Swipe down to decline
          </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  callInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callStatus: {
    fontSize: 18,
    color: Colors.accent,
    marginBottom: 8,
    fontWeight: '600',
  },
  callSubStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 60,
  },
  callerAvatar: {
    marginBottom: 32,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 56,
    fontWeight: '700',
  },
  callerName: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  callerNumber: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  callDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  rejectButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  acceptButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  acceptButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeHint: {
    alignItems: 'center',
    paddingTop: 20,
  },
  swipeHintText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  errorText: {
    color: Colors.textPrimary,
    fontSize: 18,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
