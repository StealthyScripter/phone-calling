import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  className,
  padding = 'medium',
}) => {
  const baseStyles = 'bg-gray-800 rounded-xl';
  
  const paddingStyles = {
    none: '',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      className={twMerge(baseStyles, paddingStyles[padding], className)}
    >
      {children}
    </Component>
  );
};

