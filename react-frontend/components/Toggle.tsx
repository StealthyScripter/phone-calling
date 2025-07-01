import React from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/Colors';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ value, onValueChange, disabled = false }) => {
  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.secondary, Colors.accent],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled}>
      <Animated.View style={[styles.container, { backgroundColor }, disabled && styles.disabled]}>
        <Animated.View style={[styles.circle, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    padding: 2,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
});
