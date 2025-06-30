import React from 'react';
import { View, TouchableOpacity, Text, Vibration } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface DialPadProps {
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
  showDeleteButton?: boolean;
  className?: string;
}

export const DialPad: React.FC<DialPadProps> = ({
  onDigitPress,
  onDeletePress,
  showDeleteButton = true,
  className,
}) => {
  const dialPadData = [
    [
      { digit: '1', letters: '' },
      { digit: '2', letters: 'ABC' },
      { digit: '3', letters: 'DEF' },
    ],
    [
      { digit: '4', letters: 'GHI' },
      { digit: '5', letters: 'JKL' },
      { digit: '6', letters: 'MNO' },
    ],
    [
      { digit: '7', letters: 'PQRS' },
      { digit: '8', letters: 'TUV' },
      { digit: '9', letters: 'WXYZ' },
    ],
    [
      { digit: '*', letters: '' },
      { digit: '0', letters: '+' },
      { digit: '#', letters: '' },
    ],
  ];

  const handleDigitPress = (digit: string) => {
    Vibration.vibrate(50); // Haptic feedback
    onDigitPress(digit);
  };

  const DialButton: React.FC<{
    digit: string;
    letters: string;
    onPress: () => void;
  }> = ({ digit, letters, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center m-2"
    >
      <Text className="text-white text-2xl font-medium">{digit}</Text>
      {letters && (
        <Text className="text-gray-400 text-xs font-medium tracking-wider">
          {letters}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View className={twMerge('items-center py-4', className)}>
      {dialPadData.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-center">
          {row.map((item) => (
            <DialButton
              key={item.digit}
              digit={item.digit}
              letters={item.letters}
              onPress={() => handleDigitPress(item.digit)}
            />
          ))}
        </View>
      ))}

      {showDeleteButton && (
        <View className="flex-row justify-center mt-4">
          <TouchableOpacity
            onPress={onDeletePress}
            className="w-20 h-20 rounded-full items-center justify-center"
          >
            <Text className="text-gray-400 text-lg">⌫</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
