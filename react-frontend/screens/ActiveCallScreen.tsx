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
  call: Call;
  onCallEnd: () => void;
}

export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({ call, onCallEnd }) => {
  const [duration, setDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('Connecting...');

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    // Simulate call stages
    setTimeout(() => setCallStatus('Ringing...'), 1000);
    setTimeout(() => setCallStatus('Connected'), 3000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getContactInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UK';
  };

  return (
    <LinearGradient
      colors={Colors.backgroundGradient}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.callInfo}>
          <Text style={styles.callStatus}>{callStatus}</Text>
          <Text style={styles.callSubStatus}>AI Route: Carrier A • HD Quality</Text>
          
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
          
          {callStatus === 'Connected' && (
            <>
              <Text style={styles.callDuration}>{formatDuration(duration)}</Text>
              <Text style={styles.savings}>Saving $0.18/min • Total saved: $0.46</Text>
            </>
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
    color: Colors.accent,
    marginBottom: 8,
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
  },
});
