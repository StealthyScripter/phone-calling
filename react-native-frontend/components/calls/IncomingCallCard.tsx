import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { Avatar } from '../ui';
import { CallButton } from './CallButton';
import { formatPhoneNumber } from '../../lib/utils/formatters';

interface IncomingCallCardProps {
  callerName?: string;
  callerNumber: string;
  callerAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
  onMessage?: () => void;
  showMessageOptions?: boolean;
}

export const IncomingCallCard: React.FC<IncomingCallCardProps> = ({
  callerName,
  callerNumber,
  callerAvatar,
  onAccept,
  onDecline,
  onMessage,
  showMessageOptions = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation for avatar
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
  }, [pulseAnim, slideAnim]);

  const screenHeight = Dimensions.get('window').height;

  return (
    <Animated.View
      style={{
        transform: [
          {
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [screenHeight, 0],
            }),
          },
        ],
      }}
      className="absolute inset-0 bg-gray-900 flex-1 justify-center items-center z-50"
    >
      {/* Background overlay */}
      <View className="absolute inset-0 bg-black opacity-90" />

      {/* Content */}
      <View className="items-center z-10">
        <Text className="text-gray-400 text-lg mb-4">Incoming call</Text>

        {/* Caller Avatar with pulse effect */}
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
          className="mb-8"
        >
          <Avatar
            source={callerAvatar}
            name={callerName || callerNumber}
            size="xlarge"
          />
        </Animated.View>

        {/* Caller Info */}
        <Text className="text-white text-2xl font-semibold mb-2 text-center">
          {callerName || 'Unknown'}
        </Text>
        <Text className="text-gray-400 text-lg mb-12 text-center">
          {formatPhoneNumber(callerNumber)}
        </Text>

        {/* Quick Message Options */}
        {showMessageOptions && onMessage && (
          <View className="mb-8">
            <Text className="text-gray-400 text-center mb-4">Quick response</Text>
            <View className="flex-row space-x-4">
              {['Can\'t talk now', 'Call you back', 'On my way'].map((message) => (
                <TouchableOpacity
                  key={message}
                  onPress={() => onMessage()}
                  className="bg-gray-800 px-4 py-2 rounded-full"
                >
                  <Text className="text-white text-sm">{message}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row items-center space-x-12">
          <CallButton
            variant="decline"
            onPress={onDecline}
            size="large"
          />

          <CallButton
            variant="answer"
            onPress={onAccept}
            size="large"
          />
        </View>
      </View>
    </Animated.View>
  );
};