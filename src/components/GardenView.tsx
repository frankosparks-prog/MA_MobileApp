import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Sparkles, Droplets, Calendar, Trees } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { PlantStage, PlantStatus, PlantType } from '../types';
import { PlantIllustration } from './PlantIllustration';

interface GardenViewProps {
  plantStage?: PlantStage;
  plantStatus?: PlantStatus;
  plantType?: PlantType;
  streakDays?: number;
  growthPercentage?: number;
  treesGrown?: number;
  dosagePeriodDays?: number;
  activeMedName?: string;
}

export const GardenView: React.FC<GardenViewProps> = ({
  plantStage = 'Sprout',
  plantStatus = 'Healthy',
  plantType = 'Sunflower',
  streakDays = 1,
  growthPercentage = 25,
  treesGrown = 0,
  dosagePeriodDays = 0,
  activeMedName,
}) => {
  const { theme, isDark } = useTheme();
  const isWilted = plantStatus === 'Wilted';
  const effectiveGrowth = Math.max(Math.min(growthPercentage, 100), 10);

  // Swaying breathing animation
  const sway = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 3400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  // Growth pulse effect whenever growth percentage updates
  useEffect(() => {
    pulseScale.value = withSequence(
      withSpring(1.08, { damping: 4, stiffness: 120 }),
      withTiming(1, { duration: 400 })
    );
  }, [growthPercentage]);

  const animatedPlantStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: pulseScale.value },
        { rotate: `${sway.value * (isWilted ? 1.5 : 2.5)}deg` },
        { translateY: isWilted ? 8 : sway.value * 2 },
      ],
      opacity: isWilted ? 0.65 : 1,
    };
  });

  return (
    <View style={styles.container}>
      {/* Background Glow / Halo */}
      <View
        style={[
          styles.halo,
          {
            backgroundColor: isWilted
              ? theme.plantHaloWilted
              : theme.plantHaloHealthy,
          },
        ]}
      />

      {/* Botanical Plant Canvas */}
      <Animated.View style={[styles.plantCanvas, animatedPlantStyle]}>
        <PlantIllustration size={170} progress={effectiveGrowth} />

        {/* Floating Thirst Indicator if overdue */}
        {isWilted && (
          <View
            style={[
              styles.thirstBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(10, 10, 10, 0.9)'
                  : 'rgba(255, 255, 255, 0.95)',
                borderColor: theme.alertBorder,
              },
            ]}
          >
            <Droplets size={12} color={theme.alert} />
            <Text style={[styles.thirstBadgeText, { color: theme.alertLight }]}>
              Thirsty
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Growth Progress HUD Card */}
      <View
        style={[
          styles.hudCard,
          {
            backgroundColor: isDark ? '#0D121B' : '#F8FAFC',
            borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : theme.border,
          },
        ]}
      >
        {/* Top Info Row */}
        <View style={styles.hudHeaderRow}>
          <View style={styles.stageTag}>
            <Sparkles size={12} color={theme.bloomGold} />
            <Text style={[styles.stageTagText, { color: theme.textPrimary }]}>
              Stage: {plantStage} ({effectiveGrowth}%)
            </Text>
          </View>

          <View
            style={[
              styles.statusTag,
              isWilted
                ? { backgroundColor: theme.alertContainer }
                : { backgroundColor: theme.primaryContainer },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isWilted ? theme.alert : theme.primaryLight },
              ]}
            />
            <Text
              style={[
                styles.statusTagText,
                { color: isWilted ? theme.alertLight : theme.primaryLight },
              ]}
            >
              {isWilted ? 'Thirsty • Dose Pending' : 'Healthy Growth'}
            </Text>
          </View>
        </View>

        {/* Dynamic Growth Bar */}
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: isDark ? '#1E2638' : '#E2E8F0' },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${effectiveGrowth}%`,
                backgroundColor: isWilted ? theme.alert : theme.primaryLight,
              },
            ]}
          />
        </View>

        {/* Bottom Details Row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Calendar size={13} color={theme.primaryLight} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {dosagePeriodDays > 0
                ? `${dosagePeriodDays}-Day Course`
                : 'Ongoing Weekly Bloom Cycle'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Trees size={13} color={theme.emerald} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {treesGrown} {treesGrown === 1 ? 'Tree' : 'Trees'} Harvested
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    top: 15,
    width: 220,
    height: 220,
    borderRadius: 110,
    zIndex: 0,
  },
  plantCanvas: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    width: 240,
    position: 'relative',
  },
  lottiePlant: {
    width: 230,
    height: 230,
  },
  thirstBadge: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  thirstBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hudCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  hudHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stageTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
