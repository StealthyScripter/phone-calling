export const Colors = {
  // Main theme colors from prototype
  primary: '#1a1a2e',           // Dark navy background
  primaryDark: '#0f0f23',       // Darker gradient start
  primaryLight: '#16213e',      // Lighter gradient end
  accent: '#00ff88',            // Bright green accent
  accentSecondary: '#00d4ff',   // Blue accent for gradients
  
  // Background colors
  background: '#1a1a2e',
  backgroundGradient: ['#1a1a2e', '#16213e'] as const,
  cardBackground: 'rgba(255, 255, 255, 0.05)',
  cardBackgroundActive: 'rgba(255, 255, 255, 0.1)',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#888888',
  textTertiary: '#666666',
  
  // UI element colors
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderColorActive: 'rgba(255, 255, 255, 0.2)',
  
  // Status colors
  success: '#00ff88',
  warning: '#ffa500',
  error: '#ff4757',
  info: '#00d4ff',
  
  // Special colors for AI features
  aiGradient: ['#00ff88', '#00d4ff'] as const,
  savingsBackground: 'rgba(0, 255, 136, 0.1)',
  savingsBorder: '#00ff88',
  
  // Navigation colors
  navBackground: 'rgba(26, 26, 46, 0.95)',
  navActive: 'rgba(0, 255, 136, 0.1)',
  
  // Call screen colors
  answerButton: '#00ff88',
  declineButton: '#ff4757',
  
  // Input colors
  inputBackground: 'rgba(255, 255, 255, 0.1)',
  inputBorder: 'rgba(255, 255, 255, 0.2)',
  inputFocus: '#00ff88',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdropBlur: 'rgba(26, 26, 46, 0.95)',
};
