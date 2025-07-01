import React, { useEffect, useState } from 'react';
import { Text as RNText } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from './constants/Colors';
import { DialerScreen } from './screens/DialerScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ActiveCallScreen } from './screens/ActiveCallScreen';
import { socketService } from './services/socket';
import { Call } from './types';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarStyle: {
        backgroundColor: Colors.primary,
        borderTopColor: Colors.borderColor,
        borderTopWidth: 1,
      },
      tabBarActiveTintColor: Colors.accent,
      tabBarInactiveTintColor: Colors.textSecondary,
      headerStyle: {
        backgroundColor: Colors.primary,
        borderBottomColor: Colors.borderColor,
        borderBottomWidth: 1,
      },
      headerTintColor: Colors.textPrimary,
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen 
      name="Dialer" 
      component={DialerScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <RNText style={{ color, fontSize: 20 }}>📞</RNText>
        ),
      }}
    />
    <Tab.Screen 
      name="Contacts" 
      component={ContactsScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <RNText style={{ color, fontSize: 20 }}>👥</RNText>
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <RNText style={{ color, fontSize: 20 }}>👤</RNText>
        ),
      }}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <RNText style={{ color, fontSize: 20 }}>⚙️</RNText>
        ),
      }}
    />
  </Tab.Navigator>
);

export default function App() {
  const [activeCall, setActiveCall] = useState<Call | null>(null);

  useEffect(() => {
    // Connect to socket service
    socketService.connect();

    // Handle incoming calls
    const handleIncomingCall = (data: any) => {
      setActiveCall(data);
    };

    // Handle call initiated
    const handleCallInitiated = (data: any) => {
      setActiveCall(data);
    };

    // Handle call ended
    const handleCallEnded = () => {
      setActiveCall(null);
    };

    socketService.on('incomingCall', handleIncomingCall);
    socketService.on('callInitiated', handleCallInitiated);
    socketService.on('callEnded', handleCallEnded);

    return () => {
      socketService.off('incomingCall', handleIncomingCall);
      socketService.off('callInitiated', handleCallInitiated);
      socketService.off('callEnded', handleCallEnded);
      socketService.disconnect();
    };
  }, []);

  const handleCallEnd = () => {
    setActiveCall(null);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: Colors.primary },
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        {activeCall && (
          <Stack.Screen 
            name="ActiveCall"
            options={{
              presentation: 'modal',
              gestureEnabled: false,
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
  );
}