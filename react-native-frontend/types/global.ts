export interface AppConfig {
  apiBaseUrl: string;
  websocketUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildNumber: string;
}

export interface DeviceInfo {
  platform: 'ios' | 'android';
  version: string;
  model: string;
  isTablet: boolean;
  hasNotch: boolean;
}

export interface NetworkState {
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'unknown';
  isInternetReachable: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface FileUpload {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface SearchParams {
  query: string;
  filters?: FilterParams;
  pagination?: PaginationParams;
  sort?: SortParams;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Form types
export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
  disabled?: boolean;
}

export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: number;
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}
