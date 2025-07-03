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
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const PHONE_MAX_WIDTH = 375; // iPhone-like width
const { width: screenWidth } = Dimensions.get('window');

interface TabNavigatorProps {
  onMakeCall: (phoneNumber: string, contactName?: string) => void;
  navigation: any;
}

const TabNavigator: React.FC<TabNavigatorProps> = ({ onMakeCall, navigation }) => (
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
  const [navigationRef, setNavigationRef] = useState<any>(null);

  // Global handler functions - accessible throughout the component
  const handleIncomingCall = async(data: any) => {
    console.log('Incoming call received:', data);
    const newIncomingCall: Call = {
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
    };
    
    setIncomingCall(newIncomingCall);
    
    // Navigate to incoming call screen immediately
    if (navigationRef) {
      navigationRef.navigate('IncomingCall', { call: newIncomingCall });
    }

    await Notifications.scheduleNotificationAsync({
    content: {
      title: "Incoming Call",
      body: `Call from ${data.contact_name || data.from_number}`,
      sound: 'default',
    },
    trigger: null,
  });

  };

  const handleCallInitiated = (data: any) => {
    console.log('Call initiated:', data);
    const newActiveCall: Call = {
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
    };
    
    setActiveCall(newActiveCall);
    
    // Navigate to active call screen immediately
    if (navigationRef) {
      navigationRef.navigate('ActiveCall', { call: newActiveCall });
    }
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
    
    // Navigate back to main screens
    if (navigationRef) {
      navigationRef.navigate('Main');
    }
  };

  const handleCallEnd = () => {

    setActiveCall(null);
    // Navigate back to main screens
    if (navigationRef) {
      navigationRef.navigate('Main');
    }
  };

  const handleIncomingCallAccept = () => {
    if (incomingCall) {
      const acceptedCall: Call = {
        ...incomingCall,
        status: 'in-progress',
        start_time: new Date().toISOString(),
      };
      setActiveCall(acceptedCall);
      setIncomingCall(null);
      
      // Navigate to active call screen
      if (navigationRef) {
        navigationRef.navigate('ActiveCall', { call: acceptedCall });
      }
    }
  };

  const handleIncomingCallReject = () => {
    setIncomingCall(null);
    // Navigate back to main screens
    if (navigationRef) {
      navigationRef.navigate('Main');
    }
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
    
    // Navigate to active call screen immediately
    if (navigationRef) {
      navigationRef.navigate('ActiveCall', { call: newCall });
    }
  };

  const handleCallAccepted = (data: any) => {
      console.log('Call accepted:', data);
      if (incomingCall && incomingCall.call_sid === data.callSid) {
        const acceptedCall: Call = {
          ...incomingCall,
          status: 'in-progress',
          start_time: new Date().toISOString(),
        };
        setActiveCall(acceptedCall);
        setIncomingCall(null);
        navigationRef?.navigate('ActiveCall', { call: acceptedCall });
      }
    };

  const handleCallRejected = (data: any) => {
    console.log('Call rejected:', data);
    setIncomingCall(null);
    navigationRef?.navigate('Main');
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
    socketService.on('callAccepted', handleCallAccepted);
    socketService.on('callRejected', handleCallRejected);
  

    return () => {
      socketService.off('incomingCall', handleIncomingCall);
      socketService.off('callInitiated', handleCallInitiated);
      socketService.off('callStatusUpdate', handleCallStatusUpdate);
      socketService.off('callEnded', handleCallEnded);
      socketService.off('callAccepted', handleCallAccepted);
    socketService.off('callRejected', handleCallRejected);
      socketService.disconnect();
    };
  }, [incomingCall, activeCall]);

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
        <NavigationContainer 
          theme={navigationTheme}
          ref={setNavigationRef}
        >
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: Colors.primary },
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}
          >
            <Stack.Screen name="Main">
              {(props) => (
                <TabNavigator 
                  {...props} 
                  onMakeCall={handleOutgoingCall} 
                  navigation={props.navigation}
                />
              )}
            </Stack.Screen>
            
            <Stack.Screen 
              name="Profile"
              component={ProfileScreen}
              options={{
                presentation: 'modal',
                gestureDirection: 'vertical',
              }}
            />
            
            {/* Active Call Screen */}
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
              {({ route }: { route: any }) => (
                <ActiveCallScreen 
                  call={route.params?.call || activeCall!} 
                  onCallEnd={handleCallEnd}
                  route={route}
                />
              )}
            </Stack.Screen>
            
            {/* Incoming Call Screen */}
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
              {({ route }: { route: any }) => (
                <IncomingCallScreen 
                  call={route.params?.call || incomingCall!} 
                  onAccept={handleIncomingCallAccept}
                  onReject={handleIncomingCallReject}
                  route={route}
                />
              )}
            </Stack.Screen>
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
