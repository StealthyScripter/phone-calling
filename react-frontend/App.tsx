import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from './constants/Colors';
import { DialerScreen } from './screens/DialerScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { RecentCallsScreen } from './screens/RecentCalls';
import { SettingsScreen } from './screens/SettingsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ActiveCallScreen } from './screens/ActiveCallScreen';
import { IncomingCallScreen } from './screens/IncomingCallScreen';
import { AddContactScreen } from './screens/AddContactScreen';
import { ModernTabBar } from './components/BottomNavigation';
import { socketService } from './services/socket';
import { Call } from './types';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { ApiService } from './services/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';

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
const AuthStack = createStackNavigator();

const PHONE_MAX_WIDTH = 375;
const { width: screenWidth } = Dimensions.get('window');

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

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

interface TabNavigatorProps {
  onMakeCall: (phoneNumber: string, contactName?: string) => void;
  navigation: any;
}

const TabNavigator: React.FC<TabNavigatorProps> = ({ onMakeCall, navigation }) => (
  <Tab.Navigator
    tabBar={(props) => <ModernTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen 
      name="Dialer"
      options={{ tabBarLabel: 'Dialer' }}
    >
      {(props) => <DialerScreen {...props} onMakeCall={onMakeCall} />}
    </Tab.Screen>
    <Tab.Screen 
      name="Recent" 
      component={RecentCallsScreen}
      options={{ tabBarLabel: 'Recent' }}
    />
    <Tab.Screen 
      name="Contacts"
      options={{ tabBarLabel: 'Contacts' }}
    >
      {(props) => <ContactsScreen {...props} onMakeCall={onMakeCall} />}
    </Tab.Screen>
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ tabBarLabel: 'Settings' }}
    />
  </Tab.Navigator>
);

