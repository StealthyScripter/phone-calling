import React from 'react';
import { View, Text, Image } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  className?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
  className,
}) => {
  return (
    <View className={twMerge('items-center mb-8', className)}>
      {showLogo && (
        <View className="mb-6">
          <Image
            source={require('../../assets/images/logo.png')}
            className="w-20 h-20"
            resizeMode="contain"
          />
        </View>
      )}
      
      <Text className="text-white text-2xl font-semibold text-center mb-2">
        {title}
      </Text>
      
      {subtitle && (
        <Text className="text-gray-400 text-base text-center leading-6">
          {subtitle}
        </Text>
      )}
    </View>
  );
};
