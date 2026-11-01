import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Clock, Users, User } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import hapticService from '../services/hapticService';

export type Tab = 'today' | 'medications' | 'caregiver' | 'profile';

interface CurvedBottomBarProps {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: 'today', label: 'Today', Icon: Home },
  { id: 'medications', label: 'Medicines', Icon: Clock },
  { id: 'caregiver', label: 'Circle of Care', Icon: Users },
  { id: 'profile', label: 'Profile', Icon: User },
];

export const CurvedBottomBar: React.FC<CurvedBottomBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();

  // Floating Bar Width with sensible boundaries
  const barWidth = Math.min(width - 32, 440);
  const tabWidth = barWidth / 4;

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const tabAnim = useRef(new Animated.Value(activeIndex >= 0 ? activeIndex : 0)).current;

  // Spring animation when activeTab changes
  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: activeIndex >= 0 ? activeIndex : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 50,
    }).start();
  }, [activeIndex]);

  const handlePress = (tab: Tab) => {
    hapticService.selection();
    onTabPress(tab);
  };

  // Dimensions of Scoop cutout & Floating Circle Bubble
  const scoopWidth = 76;
  const bubbleSize = 52;

  // Interpolated X translation for scoop and bubble
  const translateX = tabAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      (0 + 0.5) * tabWidth - scoopWidth / 2,
      (1 + 0.5) * tabWidth - scoopWidth / 2,
      (2 + 0.5) * tabWidth - scoopWidth / 2,
      (3 + 0.5) * tabWidth - scoopWidth / 2,
    ],
  });

  const ActiveIcon = TABS[activeIndex >= 0 ? activeIndex : 0].Icon;

  return (
    <View style={styles.outerWrapper} pointerEvents="box-none">
      <View
        style={[
          styles.barContainer,
          {
            width: barWidth,
            backgroundColor: isDark ? theme.bgCardElevated : theme.bgCard,
            borderColor: theme.border,
            shadowColor: isDark ? '#000000' : theme.primary,
            shadowOpacity: isDark ? 0.45 : 0.16,
          },
        ]}
      >
        {/* Animated Scooped Cutout (revealing background behind the bar) */}
        <Animated.View
          style={[
            styles.scoopWrapper,
            {
              transform: [{ translateX }],
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={scoopWidth} height={28} viewBox="0 0 76 28">
            {/* Cutout area blending seamlessly into screen background */}
            <Path
              d="M 0 0 C 14 0 20 28 38 28 C 56 28 62 0 76 0 Z"
              fill={theme.bg}
            />
            {/* Continuous matching border along the curved scoop */}
            <Path
              d="M 0 0 C 14 0 20 28 38 28 C 56 28 62 0 76 0"
              fill="none"
              stroke={theme.border}
              strokeWidth={1}
            />
          </Svg>
        </Animated.View>

        {/* Animated Floating Active Circle Bubble with MediAlert Brand Gradient */}
        <Animated.View
          style={[
            styles.bubbleWrapper,
            {
              transform: [{ translateX }],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={isDark ? [theme.primaryLight, theme.primary] : [theme.primaryLight, theme.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.activeBubble,
              {
                shadowColor: theme.primary,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.4)',
              },
            ]}
          >
            <ActiveIcon size={24} color="#FFFFFF" strokeWidth={2.4} />
          </LinearGradient>
        </Animated.View>

        {/* Inactive Tab Icon Buttons */}
        <View style={styles.tabsRow}>
          {TABS.map((tab, idx) => {
            const isActive = idx === activeIndex;
            const IconComponent = tab.Icon;

            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabButton}
                onPress={() => handlePress(tab.id)}
                activeOpacity={0.7}
                accessibilityLabel={tab.label}
              >
                <View style={styles.iconSlot}>
                  {!isActive ? (
                    <IconComponent
                      size={22}
                      color={theme.textMuted}
                      strokeWidth={2}
                    />
                  ) : (
                    // Spacer when active so layout stays consistent
                    <View style={{ width: 22, height: 22 }} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  barContainer: {
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    position: 'relative',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 10,
    overflow: 'visible',
  },
  scoopWrapper: {
    position: 'absolute',
    top: -1,
    left: 0,
    width: 76,
    height: 28,
    zIndex: 2,
  },
  bubbleWrapper: {
    position: 'absolute',
    top: -16,
    left: 0,
    width: 76,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  activeBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 9,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    zIndex: 5,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
});
