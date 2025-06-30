import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { twMerge } from 'tailwind-merge';

interface CallButtonProps {
  onPress: () => void;
  disabled?: boolean;
  variant?: 'call' | 'hangup' | 'answer' | 'decline';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const CallButton: React.FC<CallButtonProps> = ({
  onPress,
  disabled = false,
  variant = 'call',
  size = 'large',
  className,
}) => {
  const sizeStyles = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20',
  };

  const iconSizes = {
    small: 20,
    medium: 28,
    large: 36,
  };

  const variantStyles = {
    call: 'bg-green-500',
    hangup: 'bg-red-500',
    answer: 'bg-green-500',
    decline: 'bg-red-500',
  };

  const icons = {
    call: 'call',
    hangup: 'call',
    answer: 'call',
    decline: 'call',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={twMerge(
        'rounded-full items-center justify-center shadow-lg',
        sizeStyles[size],
        variantStyles[variant],
        disabled && 'opacity-50',
        className
      )}
    >
      <Ionicons
        name={icons[variant] as any}
        size={iconSizes[size]}
        color="white"
      />
    </TouchableOpacity>
  );
};
