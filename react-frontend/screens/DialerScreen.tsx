import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Colors } from '../constants/Colors';
import { Button } from '../components/Button';
import { ApiService } from '../services/api';
import { socketService } from '../services/socket';

export const DialerScreen: React.FC = () => {
  const [number, setNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to socket on mount
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
      // Call initiated, socket will handle the response
    } catch (error) {
      Alert.alert('Error', 'Failed to make call');
      console.error('Call error:', error);
    }
  };

  const renderKeypadButton = (digit: string, letters?: string) => (
    <TouchableOpacity 
      style={styles.keypadButton}
      onPress={() => handleNumberPress(digit)}
    >
      <Text style={styles.keypadDigit}>{digit}</Text>
      {letters && <Text style={styles.keypadLetters}>{letters}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Indicator */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.accent : Colors.danger }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      {/* Number Display */}
      <View style={styles.numberDisplay}>
        <Text style={styles.numberText}>{number || 'Enter number'}</Text>
      </View>
      
      {/* Keypad */}
      <View style={styles.keypad}>
        <View style={styles.keypadRow}>
          {renderKeypadButton('1', '')}
          {renderKeypadButton('2', 'ABC')}
          {renderKeypadButton('3', 'DEF')}
        </View>
        <View style={styles.keypadRow}>
          {renderKeypadButton('4', 'GHI')}
          {renderKeypadButton('5', 'JKL')}
          {renderKeypadButton('6', 'MNO')}
        </View>
        <View style={styles.keypadRow}>
          {renderKeypadButton('7', 'PQRS')}
          {renderKeypadButton('8', 'TUV')}
          {renderKeypadButton('9', 'WXYZ')}
        </View>
        <View style={styles.keypadRow}>
          {renderKeypadButton('*', '')}
          {renderKeypadButton('0', '+')}
          {renderKeypadButton('#', '')}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.backspaceButton}
          onPress={handleBackspace}
          disabled={!number}
        >
          <Text style={styles.backspaceText}>⌫</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.callButton, !number && styles.callButtonDisabled]}
          onPress={handleCall}
          disabled={!number}
        >
          <Text style={styles.callButtonText}>📞</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  numberDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  numberText: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
  },
  keypad: {
    flex: 2,
    paddingHorizontal: 40,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  keypadButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  keypadDigit: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '400',
  },
  keypadLetters: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '300',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 40,
  },
  backspaceButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backspaceText: {
    color: Colors.textPrimary,
    fontSize: 24,
  },
  callButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonDisabled: {
    backgroundColor: Colors.secondary,
    opacity: 0.5,
  },
  callButtonText: {
    fontSize: 30,
  },
});
