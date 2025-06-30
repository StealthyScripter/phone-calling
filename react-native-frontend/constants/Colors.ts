export const Colors = {
  // Primary Colors
  primary: {
    navy: '#1a1d29',
    darkBlue: '#252a38',
    brightGreen: '#00ff87',
    white: '#ffffff',
    lightGray: '#9ca3af',
  },

  // Secondary Colors
  secondary: {
    red: '#ef4444',
    yellow: '#fbbf24',
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1',
    orange: '#f97316',
  },

  // Semantic Colors
  semantic: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },

  // Gray Scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Avatar Colors
  avatar: [
    '#ef4444', '#10b981', '#3b82f6', '#fbbf24',
    '#8b5cf6', '#ec4899', '#6366f1', '#f97316',
    '#06b6d4', '#84cc16'
  ],

  // Call Status Colors
  call: {
    incoming: '#3b82f6',
    outgoing: '#00ff87',
    missed: '#ef4444',
    failed: '#ef4444',
    busy: '#f59e0b',
    connected: '#10b981',
  },
} as const;
