import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Trophy, Shield, Sparkles, Droplets } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { GamificationProfile } from '../types';

interface StreakHUDProps {
  profile: GamificationProfile | null;
}

export const StreakHUD: React.FC<StreakHUDProps> = ({ profile }) => {
  const { theme, isDark } = useTheme();
  const currentStreak = profile?.currentStreak ?? 0;
  const longestStreak = profile?.longestStreak ?? 0;
  const xp = profile?.xpPoints ?? 0;
  const freePasses = profile?.freePassesAvailable ?? 0;
  const isWilted = profile?.plantStatus === 'Wilted';

  // XP level calculation (e.g. 100 XP per level)
  const currentLevel = Math.floor(xp / 100) + 1;
  const xpInCurrentLevel = xp % 100;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0A0E15' : '#F8FAFC',
          borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : theme.border,
        },
      ]}
    >
      {/* Top Badges Row */}
      <View style={styles.badgesRow}>
        {/* Streak Pill */}
        <View style={[styles.badge, styles.streakBadge, isWilted && styles.wiltedBadge]}>
          <Flame size={18} color={isWilted ? theme.wiltedText : theme.bloomGold} />
          <Text
            style={[
              styles.badgeText,
              { color: theme.textPrimary },
              isWilted && { color: theme.wiltedText },
            ]}
          >
            {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
          </Text>
        </View>

        {/* Lifetime Best Trophy */}
        <View style={[styles.badge, styles.trophyBadge]}>
          <Trophy size={16} color={theme.emerald} />
          <Text style={[styles.badgeText, { color: theme.textPrimary }]}>
            Best: {longestStreak}d
          </Text>
        </View>

        {/* Free Pass Shield */}
        <View style={[styles.badge, styles.shieldBadge]}>
          <Shield
            size={16}
            color={freePasses > 0 ? theme.emerald : theme.wiltedText}
          />
          <Text
            style={[
              styles.badgeText,
              { color: theme.textPrimary },
              freePasses === 0 && { color: theme.wiltedText },
            ]}
          >
            {freePasses} Pass
          </Text>
        </View>

        {/* Status Indicator */}
        <View style={[styles.badge, isWilted ? styles.thirstyBadge : styles.healthyBadge]}>
          <Droplets size={14} color={isWilted ? theme.amberWarning : theme.emerald} />
          <Text
            style={[
              styles.statusText,
              { color: isWilted ? theme.amberWarning : theme.emerald },
            ]}
          >
            {isWilted ? 'Thirsty' : 'Healthy'}
          </Text>
        </View>
      </View>

      {/* Level & XP Bar */}
      <View style={styles.xpContainer}>
        <View style={styles.xpHeader}>
          <View style={styles.levelTag}>
            <Sparkles size={13} color={theme.bloomGold} />
            <Text style={[styles.levelText, { color: theme.textPrimary }]}>
              Tier {currentLevel} • Adherence Level
            </Text>
          </View>
          <Text style={[styles.xpSubtext, { color: theme.textSecondary }]}>
            {xp} Pts ({xpInCurrentLevel}/100)
          </Text>
        </View>
        <View
          style={[
            styles.progressBarTrack,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(Math.max(xpInCurrentLevel, 5), 100)}%` },
              isWilted
                ? { backgroundColor: theme.wiltedText }
                : { backgroundColor: theme.primaryLight },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  streakBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
  },
  trophyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  shieldBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  healthyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  thirstyBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
  },
  wiltedBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderColor: 'rgba(107, 114, 128, 0.4)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  xpContainer: {
    marginTop: 10,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  xpSubtext: {
    fontSize: 11,
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
