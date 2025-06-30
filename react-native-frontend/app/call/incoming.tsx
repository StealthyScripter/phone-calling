import React, { useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IncomingCallCard } from '../../components/calls/IncomingCallCard';
import { useCalls } from '../../hooks/useCalls';
import { audioManager } from '../../lib/utils/audio';

export default function IncomingCallScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { answerCall, rejectCall } = useCalls();

  const callSid = params.callSid as string;
  const callerName = params.callerName as string;
  const callerNumber = params.callerNumber as string;
  const callerAvatar = params.callerAvatar as string;

  useEffect(() => {
    // Prevent back button during incoming call
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    
    // Start ringtone
    audioManager.playRingtone();

    return () => {
      backHandler.remove();
      audioManager.stopRingtone();
    };
  }, []);

  const handleAccept = async () => {
    try {
      await answerCall(callSid);
      router.replace({
        pathname: '/call/active',
        params: { callSid, contactName: callerName, contactNumber: callerNumber },
      });
    } catch (error) {
      console.error('Failed to answer call:', error);
      router.back();
    }
  };

  const handleDecline = async () => {
    try {
      await rejectCall(callSid);
      router.back();
    } catch (error) {
      console.error('Failed to reject call:', error);
      router.back();
    }
  };

  const handleMessage = () => {
    // Quick message functionality
    handleDecline();
  };

  return (
    <View className="flex-1 bg-gray-900">
      <IncomingCallCard
        callerName={callerName}
        callerNumber={callerNumber}
        callerAvatar={callerAvatar}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onMessage={handleMessage}
        showMessageOptions={true}
      />
    </View>
  );
}
