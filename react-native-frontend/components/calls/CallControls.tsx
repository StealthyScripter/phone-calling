import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { twMerge } from 'tailwind-merge';

interface CallControlsProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  isSpeakerOn: boolean;
  onSpeakerToggle: () => void;
  isRecording?: boolean;
  onRecordToggle?: () => void;
  onKeypadPress: () => void;
  onAddCall?: () => void;
  showKeypad?: boolean;
  showRecord?: boolean;
  showAddCall?: boolean;
  className?: string;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  onMuteToggle,
  isSpeakerOn,
  onSpeakerToggle,
  isRecording = false,
  onRecordToggle,
  onKeypadPress,
  onAddCall,
  showKeypad = true,
  showRecord = false,
  showAddCall = false,
  className,
}) => {
  const ControlButton: React.FC<{
    icon: string;
    label: string;
    onPress: () => void;
    isActive?: boolean;
    disabled?: boolean;
  }> = ({ icon, label, onPress, isActive = false, disabled = false }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="items-center"
    >
      <View
        className={twMerge(
          'w-14 h-14 rounded-full items-center justify-center mb-2',
          isActive ? 'bg-green-500' : 'bg-gray-700',
          disabled && 'opacity-50'
        )}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={isActive ? 'white' : '#9ca3af'}
        />
      </View>
      <Text className="text-white text-xs text-center">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className={twMerge('flex-row justify-around items-center py-6', className)}>
      <ControlButton
        icon="mic-off"
        label="Mute"
        onPress={onMuteToggle}
        isActive={isMuted}
      />

      {showKeypad && (
        <ControlButton
          icon="keypad"
          label="Keypad"
          onPress={onKeypadPress}
        />
      )}

      <ControlButton
        icon="volume-high"
        label="Speaker"
        onPress={onSpeakerToggle}
        isActive={isSpeakerOn}
      />

      {showAddCall && onAddCall && (
        <ControlButton
          icon="add"
          label="Add Call"
          onPress={onAddCall}
        />
      )}

      {showRecord && onRecordToggle && (
        <ControlButton
          icon="radio-button-on"
          label="Record"
          onPress={onRecordToggle}
          isActive={isRecording}
        />
      )}
    </View>
  );
};
