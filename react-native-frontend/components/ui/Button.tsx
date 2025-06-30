import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  className,
}) => {
  const baseStyles = 'rounded-lg flex-row items-center justify-center';
  
  const variantStyles = {
    primary: 'bg-green-400 border-green-400',
    secondary: 'bg-transparent border-green-400 border',
    danger: 'bg-red-500 border-red-500',
    outline: 'bg-transparent border-gray-400 border',
  };

  const sizeStyles = {
    small: 'px-3 py-2 min-h-[36px]',
    medium: 'px-4 py-3 min-h-[48px]',
    large: 'px-6 py-4 min-h-[56px]',
  };

  const textStyles = {
    primary: 'text-white font-semibold',
    secondary: 'text-green-400 font-semibold',
    danger: 'text-white font-semibold',
    outline: 'text-gray-400 font-semibold',
  };

  const disabledStyles = disabled ? 'opacity-50' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={twMerge(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabledStyles,
        className
      )}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' || variant === 'danger' ? '#ffffff' : '#00ff87'} 
          size="small" 
        />
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={twMerge(textStyles[variant], `text-${size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'base'}`)}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
