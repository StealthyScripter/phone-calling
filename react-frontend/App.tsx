import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Dimensions, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from './constants/Colors';
import { DialerScreen } from './screens/DialerScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { RecentCallsScreen } from './screens/RecentCalls';
import { SettingsScreen } from './screens/SettingsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ActiveCallScreen } from './screens/ActiveCallScreen';
import { IncomingCallScreen } from './screens/IncomingCallScreen';
import { ModernTabBar } from './components/BottomNavigation';
import { socketService } from './services/socket';
import { Call } from './types';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const PHONE_MAX_WIDTH = 375; // iPhone-like width
const { width: screenWidth } = Dimensions.get('window');

interface TabNavigatorProps {
  onMakeCall: (phoneNumber: string, contactName?: string) => void;
}

const TabNavigator: React.FC<TabNavigatorProps> = ({ onMakeCall }) => (
  <Tab.Navigator
    tabBar={(props) => <ModernTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen 
      name="Dialer"
      options={{
        tabBarLabel: 'Dialer',
      }}
    >
      {(props) => <DialerScreen {...props} onMakeCall={onMakeCall} />}
    </Tab.Screen>
    <Tab.Screen 
      name="Recent" 
      component={RecentCallsScreen}
      options={{
        tabBarLabel: 'Recent',
      }}
    />
    <Tab.Screen 
      name="Contacts"
      options={{
        tabBarLabel: 'Contacts',
      }}
    >
      {(props) => <ContactsScreen {...props} onMakeCall={onMakeCall} />}
    </Tab.Screen>
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{
        tabBarLabel: 'Settings',
      }}
    />
  </Tab.Navigator>
);

export default function App() {
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  // Global handler functions - accessible throughout the component
  const handleIncomingCall = (data: any) => {
    console.log('Incoming call received:', data);
    setIncomingCall({
      id: data.id || Date.now(),
      call_sid: data.call_sid || '',
      user_id: data.user_id || 1,
      direction: 'incoming',
      from_number: data.from_number || data.phone_number || '',
      to_number: data.to_number || '',
      contact_name: data.contact_name || 'Unknown Caller',
      phone_number: data.from_number || data.phone_number || '',
      status: 'ringing',
      duration: 0,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  const handleCallInitiated = (data: any) => {
    console.log('Call initiated:', data);
    setActiveCall({
      id: data.id || Date.now(),
      call_sid: data.call_sid || '',
      user_id: data.user_id || 1,
      direction: 'outgoing',
      from_number: data.from_number || '',
      to_number: data.to_number || data.phone_number || '',
      contact_name: data.contact_name || 'Unknown',
      phone_number: data.to_number || data.phone_number || '',
      status: 'initiated',
      duration: 0,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  const handleCallStatusUpdate = (data: any) => {
    console.log('Call status update:', data);
    if (activeCall && activeCall.call_sid === data.call_sid) {
      setActiveCall(prev => prev ? { ...prev, status: data.status } : null);
    }
  };

  const handleCallEnded = (data: any) => {
    console.log('Call ended:', data);
    setActiveCall(null);
    setIncomingCall(null);
  };

  const handleCallEnd = () => {
    setActiveCall(null);
  };

  const handleIncomingCallAccept = () => {
    if (incomingCall) {
      setActiveCall({
        ...incomingCall,
        status: 'in-progress',
        start_time: new Date().toISOString(),
      });
      setIncomingCall(null);
    }
  };

  const handleIncomingCallReject = () => {
    setIncomingCall(null);
  };

  const handleOutgoingCall = (phoneNumber: string, contactName?: string) => {
    const newCall: Call = {
      id: Date.now(),
      call_sid: `call_${Date.now()}`,
      user_id: 1,
      direction: 'outgoing',
      from_number: '+1234567890', // Your number
      to_number: phoneNumber,
      contact_name: contactName || 'Unknown',
      phone_number: phoneNumber,
      status: 'initiated',
      duration: 0,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActiveCall(newCall);
  };

  // For testing incoming calls - you can remove this in production
  const simulateIncomingCall = () => {
    setTimeout(() => {
      handleIncomingCall({
        id: Date.now(),
        contact_name: 'Ahmed Kofi',
        phone_number: '+234 803 123 4567',
        from_number: '+234 803 123 4567',
      });
    }, 10000); // Simulate incoming call after 10 seconds
  };

  useEffect(() => {
    // Connect to socket service
    socketService.connect();

    // Set up event listeners only - no function declarations
    socketService.on('incomingCall', handleIncomingCall);
    socketService.on('callInitiated', handleCallInitiated);
    socketService.on('callStatusUpdate', handleCallStatusUpdate);
    socketService.on('callEnded', handleCallEnded);

    return () => {
      socketService.off('incomingCall', handleIncomingCall);
      socketService.off('callInitiated', handleCallInitiated);
      socketService.off('callStatusUpdate', handleCallStatusUpdate);
      socketService.off('callEnded', handleCallEnded);
      socketService.disconnect();
    };
  }, [activeCall]);

  const navigationTheme = {
    ...NavigationDarkTheme,
    colors: {
      primary: Colors.accent,
      background: Colors.primary,
      card: Colors.cardBackground,
      text: Colors.textPrimary,
      border: Colors.borderColor,
      notification: Colors.accent,
    },
  };

  // Uncomment to test incoming calls
  // React.useEffect(() => {
  //   simulateIncomingCall();
  // }, []);

  return (
    <View style={styles.appContainer}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <View style={styles.phoneContainer}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: Colors.primary },
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}
          >
            <Stack.Screen name="Main">
              {(props) => <TabNavigator {...props} onMakeCall={handleOutgoingCall} />}
            </Stack.Screen>
            <Stack.Screen 
              name="Profile"
              component={ProfileScreen}
              options={{
                presentation: 'modal',
                gestureDirection: 'vertical',
              }}
            />
            {/* Incoming Call Screen - Highest Priority */}
            {incomingCall && (
              <Stack.Screen 
                name="IncomingCall"
                options={{
                  presentation: 'modal',
                  gestureEnabled: false,
                  cardStyleInterpolator: ({ current }) => ({
                    cardStyle: {
                      opacity: current.progress,
                    },
                  }),
                }}
              >
                {() => (
                  <IncomingCallScreen 
                    call={incomingCall} 
                    onAccept={handleIncomingCallAccept}
                    onReject={handleIncomingCallReject}
                  />
                )}
              </Stack.Screen>
            )}
            {/* Active Call Screen */}
            {activeCall && !incomingCall && (
              <Stack.Screen 
                name="ActiveCall"
                options={{
                  presentation: 'modal',
                  gestureEnabled: false,
                  cardStyleInterpolator: ({ current }) => ({
                    cardStyle: {
                      opacity: current.progress,
                    },
                  }),
                }}
              >
                {() => (
                  <ActiveCallScreen 
                    call={activeCall} 
                    onCallEnd={handleCallEnd}
                  />
                )}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneContainer: {
    width: Math.min(screenWidth, PHONE_MAX_WIDTH),
    height: '100%',
    maxWidth: PHONE_MAX_WIDTH,
    backgroundColor: Colors.primary,
  },
});