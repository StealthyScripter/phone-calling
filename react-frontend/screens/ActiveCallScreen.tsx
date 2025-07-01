import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert 
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Avatar } from '../components/Avatar';
import { Call } from '../types';
import { ApiService } from '../services/api';
import { socketService } from '../services/socket';

interface ActiveCallScreenProps {
  call: Call;
  onCallEnd: () => void;
}

export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({ call, onCallEnd }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callStatus, setCallStatus] = useState(call.status);

  useEffect(() => {
    // Timer for call duration
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    // Listen for call status updates
    const handleCallStatusUpdate = (data: any) => {
      if (data.callSid === call.callSid) {
        setCallStatus(data.status);
        if (data.status === 'completed' || data.status === 'failed') {
          onCallEnd();
        }
      }
    };

    const handleCallEnded = (data: any) => {
      if (data.callSid === call.callSid) {
        onCallEnd();
      }
    };

    socketService.on('callStatusUpdate', handleCallStatusUpdate);
    socketService.on('callEnded', handleCallEnded);

    return () => {
      clearInterval(timer);
      socketService.off('callStatusUpdate', handleCallStatusUpdate);
      socketService.off('callEnded', handleCallEnded);
    };
  }, [call.callSid, onCallEnd]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHangup = async () => {
    try {
      await ApiService.hangupCall(call.callSid);
      onCallEnd();
    } catch (error) {
      Alert.alert('Error', 'Failed to end call');
      console.error('Hangup error:', error);
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute functionality
  };

  const handleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // TODO: Implement actual speaker functionality
  };

  const getContactName = () => {
    // In a real app, you would look up the contact name from the phone number
    return call.to || call.from || 'Unknown';
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'ringing':
        return 'Ringing...';
      case 'in-progress':
        return formatDuration(duration);
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Call in progress';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Contact Info */}
      <View style={styles.contactSection}>
        <Avatar name={getContactName()} size={120} />
        <Text style={styles.contactName}>{getContactName()}</Text>
        <Text style={styles.contactNumber}>{call.to || call.from}</Text>
      </View>

      {/* Call Controls */}
      <View style={styles.controlsSection}>
        {/* Secondary Controls */}
        <View style={styles.secondaryControls}>
          <TouchableOpacity 
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={handleMute}
          >
            <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
            <Text style={styles.controlLabel}>Mute</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>⌨️</Text>
            <Text style={styles.controlLabel}>Keypad</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={handleSpeaker}
          >
            <Text style={styles.controlIcon}>📢</Text>
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Controls */}
        <View style={styles.primaryControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>➕</Text>
            <Text style={styles.controlLabel}>Add Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.hangupButton}
            onPress={handleHangup}
          >
            <Text style={styles.hangupIcon}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>👥</Text>
            <Text style={styles.controlLabel}>Contacts</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  contactSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  contactName: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  contactNumber: {
    color: Colors.textSecondary,
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  controlsSection: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  primaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
  },
  controlButtonActive: {
    backgroundColor: Colors.accent + '20',
    borderRadius: 20,
  },
  controlIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  controlLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  hangupButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangupIcon: {
    fontSize: 30,
    transform: [{ rotate: '225deg' }],
  },
});
