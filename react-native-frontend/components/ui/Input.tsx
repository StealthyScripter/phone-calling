import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { Ionicons } from '@expo/vector-icons';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  className,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const containerStyles = twMerge(
    'bg-gray-700 border border-gray-600 rounded-lg px-4 py-3',
    isFocused && 'border-green-400',
    error && 'border-red-500',
    disabled && 'opacity-50',
    className
  );

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-white font-medium mb-2 text-sm">{label}</Text>
      )}
      
      <View className={containerStyles}>
        <View className="flex-row items-center">
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          
          <TextInput
            className={twMerge(
              'flex-1 text-white text-base',
              multiline && `min-h-[${numberOfLines * 20}px]`
            )}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            keyboardType={keyboardType}
            editable={!disabled}
            multiline={multiline}
            numberOfLines={numberOfLines}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="ml-3"
            >
              <Ionicons
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          )}

          {rightIcon && !secureTextEntry && (
            <View className="ml-3">{rightIcon}</View>
          )}
        </View>
      </View>

      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
};
