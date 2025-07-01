import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface AvatarProps {
  name: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 50 }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size/2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: Colors.primary,
    fontWeight: 'bold',
  }
});