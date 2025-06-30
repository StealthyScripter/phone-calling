import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge } from '../ui';
import { formatPhoneNumber, formatDuration, formatCallTime } from '../../lib/utils/formatters';

interface CallHistoryItem {
  id: string;
  callSid: string;
  direction: 'inbound' | 'outbound';
  phoneNumber: string;
  contactName?: string;
  status: 'completed' | 'missed' | 'failed' | 'busy';
  duration: number;
  startedAt: string;
  endedAt?: string;
}

interface CallHistoryItemProps {
  call: CallHistoryItem;
  onPress: () => void;
  onCallPress: () => void;
  onInfoPress: () => void;
}

export const CallHistoryItem: React.FC<CallHistoryItemProps> = ({
  call,
  onPress,
  onCallPress,
  onInfoPress,
}) => {
  const getDirectionIcon = () => {
    const iconName = call.direction === 'outbound' ? 'call-outline' : 'call-outline';
    const color = call.status === 'missed' ? '#ef4444' : 
                  call.direction === 'outbound' ? '#00ff87' : '#3b82f6';
    return { name: iconName, color };
  };

  const getStatusBadge = () => {
    if (call.status === 'missed') return { text: 'Missed', variant: 'error' as const };
    if (call.status === 'failed') return { text: 'Failed', variant: 'error' as const };
    if (call.status === 'busy') return { text: 'Busy', variant: 'warning' as const };
    return null;
  };

  const directionIcon = getDirectionIcon();
  const statusBadge = getStatusBadge();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-3 px-4 border-b border-gray-800"
    >
      <Avatar
        name={call.contactName || call.phoneNumber}
        size="medium"
        className="mr-3"
      />

      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Ionicons
            name={directionIcon.name as any}
            size={16}
            color={directionIcon.color}
            style={{ transform: [{ rotate: call.direction === 'inbound' ? '135deg' : '0deg' }] }}
          />
          <Text className="text-white font-medium ml-2 flex-1">
            {call.contactName || formatPhoneNumber(call.phoneNumber)}
          </Text>
          {statusBadge && (
            <Badge
              text={statusBadge.text}
              variant={statusBadge.variant}
              size="small"
            />
          )}
        </View>

        <View className="flex-row items-center">
          <Text className="text-gray-400 text-sm">
            {formatCallTime(call.startedAt)}
          </Text>
          {call.duration > 0 && (
            <>
              <Text className="text-gray-400 text-sm mx-2">•</Text>
              <Text className="text-gray-400 text-sm">
                {formatDuration(call.duration)}
              </Text>
            </>
          )}
        </View>
      </View>

      <View className="flex-row items-center ml-3">
        <TouchableOpacity
          onPress={onInfoPress}
          className="p-2 mr-2"
        >
          <Ionicons name="information-circle-outline" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCallPress}
          className="p-2"
        >
          <Ionicons name="call" size={20} color="#00ff87" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
