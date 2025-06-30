import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { twMerge } from 'tailwind-merge';

interface ContactAvatarProps {
  name?: string;
  imageUri?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPress?: () => void;
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

export const ContactAvatar: React.FC<ContactAvatarProps> = ({
  name,
  imageUri,
  size = 'medium',
  onPress,
  isOnline = false,
  showStatus = false,
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

  const statusSizes = {
    small: 'w-2 h-2 -bottom-0.5 -right-0.5',
    medium: 'w-3 h-3 -bottom-0.5 -right-0.5',
    large: 'w-4 h-4 -bottom-1 -right-1',
    xlarge: 'w-5 h-5 -bottom-1 -right-1',
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
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500',
      'bg-teal-500', 'bg-cyan-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const AvatarContent = () => (
    <View className="relative">
      <View
        className={twMerge(
          'rounded-full items-center justify-center',
          sizeStyles[size],
          !imageUri && generateColor(name),
          className
        )}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className={twMerge('rounded-full', sizeStyles[size])}
            resizeMode="cover"
          />
        ) : (
          <Text className={twMerge('text-white font-semibold', textSizes[size])}>
            {getInitials(name)}
          </Text>
        )}
      </View>

      {showStatus && (
        <View
          className={twMerge(
            'absolute rounded-full border-2 border-gray-900',
            statusSizes[size],
            isOnline ? 'bg-green-500' : 'bg-gray-500'
          )}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        <AvatarContent />
      </TouchableOpacity>
    );
  }

  return <AvatarContent />;
};