const AppContent = () => {
  const { user, token, isLoading } = useAuth();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [navigationRef, setNavigationRef] = useState<any>(null);
  const [isUserEndingCall, setIsUserEndingCall] = useState(false);

  // Set auth token when available
  useEffect(() => {
    if (token && user) {
      console.log('🔑 Setting auth token and user in API service');
      ApiService.setAuthToken(token);
      ApiService.setCurrentUser(user);
    } else {
      console.log('🔑 Clearing auth token and user');
      ApiService.setAuthToken(null);
      ApiService.setCurrentUser(null);
    }
  }, [token, user]);

  // Socket setup with stable dependencies
  useEffect(() => {
    if (!user || !token) {
      console.log('🔌 Not setting up socket - no authenticated user');
      return;
    }

    console.log('🔌 Setting up socket for authenticated user:', user.id);

    // Create stable handler references
    const handleIncomingCall = async (data: any) => {
      console.log('Incoming call received:', data);
      const newIncomingCall: Call = {
        id: data.id || Date.now(),
        call_sid: data.call_sid || '',
        user_id: String(user.id),
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
      
      setActiveCall(prevCall => {
        if (prevCall) {
          const updatedCall: Call = {
            ...prevCall,
            call_sid: data.callSid || data.call_sid || '',
            status: 'initiated',
            from_number: data.from || prevCall.from_number,
            to_number: data.to || prevCall.to_number,
          };
          console.log('🟢 Updated activeCall with real call_sid:', updatedCall.call_sid);
          
          setTimeout(() => {
            if (navigationRef) {
              navigationRef.navigate('ActiveCall', { call: updatedCall });
            }
          }, 100);
          
          return updatedCall;
        } else {
          const newActiveCall: Call = {
            id: data.id || Date.now(),
            call_sid: data.callSid || data.call_sid || '',
            user_id: String(user.id),
            direction: 'outgoing',
            from_number: data.from || '',
            to_number: data.to || data.phone_number || '',
            contact_name: data.contact_name || 'Unknown',
            phone_number: data.to || data.phone_number || '',
            status: 'initiated',
            duration: 0,
            start_time: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          console.log('🟢 Created new activeCall with call_sid:', newActiveCall.call_sid);
          
          setTimeout(() => {
            if (navigationRef) {
              navigationRef.navigate('ActiveCall', { call: newActiveCall });
            }
          }, 100);
          
          return newActiveCall;
        }
      });
    };

    const handleCallStatusUpdate = (data: any) => {
      console.log('Call status update:', data);
      setActiveCall(prevCall => {
        if (prevCall && prevCall.call_sid === data.call_sid) {
          return { ...prevCall, status: data.status };
        }
        return prevCall;
      });
    };

    const handleCallEnded = (data: any) => {
      console.log('🟡 SOCKET EVENT: Call ended received:', data);
      setIsUserEndingCall(prev => {
        if (!prev) {
          setActiveCall(null);
          setIncomingCall(null);
          if (navigationRef) {
            navigationRef.navigate('Main');
          }
        }
        return prev;
      });
    };

    const handleCallAccepted = (data: any) => {
      console.log('Call accepted:', data);
      setIncomingCall(prevIncoming => {
        if (prevIncoming && prevIncoming.call_sid === data.callSid) {
          const acceptedCall: Call = {
            ...prevIncoming,
            status: 'in-progress',
            start_time: new Date().toISOString(),
          };
          setActiveCall(acceptedCall);
          setTimeout(() => {
            navigationRef?.navigate('ActiveCall', { call: acceptedCall });
          }, 100);
          return null;
        }
        return prevIncoming;
      });
    };

    const handleCallRejected = (data: any) => {
      console.log('Call rejected:', data);
      setIncomingCall(null);
      navigationRef?.navigate('Main');
    };

    // Setup socket listeners
    socketService.connect();
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
  }, [user?.id, token, navigationRef]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={Colors.backgroundGradient} style={styles.loadingGradient}>
          <Text style={styles.loadingText}>Loading...</Text>
        </LinearGradient>
      </View>
    );
  }

  // Show auth screens if no authenticated user
  if (!user || !token) {
    return (
      <NavigationContainer theme={navigationTheme}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  const handleCallEnd = async () => {
    console.log('🟢 USER INITIATED: handleCallEnd called');
    setIsUserEndingCall(true);
    
    try {
      if (activeCall?.call_sid) {
        console.log('🟢 About to call hangupCall with:', activeCall.call_sid);
        await ApiService.hangupCall(activeCall.call_sid);
        console.log('🟢 Call end signal sent to backend');
      }
      setActiveCall(null);
      navigationRef?.navigate('Main');
    } catch (error) {
      console.error('End call error:', error);
      setActiveCall(null);
      navigationRef?.navigate('Main');
    } finally {
      setIsUserEndingCall(false);
    }
  };

  const handleIncomingCallAccept = async () => {
    if (incomingCall && user) {
      try {
        const userId = typeof user.id === 'number' ? user.id : Number(user.id);
        await ApiService.acceptCall(incomingCall.call_sid, userId);
        
        const acceptedCall: Call = {
          ...incomingCall,
          status: 'in-progress',
          start_time: new Date().toISOString(),
        };
        setActiveCall(acceptedCall);
        setIncomingCall(null);
        if (navigationRef) {
          navigationRef.navigate('ActiveCall', { call: acceptedCall });
        }
      } catch (error) {
        console.error('Accept call error:', error);
      }
    }
  };

  const handleIncomingCallReject = async () => {
    if (incomingCall && user) {
      try {
        const userId = typeof user.id === 'number' ? user.id : Number(user.id);
        await ApiService.rejectCall(incomingCall.call_sid, userId);
      } catch (error) {
        console.error('Reject call error:', error);
      }
    }
    setIncomingCall(null);
    if (navigationRef) {
      navigationRef.navigate('Main');
    }
  };

  const handleOutgoingCall = async (phoneNumber: string, contactName?: string) => {
    if (!user) {
      console.error('No authenticated user for making calls');
      return;
    }
    
    const newCall: Call = {
      id: Date.now(),
      call_sid: `temp_${Date.now()}`,
      user_id: String(user.id),
      direction: 'outgoing',
      from_number: user.phoneNumber || '',
      to_number: phoneNumber,
      contact_name: contactName || 'Unknown',
      phone_number: phoneNumber,
      status: 'initiating',
      duration: 0,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setActiveCall(newCall);
    
    if (navigationRef) {
      navigationRef.navigate('ActiveCall', { call: newCall });
    }
  };

  return (
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

        <Stack.Screen 
          name="AddContact"
          component={AddContactScreen}
          options={{
            presentation: 'modal',
            gestureDirection: 'vertical',
          }}
        />
        
        <Stack.Screen 
          name="ActiveCall"
          options={{
            presentation: 'modal',
            gestureEnabled: false,
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: { opacity: current.progress },
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
        
        <Stack.Screen 
          name="IncomingCall"
          options={{
            presentation: 'modal',
            gestureEnabled: false,
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: { opacity: current.progress },
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
  );
};

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.appContainer}>
        <StatusBar style="light" backgroundColor={Colors.primary} />
        <View style={styles.phoneContainer}>
          <AppContent />
        </View>
      </View>
    </AuthProvider>
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
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
});
