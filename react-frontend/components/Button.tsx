import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary',
  disabled = false 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        variant === 'primary' ? styles.primary : styles.secondary,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: Colors.textPrimary,
  }
});