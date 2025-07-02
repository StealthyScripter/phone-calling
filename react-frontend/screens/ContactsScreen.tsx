import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  Alert,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Avatar } from '../components/Avatar';
import { PhoneIcon, PlusIcon, StarIcon, BatteryIcon } from '../components/Icons';
import { Contact } from '../types';
import { ApiService } from '../services/api';

interface ContactsScreenProps {
  navigation: any;
  onMakeCall: (phoneNumber: string, contactName?: string) => void;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({ navigation, onMakeCall }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      // Using userId 1 as default - in real app, get from auth context
      const contactsData = await ApiService.getContacts(1);
      // Ensure contactsData is always an array
      setContacts(Array.isArray(contactsData) ? contactsData : []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
      console.error('Load contacts error:', error);
      setContacts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (phone: string, contactName: string) => {
    try {
      // Call the API service to initiate the call on the backend
      await ApiService.makeCall(phone);
      // Also trigger the app-level call handling for UI state management
      onMakeCall(phone, contactName);
    } catch (error) {
      Alert.alert('Error', 'Failed to make call');
      console.error('Call error:', error);
    }
  };

  const handleToggleFavorite = async (contact: Contact) => {
    try {
      await ApiService.toggleFavorite(contact.id);
      setContacts(prev => 
        prev.map(c => 
          c.id === contact.id 
            ? { ...c, is_favorite: !c.is_favorite }
            : c
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const getContactInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAIRoutingText = (contact: Contact) => {
    const routingTexts = [
      'Preferred route: Carrier A',
      'AI optimized rates',
      'HD Voice enabled',
      'Smart routing active'
    ];
    return routingTexts[contact.id % routingTexts.length];
  };

  const filteredContacts = contacts
    .filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          contact.phone.includes(searchText);
      const matchesFavorite = showFavoritesOnly ? contact.is_favorite : true;
      return matchesSearch && matchesFavorite;
    })
    .sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return a.name.localeCompare(b.name);
    });

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity 
      style={styles.contactCard}
      onPress={() => navigation.navigate('ContactDetail', { contact: item })}
      activeOpacity={0.8}
    >
      <View style={styles.contactInfo}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={Colors.aiGradient}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getContactInitials(item.name)}</Text>
          </LinearGradient>
        </View>
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
          <Text style={styles.contactAI}>{getAIRoutingText(item)}</Text>
        </View>
      </View>
      
      <View style={styles.contactActions}>
        <TouchableOpacity 
          style={[styles.favoriteButton, item.is_favorite && styles.favoriteActive]}
          onPress={() => handleToggleFavorite(item)}
        >
          <StarIcon 
            size={20} 
            color={item.is_favorite ? Colors.accent : Colors.textSecondary}
            filled={item.is_favorite}
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.callButton}
          onPress={() => handleCall(item.phone, item.name)}
        >
          <LinearGradient
            colors={Colors.aiGradient}
            style={styles.callButtonGradient}
          >
            <PhoneIcon size={16} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={Colors.backgroundGradient}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Contacts</Text>
          <Text style={styles.headerSubtitle}>Global connections</Text>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={Colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          
          <TouchableOpacity 
            style={[styles.filterButton, showFavoritesOnly && styles.filterActive]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <StarIcon 
              size={18} 
              color={showFavoritesOnly ? Colors.primary : Colors.textPrimary}
              filled={showFavoritesOnly}
            />
          </TouchableOpacity>
        </View>

        {/* Contacts List */}
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id.toString()}
          style={styles.contactsList}
          contentContainerStyle={styles.contactsListContent}
          refreshing={loading}
          onRefresh={loadContacts}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {loading ? 'Loading contacts...' : 'No contacts found'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => navigation.navigate('AddContact')}
        >
          <LinearGradient
            colors={Colors.aiGradient}
            style={styles.floatingButtonGradient}
          >
            <PlusIcon size={24} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusTime: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingVertical: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.cardBackground,
    borderRadius: 22,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  filterActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  contactsList: {
    flex: 1,
  },
  contactsListContent: {
    paddingBottom: 100,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  contactPhone: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  contactAI: {
    color: Colors.accent,
    fontSize: 12,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteActive: {
    backgroundColor: Colors.savingsBackground,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  callButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    boxShadow: '0 4px 12px rgba(0, 255, 136, 0.3)',
  },
  floatingButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
