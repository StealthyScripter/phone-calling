import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { twMerge } from 'tailwind-merge';

interface FavoriteToggleProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const FavoriteToggle: React.FC<FavoriteToggleProps> = ({
  isFavorite,
  onToggle,
  size = 'medium',
  className,
}) => {
  const sizes = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const containerSizes = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-3',
  };

  return (
    <TouchableOpacity
      onPress={onToggle}
      className={twMerge(containerSizes[size], className)}
    >
      <Ionicons
        name={isFavorite ? 'star' : 'star-outline'}
        size={sizes[size]}
        color={isFavorite ? '#fbbf24' : '#9ca3af'}
      />
    </TouchableOpacity>
  );
};
