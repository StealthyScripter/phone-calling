import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/ui';

export default function AudioSettingsScreen() {
  const router = useRouter();
  
  const [selectedRingtone, setSelectedRingtone] = useState('default');
  const [selectedNotificationSound, setSelectedNotificationSound] = useState('default');

  const ringtones = [
    { id: 'default', name: 'Default', file: 'ringtone.mp3' },
    { id: 'classic', name: 'Classic', file: 'classic.mp3' },
    { id: 'modern', name: 'Modern', file: 'modern.mp3' },
    { id: 'peaceful', name: 'Peaceful', file: 'peaceful.mp3' },
    { id: 'energetic', name: 'Energetic', file: 'energetic.mp3' },
  ];

  const notificationSounds = [
    { id: 'default', name: 'Default', file: 'notification.mp3' },
    { id: 'gentle', name: 'Gentle', file: 'gentle.mp3' },
    { id: 'alert', name: 'Alert', file: 'alert.mp3' },
    { id: 'chime', name: 'Chime', file: 'chime.mp3' },
  ];

  const SoundRow = ({ 
    sound, 
    isSelected, 
    onSelect 
  }: {
    sound: { id: string; name: string; file: string };
    isSelected: boolean;
    onSelect: () => void;
  }) => (
    <TouchableOpacity
      onPress={onSelect}
      className="flex-row items-center justify-between py-4 border-b border-gray-700 last:border-b-0"
    >
      <Text className="text-white text-base flex-1">{sound.name}</Text>
      <View className="flex-row items-center">
        <TouchableOpacity className="p-2 mr-2">
          <Ionicons name="play" size={20} color="#00ff87" />
        </TouchableOpacity>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color="#00ff87" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header
        title="Audio & Calls"
        showBackButton
        onLeftPress={() => router.back()}
      />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Ringtones */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            RINGTONE
          </Text>
          <Card padding="none">
            {ringtones.map(ringtone => (
              <SoundRow
                key={ringtone.id}
                sound={ringtone}
                isSelected={selectedRingtone === ringtone.id}
                onSelect={() => setSelectedRingtone(ringtone.id)}
              />
            ))}
          </Card>
        </View>

        {/* Notification Sounds */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            NOTIFICATION SOUND
          </Text>
          <Card padding="none">
            {notificationSounds.map(sound => (
              <SoundRow
                key={sound.id}
                sound={sound}
                isSelected={selectedNotificationSound === sound.id}
                onSelect={() => setSelectedNotificationSound(sound.id)}
              />
            ))}
          </Card>
        </View>

        {/* Audio Quality */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2">
            AUDIO QUALITY
          </Text>
          <Card padding="none">
            <View className="py-4 border-b border-gray-700">
              <Text className="text-white text-base font-medium mb-1">
                Echo Cancellation
              </Text>
              <Text className="text-gray-400 text-sm">
                Reduces echo during calls
              </Text>
            </View>
            <View className="py-4 border-b border-gray-700">
              <Text className="text-white text-base font-medium mb-1">
                Noise Suppression
              </Text>
              <Text className="text-gray-400 text-sm">
                Reduces background noise
              </Text>
            </View>
            <View className="py-4">
              <Text className="text-white text-base font-medium mb-1">
                Auto Gain Control
              </Text>
              <Text className="text-gray-400 text-sm">
                Automatically adjusts microphone sensitivity
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
