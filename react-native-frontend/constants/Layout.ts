import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const Layout = {
  // Screen Dimensions
  screen: {
    width: screenWidth,
    height: screenHeight,
  },

  // Spacing System (base unit: 4px)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },

  // Component Sizes
  components: {
    // Button Heights
    button: {
      small: 36,
      medium: 48,
      large: 56,
    },

    // Input Heights
    input: {
      default: 48,
      large: 56,
    },

    // Avatar Sizes
    avatar: {
      small: 32,
      medium: 48,
      large: 64,
      xlarge: 96,
    },

    // Icon Sizes
    icon: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    },

    // Header Height
    header: {
      default: 60,
      large: 80,
    },

    // Tab Bar Height
    tabBar: {
      height: 80,
    },
  },

  // Touch Targets (minimum 44px for accessibility)
  touchTarget: {
    minimum: 44,
  },

  // Safe Area
  safeArea: {
    top: 44,
    bottom: 34,
  },
} as const;
