import React from 'react';
import { View, Image, Text } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
  source?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  className,
}) => {
  const sizeStyles = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24',
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-lg',
    xlarge: 'text-2xl',
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const generateColor = (name?: string) => {
    if (!name) return 'bg-gray-600';
    const colors = [
      'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <View
      className={twMerge(
        'rounded-full items-center justify-center',
        sizeStyles[size],
        !source && generateColor(name),
        className
      )}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          className={twMerge('rounded-full', sizeStyles[size])}
          resizeMode="cover"
        />
      ) : (
        <Text className={twMerge('text-white font-semibold', textSizes[size])}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

