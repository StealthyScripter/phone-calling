import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/common/Header';
import { SearchBar } from '../../components/common/SearchBar';
import { CallHistoryItem } from '../../components/calls/CallHistoryItem';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useCallSelectors } from '../../store';
import { useCalls } from '../../hooks/useCalls';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'missed', label: 'Missed' },
  { key: 'outbound', label: 'Outbound' },
  { key: 'inbound', label: 'Inbound' },
];

export default function RecentScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const { callHistory } = useCallSelectors();
  const { makeCall } = useCalls();

  const filteredCalls = callHistory.filter(call => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = call.contact?.name?.toLowerCase().includes(query);
      const matchesNumber = call.phoneNumber.includes(searchQuery);
      if (!matchesName && !matchesNumber) return false;
    }

    // Apply status filter
    switch (activeFilter) {
      case 'missed':
        return call.status === 'missed';
      case 'outbound':
        return call.direction === 'outbound';
      case 'inbound':
        return call.direction === 'inbound';
      default:
        return true;
    }
  });

  const handleCallPress = async (phoneNumber: string) => {
    try {
      await makeCall(phoneNumber);
    } catch (error: any) {
      // Handle error
    }
  };

  const handleCallDetails = (call: any) => {
    // Navigate to call details
  };

  const renderCallItem = ({ item }: { item: any }) => (
    <CallHistoryItem
      call={item}
      onPress={() => handleCallDetails(item)}
      onCallPress={() => handleCallPress(item.phoneNumber)}
      onInfoPress={() => handleCallDetails(item)}
    />
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-gray-400 text-lg text-center mb-4">
        No call history yet
      </Text>
      <Text className="text-gray-500 text-sm text-center">
        Your recent calls will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <Header title="Recent Calls" />

      <SearchBar
        placeholder="Search calls..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filter Tabs */}
      <View className="flex-row px-4 mb-4">
        {FILTER_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.key}
            onPress={() => setActiveFilter(option.key)}
            className={`px-4 py-2 mr-3 rounded-full ${
              activeFilter === option.key
                ? 'bg-green-500'
                : 'bg-gray-700'
            }`}
          >
            <Text
              className={`font-medium ${
                activeFilter === option.key
                  ? 'text-white'
                  : 'text-gray-300'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredCalls}
        renderItem={renderCallItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}
