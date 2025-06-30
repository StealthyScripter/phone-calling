import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { twMerge } from 'tailwind-merge';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  showBackButton?: boolean;
  backgroundColor?: string;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  showBackButton = false,
  backgroundColor = 'bg-gray-900',
  className,
}) => {
  return (
    <SafeAreaView className={twMerge(backgroundColor, className)}>
      <View className="flex-row items-center justify-between px-4 py-3">
        {/* Left Section */}
        <View className="flex-row items-center flex-1">
          {(showBackButton || leftIcon) && (
            <TouchableOpacity
              onPress={onLeftPress}
              className="mr-3 p-1"
            >
              <Ionicons
                name={(showBackButton ? 'chevron-back' : leftIcon) as any}
                size={24}
                color="#ffffff"
              />
            </TouchableOpacity>
          )}
          
          <View className="flex-1">
            <Text className="text-white text-lg font-semibold">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-gray-400 text-sm">
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Right Section */}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightPress}
            className="p-1"
          >
            <Ionicons
              name={rightIcon as any}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};
