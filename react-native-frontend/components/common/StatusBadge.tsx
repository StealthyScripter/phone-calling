import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'dnd' | 'calling' | 'idle';
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  showText = false,
  className,
}) => {
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      text: 'Online',
      icon: 'checkmark-circle',
    },
    offline: {
      color: 'bg-gray-500',
      text: 'Offline',
      icon: 'remove-circle',
    },
    busy: {
      color: 'bg-red-500',
      text: 'Busy',
      icon: 'do-not-disturb',
    },
    away: {
      color: 'bg-yellow-500',
      text: 'Away',
      icon: 'time',
    },
    dnd: {
      color: 'bg-red-600',
      text: 'Do Not Disturb',
      icon: 'do-not-disturb',
    },
    calling: {
      color: 'bg-blue-500',
      text: 'In Call',
      icon: 'call',
    },
    idle: {
      color: 'bg-orange-500',
      text: 'Idle',
      icon: 'moon',
    },
  };

  const sizeConfig = {
    small: {
      dot: 'w-2 h-2',
      container: 'px-2 py-1',
      text: 'text-xs',
      icon: 12,
    },
    medium: {
      dot: 'w-3 h-3',
      container: 'px-3 py-1',
      text: 'text-sm',
      icon: 16,
    },
    large: {
      dot: 'w-4 h-4',
      container: 'px-4 py-2',
      text: 'text-base',
      icon: 20,
    },
  };

  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  if (showText) {
    return (
      <View
        className={twMerge(
          'flex-row items-center rounded-full',
          config.color,
          sizes.container,
          className
        )}
      >
        <Ionicons
          name={config.icon as any}
          size={sizes.icon}
          color="white"
        />
        <Text className={twMerge('text-white font-medium ml-1', sizes.text)}>
          {config.text}
        </Text>
      </View>
    );
  }

  return (
    <View
      className={twMerge(
        'rounded-full',
        config.color,
        sizes.dot,
        className
      )}
    />
  );
};