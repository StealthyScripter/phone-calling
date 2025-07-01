import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  Alert 
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Contact } from '../types';
import { ApiService } from '../services/api';

export const ContactsScreen: React.FC = () => {
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
      setContacts(contactsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
      console.error('Load contacts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (phone: string) => {
    try {
      await ApiService.makeCall(phone);
      Alert.alert('Call Initiated', `Calling ${phone}...`);
    } catch (error) {
      Alert.alert('Error', 'Failed to make call');
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
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Avatar name={item.name} size={50} />
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
          {item.email && <Text style={styles.contactEmail}>{item.email}</Text>}
        </View>
      </View>
      
      <View style={styles.contactActions}>
        <TouchableOpacity 
          style={[styles.favoriteButton, item.is_favorite && styles.favoriteActive]}
          onPress={() => handleToggleFavorite(item)}
        >
          <Text style={styles.favoriteIcon}>
            {item.is_favorite ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.callButton}
          onPress={() => handleCall(item.phone)}
        >
          <Text style={styles.callIcon}>📞</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.header}>
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
          <Text style={styles.filterText}>★</Text>
        </TouchableOpacity>
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id.toString()}
        style={styles.contactsList}
        refreshing={loading}
        onRefresh={loadContacts}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading contacts...' : 'No contacts found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.cardBackground,
    borderRadius: 22,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
    marginRight: 12,
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
  filterText: {
    color: Colors.textPrimary,
    fontSize: 18,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactDetails: {
    marginLeft: 12,
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
  contactEmail: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  favoriteActive: {
    backgroundColor: Colors.accent + '20',
  },
  favoriteIcon: {
    color: Colors.accent,
    fontSize: 20,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 16,
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
});
