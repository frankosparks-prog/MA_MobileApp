import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, User as UserIcon, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { User } from '../types';
import hapticService from '../services/hapticService';

interface TopNavBarProps {
  user: User | null;
  unreadCount?: number;
  onPressLogo?: () => void;
  onPressNotifications?: () => void;
  onPressProfile?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  user,
  unreadCount = 0,
  onPressLogo,
  onPressNotifications,
  onPressProfile,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();

  // Top inset padding with sensible minimums for status bar
  const topPadding = Math.max(insets.top, Platform.OS === 'ios' ? 44 : (Platform.OS === 'android' ? 24 : 12));

  const handleLogoPress = () => {
    hapticService.selection();
    onPressLogo?.();
  };

  const handleBellPress = () => {
    hapticService.selection();
    onPressNotifications?.();
  };

  const handleProfilePress = () => {
    hapticService.selection();
    onPressProfile?.();
  };

  const handleThemeToggle = () => {
    hapticService.selection();
    toggleTheme();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          backgroundColor: isDark ? '#0A0E17' : '#FFFFFF',
          borderBottomColor: isDark ? 'rgba(0, 123, 167, 0.2)' : '#E2E8F0',
          shadowColor: isDark ? '#000000' : '#0F172A',
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left: Brand Logo */}
        <TouchableOpacity
          style={styles.logoButton}
          onPress={handleLogoPress}
          activeOpacity={0.7}
          accessibilityLabel="MediAlert Home"
        >
          <View
            style={[
              styles.logoWrapper,
              isDark && styles.logoWrapperDark,
            ]}
          >
            <Image
              source={require('../../assets/MediAlertLogo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        {/* Right: Actions (Theme Toggle, Bell Icon, Profile Avatar) */}
        <View style={styles.rightActionsRow}>
          {/* Subtle Ambient Theme Toggle */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: isDark ? '#141A26' : '#F1F5F9',
                borderColor: isDark ? '#232E42' : '#E2E8F0',
              },
            ]}
            onPress={handleThemeToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Toggle Dark / Light Theme"
          >
            {isDark ? (
              <Sun size={17} color="#F59E0B" />
            ) : (
              <Moon size={17} color={theme.primary} />
            )}
          </TouchableOpacity>

          {/* Bell Notification Button */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={handleBellPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Notifications, ${unreadCount} unread`}
          >
            <View style={styles.bellIconContainer}>
              <Bell
                size={22}
                color={isDark ? '#F1F5F9' : '#334155'}
                strokeWidth={2}
              />

              {/* Notification Glowing Badge */}
              {unreadCount > 0 && (
                <View style={styles.notificationAura}>
                  <View style={styles.notificationDot} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Profile Avatar Button */}
          <TouchableOpacity
            style={[
              styles.profileButton,
              {
                backgroundColor: isDark ? '#007BA7' : '#00627F',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : '#004A61',
              },
            ]}
            onPress={handleProfilePress}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel="View Profile"
          >
            <UserIcon size={19} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 1,
    zIndex: 100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  contentRow: {
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoButton: {
    paddingVertical: 4,
    paddingRight: 8,
    justifyContent: 'center',
  },
  logoWrapper: {
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  logoWrapperDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  logoImage: {
    width: 124,
    height: 38,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationAura: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007BA7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});

