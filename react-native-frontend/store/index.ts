export { useAuthStore } from './auth';
export { useCallStore } from './calls';
export { useContactStore } from './contacts';
export { useUIStore } from './ui';
export type * from './types';

// Store utilities and selectors
export const createNotification = (
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string,
  duration = 3000
) => ({
  id: `notification_${Date.now()}_${Math.random()}`,
  type,
  title,
  message,
  timestamp: Date.now(),
  duration,
});

// Selectors for computed state
export const useAuthSelectors = () => {
  const { user, isAuthenticated, loading } = useAuthStore();
  
  return {
    user,
    isAuthenticated,
    loading,
    isLoggedIn: isAuthenticated && !!user,
    userName: user ? `${user.firstName} ${user.lastName}` : '',
    userInitials: user ? 
      `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : 
      '',
  };
};

export const useCallSelectors = () => {
  const { 
    activeCall, 
    callHistory, 
    callState, 
    isConnected,
    isMuted,
    isSpeakerOn,
    callTimer 
  } = useCallStore();
  
  return {
    activeCall,
    callHistory,
    callState,
    isConnected,
    isMuted,
    isSpeakerOn,
    callTimer,
    hasActiveCall: !!activeCall,
    isInCall: ['connecting', 'connected', 'hold'].includes(callState),
    recentCalls: callHistory.slice(0, 10),
    missedCalls: callHistory.filter(call => call.status === 'missed'),
    outboundCalls: callHistory.filter(call => call.direction === 'outbound'),
    inboundCalls: callHistory.filter(call => call.direction === 'inbound'),
  };
};

export const useContactSelectors = () => {
  const { 
    contacts, 
    favorites, 
    loading, 
    searchQuery, 
    selectedContact 
  } = useContactStore();
  
  const filteredContacts = contacts.filter(contact =>
    !searchQuery || 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );
  
  return {
    contacts: filteredContacts,
    allContacts: contacts,
    favorites,
    loading,
    searchQuery,
    selectedContact,
    contactCount: contacts.length,
    favoriteCount: favorites.length,
    hasContacts: contacts.length > 0,
    hasFavorites: favorites.length > 0,
  };
};