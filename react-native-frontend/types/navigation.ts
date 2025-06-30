export type RootStackParamList = {
  // Main app navigation
  Main: undefined;
  
  // Authentication flow
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  
  // Call screens
  IncomingCall: { 
    callSid: string; 
    callerInfo: {
      name?: string;
      phoneNumber: string;
      avatar?: string;
    };
  };
  ActiveCall: { 
    callSid: string;
    contact?: ContactResponse;
  };
  CallHistory: undefined;
  CallDetails: { callId: string };
  
  // Contact screens
  ContactDetails: { contactId: string };
  ContactEdit: { contactId?: string };
  ContactImport: undefined;
  
  // Settings screens
  Settings: undefined;
  Profile: undefined;
  Privacy: undefined;
  Notifications: undefined;
  Audio: undefined;
  About: undefined;
  
  // Other screens
  Search: { type: 'contacts' | 'calls' };
  QRCode: undefined;
  Help: undefined;
  Feedback: undefined;
};

export type TabParamList = {
  Dialer: undefined;
  Recent: undefined;
  Contacts: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
  ResetPassword: { token: string };
};

// Navigation prop types
export type ScreenProps<T extends keyof RootStackParamList> = {
  navigation: any; // Replace with proper navigation type from @react-navigation
  route: {
    key: string;
    name: T;
    params: RootStackParamList[T];
  };
};

export type TabScreenProps<T extends keyof TabParamList> = {
  navigation: any;
  route: {
    key: string;
    name: T;
    params: TabParamList[T];
  };
};

// Screen options
export interface ScreenOptions {
  title?: string;
  headerShown?: boolean;
  headerTransparent?: boolean;
  headerStyle?: any;
  headerTitleStyle?: any;
  headerTintColor?: string;
  headerBackTitle?: string;
  gestureEnabled?: boolean;
  animation?: 'slide' | 'fade' | 'none';
}

// Deep linking types
export interface DeepLinkConfig {
  screens: {
    [K in keyof RootStackParamList]: string | {
      path: string;
      exact?: boolean;
      screens?: any;
    };
  };
}

export interface LinkingOptions {
  prefixes: string[];
  config: {
    screens: DeepLinkConfig['screens'];
  };
}

// Navigation state types
export interface NavigationState {
  index: number;
  routeNames: string[];
  routes: Array<{
    key: string;
    name: string;
    params?: any;
  }>;
  type: string;
  stale?: boolean;
}

export interface NavigationAction {
  type: string;
  payload?: any;
  source?: string;
  target?: string;
}