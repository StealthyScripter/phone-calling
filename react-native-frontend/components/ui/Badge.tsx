import React from 'react';
import { View, Text } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  text: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
  size?: 'small' | 'medium';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'medium',
  className,
}) => {
  const variantStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    default: 'bg-gray-600',
  };

  const sizeStyles = {
    small: 'px-2 py-1',
    medium: 'px-3 py-1',
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
  };

  return (
    <View
      className={twMerge(
        'rounded-full items-center justify-center',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      <Text className={twMerge('text-white font-medium', textSizes[size])}>
        {text}
      </Text>
    </View>
  );
};
