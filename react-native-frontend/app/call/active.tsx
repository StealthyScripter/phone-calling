import React, { useEffect, useState } from 'react';
import { View, Text, BackHandler, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { CallTimer } from '../../components/calls/CallTimer';
import { CallControls } from '../../components/calls/CallControls';
import { CallButton } from '../../components/calls/CallButton';
import { DialPad } from '../../components/calls/DialPad';
import { useCalls } from '../../hooks/useCalls';
import { formatPhoneNumber } from '../../lib/utils/formatters';

export default function ActiveCallScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [showKeypad, setShowKeypad] = useState(false);
  
  const { 
    activeCall, 
    endCall, 
    toggleMute, 
    toggleSpeaker, 
    sendDTMF,
    isMuted,
    isSpeakerOn,
    callState 
  } = useCalls();

  const callSid = params.callSid as string;
  const contactName = params.contactName as string;
  const contactNumber = params.contactNumber as string;

  useEffect(() => {
    // Prevent back button during active call
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'End Call',
        'Are you sure you want to end this call?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Call', style: 'destructive', onPress: handleEndCall },
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    // Navigate back when call ends
    if (callState === 'ended' || callState === 'failed') {
      router.back();
    }
  }, [callState]);

  const handleEndCall = async () => {
    try {
      await endCall();
      router.back();
    } catch (error) {
      console.error('Failed to end call:', error);
      router.back();
    }
  };

  const handleKeypadToggle = () => {
    setShowKeypad(!showKeypad);
  };

  const handleDTMFPress = (digit: string) => {
    sendDTMF(digit);
  };

  if (!activeCall) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 justify-between py-8">
        {/* Call Header */}
        <View className="items-center px-6">
          <Text className="text-gray-400 text-lg mb-4">
            {callState === 'connecting' ? 'Connecting...' : 
             callState === 'ringing' ? 'Ringing...' : 'Connected'}
          </Text>

          <Avatar
            name={contactName || contactNumber}
            size="xlarge"
            className="mb-6"
          />

          <Text className="text-white text-2xl font-semibold mb-2 text-center">
            {contactName || 'Unknown'}
          </Text>
          
          <Text className="text-gray-400 text-lg mb-4 text-center">
            {formatPhoneNumber(contactNumber)}
          </Text>

          {callState === 'connected' && (
            <CallTimer
              startTime={activeCall.startTime}
              isActive={true}
              fontSize="large"
              className="mb-4"
            />
          )}
        </View>

        {/* Keypad Overlay */}
        {showKeypad && (
          <View className="absolute inset-0 bg-gray-900 z-10">
            <SafeAreaView className="flex-1">
              <View className="flex-1 justify-center">
                <DialPad
                  onDigitPress={handleDTMFPress}
                  onDeletePress={() => {}}
                  showDeleteButton={false}
                />
                <View className="items-center mt-8">
                  <CallButton
                    onPress={handleKeypadToggle}
                    variant="hangup"
                    size="medium"
                  />
                </View>
              </View>
            </SafeAreaView>
          </View>
        )}

        {/* Call Controls */}
        <View className="px-6">
          <CallControls
            isMuted={isMuted}
            onMuteToggle={toggleMute}
            isSpeakerOn={isSpeakerOn}
            onSpeakerToggle={toggleSpeaker}
            onKeypadPress={handleKeypadToggle}
            showKeypad={true}
            showRecord={false}
            showAddCall={false}
          />

          {/* End Call Button */}
          <View className="items-center mt-8">
            <CallButton
              onPress={handleEndCall}
              variant="hangup"
              size="large"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
