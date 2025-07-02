import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  StatusBar,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { PhoneIcon, BrainIcon, BatteryIcon } from '../components/Icons';
import { ApiService } from '../services/api';
import { socketService } from '../services/socket';

const { width, height } = Dimensions.get('window');

interface DialerScreenProps {
  navigation: any;
}

export const DialerScreen: React.FC<DialerScreenProps> = ({ navigation }) => {
  const [number, setNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const handleCallInitiated = (data: any) => {
      Alert.alert('Call Initiated', `Calling ${data.to}...`);
    };

    socketService.on('callInitiated', handleCallInitiated);

    return () => {
      socketService.off('callInitiated', handleCallInitiated);
    };
  }, []);

  const handleNumberPress = (digit: string) => {
    setNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setNumber(prev => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!number.trim()) return;

    try {
      await ApiService.makeCall(number);
      // Navigation to active call screen would happen here
    } catch (error) {
      Alert.alert('Error', 'Failed to make call');
      console.error('Call error:', error);
    }
  };

  const renderKeypadButton = (digit: string, letters?: string) => (
    <TouchableOpacity 
      key={digit}
      style={styles.keypadButton}
      onPress={() => handleNumberPress(digit)}
      activeOpacity={0.8}
    >
      <Text style={styles.keypadDigit}>{digit}</Text>
      {letters && <Text style={styles.keypadLetters}>{letters}</Text>}
    </TouchableOpacity>
  );

  const keypadData = [
    ['1', ''],
    ['2', 'ABC'],
    ['3', 'DEF'],
    ['4', 'GHI'],
    ['5', 'JKL'],
    ['6', 'MNO'],
    ['7', 'PQRS'],
    ['8', 'TUV'],
    ['9', 'WXYZ'],
    ['*', ''],
    ['0', '+'],
    ['#', '']
  ];

  return (
    <LinearGradient
      colors={Colors.backgroundGradient}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.safeArea}>
      
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SmartConnect</Text>
          <View style={styles.headerSubtitle}>
            <Text style={styles.subtitleText}>AI-Powered Calling</Text>
            <Text style={styles.aiBadge}>
            <BrainIcon size={12} color={Colors.primary} />
            <Text style={styles.aiBadgeText}>AI</Text>
            </Text>
            <View style={styles.aiBadge}>
            </View>
          </View>
        </View>

        {/* Cost Savings Section */}
        <View style={styles.costSavings}>
          <Text style={styles.savingsTitle}>Save up to 70% on calls to Africa</Text>
          <Text style={styles.savingsSubtitle}>AI optimizes routing for best rates</Text>
        </View>

        {/* Number Display */}
        <View style={styles.numberDisplay}>
          <Text style={styles.numberText}>
            {number || 'Enter number'}
          </Text>
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {keypadData.map((item, index) => {
            if (index % 3 === 0) {
              return (
                <View key={index} style={styles.keypadRow}>
                  {keypadData.slice(index, index + 3).map(([digit, letters]) =>
                    renderKeypadButton(digit, letters)
                  )}
                </View>
              );
            }
            return null;
          })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.backspaceButton]}
            onPress={handleBackspace}
            disabled={!number}
          >
            <Text style={styles.backspaceText}>⌫</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.callButton, 
              !number && styles.callButtonDisabled
            ]}
            onPress={handleCall}
            disabled={!number}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.accentSecondary]}
              style={styles.callButtonGradient}
            >
              <PhoneIcon size={24} color={Colors.primary} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.actionButton} />
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
    paddingHorizontal: 20,
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
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subtitleText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  aiBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  costSavings: {
    backgroundColor: Colors.savingsBackground,
    borderColor: Colors.savingsBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  savingsSubtitle: {
    color: Colors.accent,
    fontSize: 14,
    textAlign: 'center',
  },
  numberDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: 60,
  },
  numberText: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 2,
    textAlign: 'center',
  },
  keypad: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  keypadButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadDigit: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
  },
  keypadLetters: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '300',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backspaceButton: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  backspaceText: {
    color: Colors.textPrimary,
    fontSize: 24,
  },
  callButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  callButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonDisabled: {
    opacity: 0.5,
  },
});

