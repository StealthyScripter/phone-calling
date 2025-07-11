import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  StatusBar,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { PhoneIcon, BrainIcon } from '../components/Icons';
import { ApiService } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';

interface DialerScreenProps {
  navigation: any;
  onMakeCall: (phoneNumber: string, contactName?: string) => void;
}

export const DialerScreen: React.FC<DialerScreenProps> = ({ navigation, onMakeCall }) => {
  const [number, setNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      socketService.connect();
      setIsConnected(socketService.isConnected());

      const handleCallInitiated = (data: any) => {
        Alert.alert('Call Initiated', `Calling ${data.to}...`);
      };

      socketService.on('callInitiated', handleCallInitiated);

      return () => {
        socketService.off('callInitiated', handleCallInitiated);
      };
    }
  }, [user]);

  const handleNumberPress = (digit: string) => {
    setNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setNumber(prev => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!number.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please log in to make calls');
      return;
    }

    try {
      console.log('🔄 Making call with authenticated user:', user.id);
      // Use the authenticated API service method
      await ApiService.makeCallForCurrentUser(number.trim());
      // Also trigger the app-level call handling for UI state management
      onMakeCall(number.trim());
    } catch (error: any) {
      console.error('Call error:', error);
      Alert.alert('Error', error.message || 'Failed to make call');
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
    ['0', '+']
  ];

  return (
    <LinearGradient
      colors={Colors.backgroundGradient}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>SmartConnect</Text>
            <View style={styles.headerSubtitle}>
              <Text style={styles.subtitleText}>AI-Powered Calling</Text>
              <View style={styles.aiBadge}>
                <BrainIcon size={12} color={Colors.primary} />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
          </View>

          <View style={styles.costSavings}>
            <Text style={styles.savingsTitle}>Save up to 70% on calls to Africa</Text>
            <Text style={styles.savingsSubtitle}>AI optimizes routing for best rates</Text>
          </View>

          <View style={styles.numberDisplayContainer}>
            <View style={styles.numberDisplay}>
              <Text style={styles.numberText} numberOfLines={1} adjustsFontSizeToFit>
                {number || 'Enter number'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.backspaceButton, !number && styles.backspaceDisabled]}
              onPress={handleBackspace}
              disabled={!number}
            >
              <Text style={[styles.backspaceText, !number && styles.disabled]}>⌫</Text>
            </TouchableOpacity>
          </View> 

          <View style={styles.keypadContainer}>
            <View style={styles.keypad}>
              {[0, 1, 2].map(rowIndex => (
                <View key={rowIndex} style={styles.keypadRow}>
                  {keypadData.slice(rowIndex * 3, (rowIndex + 1) * 3).map(([digit, letters]) => (
                    renderKeypadButton(digit, letters)
                  ))}
                </View>
              ))}
              <View style={styles.keypadRow}>
                {renderKeypadButton('*', '')}
                {renderKeypadButton('0', '+')}
                {renderKeypadButton('#', '')}
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <View style={styles.actionSpacer} />
            
            <TouchableOpacity 
              style={[
                styles.callButton, 
                !number && styles.callButtonDisabled
              ]}
              onPress={handleCall}
              disabled={!number}
            >
              <LinearGradient
                colors={!number ? [Colors.cardBackground, Colors.cardBackground] : ['#00ff44', '#00cc88']}
                style={styles.callButtonGradient}
              >
                <PhoneIcon size={24} color={!number ? Colors.textSecondary : '#000000'} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.actionSpacer} />
          </View>
        </ScrollView>
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
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitleText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  aiBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  costSavings: {
    backgroundColor: Colors.savingsBackground,
    borderColor: Colors.savingsBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  savingsSubtitle: {
    color: Colors.accent,
    fontSize: 12,
    textAlign: 'center',
  },
  numberDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 16,
    minHeight: 50,
    paddingHorizontal: 8,
  },
  numberDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 1,
    textAlign: 'center',
    maxWidth: '90%',
  },
  backspaceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  backspaceDisabled: {
    opacity: 0.3,
  },
  backspaceText: {
    color: Colors.textPrimary,
    fontSize: 18,
  },
  disabled: {
    opacity: 0.3,
  },
  keypadContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  keypad: {
    alignItems: 'center',
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    width: '100%',
    maxWidth: 280,
  },
  keypadButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadDigit: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  keypadLetters: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '300',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 80, // Space for bottom navigation
  },
  actionSpacer: {
    flex: 1,
  },
  callButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    elevation: 8,
    shadowColor: '#00ff44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  callButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
});