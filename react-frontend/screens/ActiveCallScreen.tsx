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
import { socketService } from '../services/socket';
import { Call } from '../types';

interface ActiveCallScreenProps {
  call?: Call;
  onCallEnd: () => Promise<void>;
  route?: any;
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
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);


  const handleMute = async () => {
  try {
    // Add API call for mute/unmute when backend supports it
    setIsMuted(!isMuted);
    console.log(`Call ${isMuted ? 'unmuted' : 'muted'}`);
    } catch (error) {
      console.error('Mute error:', error);
    }
  };

  const handleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    console.log(`Speaker ${isSpeakerOn ? 'off' : 'on'}`);
  };

  const handleHold = () => {
    setIsOnHold(!isOnHold);
    console.log(`Call ${isOnHold ? 'resumed' : 'on hold'}`);
  };

 // react-frontend/screens/ActiveCallScreen.tsx

useEffect(() => {
  if (!call) return;

  let timer: NodeJS.Timeout;
  
  // Set initial status based on call direction and current status
  if (call.direction === 'outgoing') {
    setCallStatus(call.status === 'initiated' ? 'Calling...' : call.status);
  } else {
    // For incoming calls that are accepted
    setCallStatus('Connected');
    setIsConnected(true);
    timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  }

  // Listen for real Twilio webhook events via WebSocket
  const handleCallStatusUpdate = (data: any) => {
    if (data.callSid === call.call_sid) {
      // Map Twilio statuses to user-friendly messages
      const statusMap: { [key: string]: string } = {
        'initiated': 'Calling...',
        'ringing': 'Ringing...',
        'in-progress': 'Connected',
        'answered': 'Connected',
        'completed': 'Call Ended',
        'failed': 'Call Failed',
        'busy': 'Busy',
        'no-answer': 'No Answer'
      };

      const newStatus = statusMap[data.status] || data.status;
      setCallStatus(newStatus);

      // Start timer when call is actually connected (from Twilio)
      if (data.status === 'answered' || data.status === 'in-progress') {
        setIsConnected(true);
        if (!timer) {
          timer = setInterval(() => {
            setDuration(prev => prev + 1);
          }, 1000);
        }
      }

      // Stop timer when call ends
      if (['completed', 'failed', 'busy', 'no-answer'].includes(data.status)) {
        if (timer) {
          clearInterval(timer);
        }
      }
    }
  };

  // Subscribe to real-time events
  socketService.on('callStatusUpdate', handleCallStatusUpdate);

  return () => {
    socketService.off('callStatusUpdate', handleCallStatusUpdate);
    if (timer) clearInterval(timer);
  };
}, [call?.call_sid]); // Changed dependency to call_sid

  useEffect(() => {
  if (call?.call_sid) {
    const handleStatusUpdate = (data: any) => {
      if (data.call_sid === call.call_sid) {
        setCallStatus(data.status);
        if (data.status === 'connected') {
          setIsConnected(true);
        }
      }
    };
    
    socketService.on('callStatusUpdate', handleStatusUpdate);
    
    return () => {
      socketService.off('callStatusUpdate', handleStatusUpdate);
    };
  }
}, [call?.call_sid]);

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
            <TouchableOpacity 
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={handleMute}>
              <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
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
            onPress={ () => {
              console.log('🔴 END CALL BUTTON PRESSED');
              console.log('🔴 onCallEnd function:', onCallEnd);
              console.log('🔴 About to call onCallEnd');
              onCallEnd();
            }}
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
  controlButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
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
