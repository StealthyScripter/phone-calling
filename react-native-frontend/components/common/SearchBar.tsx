import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { twMerge } from 'tailwind-merge';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  autoFocus?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  value,
  onChangeText,
  onSearch,
  onClear,
  debounceMs = 300,
  autoFocus = false,
  className,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    if (onSearch && debouncedValue !== undefined) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View
      className={twMerge(
        'flex-row items-center bg-gray-800 rounded-lg px-4 py-3 mx-4 mb-4',
        isFocused && 'border border-green-400',
        className
      )}
    >
      <Ionicons
        name="search"
        size={20}
        color={isFocused ? '#00ff87' : '#9ca3af'}
      />
      
      <TextInput
        className="flex-1 text-white text-base ml-3 mr-2"
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        clearButtonMode="never"
      />

      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear}>
          <Ionicons
            name="close-circle"
            size={20}
            color="#9ca3af"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

