import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { PhoneOffIcon } from '../components/Icons';
import { Call } from '../types';

interface ActiveCallScreenProps {
  call?: Call;
  onCallEnd: () => void;
  route?: any; // Using any to avoid complex typing
}

export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({ 
  call: propCall, 
  onCallEnd, 
  route 
}) => {
  // Use call from route params if available, otherwise fallback to prop
  const call = route?.params?.call || propCall;
  
  const [duration, setDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('Calling...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!call) return;

    let timer: NodeJS.Timeout;

    // Simulate call progression for outgoing calls
    if (call.direction === 'outgoing') {
      // Initial state
      setCallStatus('Calling...');
      
      // After 2 seconds, show ringing
      const ringingTimeout = setTimeout(() => {
        setCallStatus('Ringing...');
      }, 2000);

      // After 5 seconds, simulate call being answered
      const connectedTimeout = setTimeout(() => {
        setCallStatus('Connected');
        setIsConnected(true);
        // Start the timer when call is connected
        timer = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      }, 5000);

      return () => {
        clearTimeout(ringingTimeout);
        clearTimeout(connectedTimeout);
        if (timer) clearInterval(timer);
      };
    } else {
      // For incoming calls that are already answered
      setCallStatus('Connected');
      setIsConnected(true);
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      return () => {
        if (timer) clearInterval(timer);
      };
    }
  }, [call?.direction]);

  // Update call status based on call.status if it changes
  useEffect(() => {
    if (!call) return;
    
    if (call.status === 'in-progress' || call.status === 'completed') {
      setCallStatus('Connected');
      setIsConnected(true);
    } else if (call.status === 'ringing') {
      setCallStatus('Ringing...');
    } else if (call.status === 'initiated') {
      setCallStatus('Calling...');
    }
  }, [call?.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getContactInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UK';
  };

  const getCallStatusColor = () => {
    if (isConnected) return Colors.accent;
    return Colors.info;
  };

  const getAIRoutingText = () => {
    const routes = ['Carrier A', 'Carrier B', 'Carrier C'];
    const randomRoute = routes[Math.floor(Math.random() * routes.length)];
    return `AI Route: ${randomRoute} • HD Quality`;
  };

  // If no call data, show loading or error state
  if (!call) {
    return (
      <LinearGradient
        colors={Colors.backgroundGradient}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorState}>
            <Text style={styles.errorText}>Call data not available</Text>
            <TouchableOpacity onPress={onCallEnd} style={styles.errorButton}>
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
          <Text style={[styles.callStatus, { color: getCallStatusColor() }]}>
            {callStatus}
          </Text>
          <Text style={styles.callSubStatus}>{getAIRoutingText()}</Text>
          
          <View style={styles.callerAvatar}>
            <LinearGradient
              colors={Colors.aiGradient}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {getContactInitials(call.contact_name || 'Unknown')}
              </Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.callerName}>{call.contact_name || 'Unknown Caller'}</Text>
          <Text style={styles.callerNumber}>{call.phone_number}</Text>
          
          {/* Show duration only when connected */}
          {isConnected && (
            <>
              <Text style={styles.callDuration}>{formatDuration(duration)}</Text>
              <Text style={styles.savings}>
                Saving $0.18/min • Total saved: ${(duration * 0.003).toFixed(2)}
              </Text>
            </>
          )}
          
          {/* Show calling animation when not connected */}
          {!isConnected && (
            <View style={styles.callingIndicator}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          )}
        </View>

        {/* Call Controls */}
        <View style={styles.callControls}>
          <View style={styles.controlsGrid}>
            <TouchableOpacity style={[styles.controlButton, styles.muteButton]}>
              <Text style={styles.controlIcon}>🔇</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.holdButton]}>
              <Text style={styles.controlIcon}>⏸</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.speakerButton]}>
              <Text style={styles.controlIcon}>📢</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.keypadButton]}>
              <Text style={styles.controlIcon}>🔢</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.addButton]}>
              <Text style={styles.controlIcon}>➕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.recordButton]}>
              <Text style={styles.controlIcon}>⏺</Text>
            </TouchableOpacity>
          </View>
          
          {/* End Call Button */}
          <TouchableOpacity 
            style={styles.endCallButton}
            onPress={onCallEnd}
          >
            <PhoneOffIcon size={32} color={Colors.textPrimary} />
          </TouchableOpacity>
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
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  callSubStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 40,
  },
  callerAvatar: {
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 48,
    fontWeight: '700',
  },
  callerName: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  callerNumber: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  callDuration: {
    fontSize: 24,
    color: Colors.accent,
    fontWeight: '300',
    marginBottom: 8,
  },
  savings: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  callingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    opacity: 0.6,
  },
  callControls: {
    alignItems: 'center',
  },
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
    maxWidth: 240,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  muteButton: {},
  holdButton: {},
  speakerButton: {},
  keypadButton: {},
  addButton: {},
  recordButton: {},
  controlIcon: {
    fontSize: 24,
  },
  endCallButton: {
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
