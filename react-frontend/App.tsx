import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
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
import { ModernTabBar } from './components/BottomNavigation';
import { socketService } from './services/socket';
import { Call } from './types';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <ModernTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen 
      name="Dialer" 
      component={DialerScreen}
      options={{
        tabBarLabel: 'Dialer',
      }}
    />
    <Tab.Screen 
      name="Recent" 
      component={RecentCallsScreen}
      options={{
        tabBarLabel: 'Recent',
      }}
    />
    <Tab.Screen 
      name="Contacts" 
      component={ContactsScreen}
      options={{
        tabBarLabel: 'Contacts',
      }}
    />
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

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Colors.primary },
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen 
            name="Profile"
            component={ProfileScreen}
            options={{
              presentation: 'modal',
              gestureDirection: 'vertical',
            }}
          />
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
    </>
  );
}