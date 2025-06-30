import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onDismiss,
  duration = 3000,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, duration, onDismiss]);

  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  const icons = {
    success: 'checkmark-circle',
    error: 'close-circle',
    warning: 'warning',
    info: 'information-circle',
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
      }}
      className={twMerge(
        'absolute top-12 left-4 right-4 p-4 rounded-lg flex-row items-center z-50',
        typeStyles[type]
      )}
    >
      <Ionicons name={icons[type] as any} size={20} color="white" />
      <Text className="text-white font-medium ml-2 flex-1">{message}</Text>
      <TouchableOpacity onPress={onDismiss} className="ml-2">
        <Ionicons name="close" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};
