import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { PhoneIcon, ClockIcon, UsersIcon, SettingsIcon } from './Icons';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export const ModernTabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation }) => {
  const getTabIcon = (routeName: string, focused: boolean) => {
    const iconColor = focused ? Colors.accent : Colors.textSecondary;
    const iconSize = 24;

    switch (routeName) {
      case 'Dialer':
        return <PhoneIcon size={iconSize} color={iconColor} />;
      case 'Recent':
        return <ClockIcon size={iconSize} color={iconColor} />;
      case 'Contacts':
        return <UsersIcon size={iconSize} color={iconColor} />;
      case 'Settings':
        return <SettingsIcon size={iconSize} color={iconColor} />;
      default:
        return <PhoneIcon size={iconSize} color={iconColor} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'Recent':
        return 'Recent';
      case 'Contacts':
        return 'Contacts';
      case 'Settings':
        return 'Settings';
      default:
        return 'Dialer';
    }
  };

  return (
    <View style={styles.tabBar}>
      <View style={styles.tabBarContent}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined 
            ? options.tabBarLabel 
            : options.title !== undefined 
            ? options.title 
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
              activeOpacity={0.8}
            >
              <View style={styles.tabIcon}>
                {getTabIcon(route.name, isFocused)}
              </View>
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? Colors.accent : Colors.textSecondary }
              ]}>
                {getTabLabel(route.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    backgroundColor: '#17203b',
    shadowColor: '#101010',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
    backgroundColor: '#17203b',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: Colors.navActive,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});