
import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#00ff87',
  text,
  className,
}) => {
  return (
    <View className={twMerge('items-center justify-center p-4', className)}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-gray-400 mt-2 text-sm">{text}</Text>
      )}
    </View>
  );
};
