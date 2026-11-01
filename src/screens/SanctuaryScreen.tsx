import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Plus, LogOut, Activity, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { User, Medication, AdherenceLog, GamificationProfile } from '../types';
import { StreakHUD } from '../components/StreakHUD';
import { GardenView } from '../components/GardenView';
import { DoseCard } from '../components/DoseCard';
import { DailyQuoteCard } from '../components/DailyQuoteCard';
import { medicationApi, adherenceApi, gamificationApi } from '../api';

interface SanctuaryScreenProps {
  user: User;
  onLogout: () => void;
  onOpenAddMedication: () => void;
  onOpenReminderModal: (log: AdherenceLog, med: Medication, level: 1 | 2 | 3) => void;
  onOpenCaregiverModal: (med: Medication) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  dataVersion?: number;
}

export const SanctuaryScreen: React.FC<SanctuaryScreenProps> = ({
  user,
  onLogout,
  onOpenAddMedication,
  onOpenReminderModal,
  onOpenCaregiverModal,
  showToast,
  dataVersion = 0,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<AdherenceLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const autoAlertedLogsRef = React.useRef<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      // 1. Fetch Profile
      const profileRes = await gamificationApi.getProfile(user._id);
      if (profileRes.data?.profile) {
        setProfile(profileRes.data.profile);
      }

      // 2. Fetch Medications
      const medsRes = await medicationApi.list(user._id);
      const fetchedMeds = medsRes.data?.medications || [];
      if (fetchedMeds.length > 0) {
        setMedications(fetchedMeds);
      }

      // 3. Fetch Adherence Logs
      const logsRes = await adherenceApi.getLogs(user._id);
      if (logsRes.data?.logs) {
        const fetchedLogs = logsRes.data.logs;
        setLogs(fetchedLogs);

        // Check if any due dose needs an automatic in-app reminder popup
        const dueLog = fetchedLogs.find(
          (l) =>
            l.status === 'Escalated' &&
            (l.escalationLevel || 0) >= 1 &&
            !autoAlertedLogsRef.current.has(l._id)
        );

        if (dueLog) {
          autoAlertedLogsRef.current.add(dueLog._id);
          const med =
            typeof dueLog.medId === 'object'
              ? (dueLog.medId as Medication)
              : fetchedMeds.find((m) => m._id === dueLog.medId);

          if (med) {
            onOpenReminderModal(dueLog, med, (dueLog.escalationLevel || 1) as 1 | 2 | 3);
          }
        }
      }
    } catch (e: any) {
      console.log('Error refreshing sanctuary data:', e.message);
    }
  };

  // Immediate re-fetch when dataVersion changes or on mount
  useEffect(() => {
    fetchData();
  }, [user._id, dataVersion]);

  // Periodic 15s interval to detect newly due medication intake times automatically
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData();
    }, 15000);
    return () => clearInterval(timer);
  }, [user._id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleTakeDose = async (log: AdherenceLog) => {
    const med =
      typeof log.medId === 'object'
        ? (log.medId as Medication)
        : medications.find((m) => m._id === log.medId);

    if (!med) {
      showToast('error', 'Medication details unavailable.');
      return;
    }

    if (log.escalationLevel === 4) {
      onOpenCaregiverModal(med);
    } else {
      onOpenReminderModal(log, med, (log.escalationLevel || 1) as 1 | 2 | 3);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primaryLight}
          />
        }
      >
        {/* Cyber-Medical Hero Command Section */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.35)' : theme.border,
              shadowColor: theme.primary,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBrandRow}>
              <View
                style={[
                  styles.logoRingWrapper,
                  {
                    borderColor: theme.primaryLight,
                    backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
                  },
                ]}
              >
                <Image
                  source={require('../../assets/MediAlert_Logo.jpeg')}
                  style={styles.heroLogo}
                />
              </View>
              <View style={styles.heroTextCol}>
                <View style={styles.heroBadgeRow}>
                  <Text style={[styles.heroAppName, { color: theme.primaryLight }]}>
                    MEDIALERT
                  </Text>
                  <View
                    style={[
                      styles.liveSyncChip,
                      {
                        backgroundColor: theme.alertContainer,
                        borderColor: theme.alertBorder,
                      },
                    ]}
                  >
                    <View style={[styles.liveSyncDot, { backgroundColor: theme.alert }]} />
                    <Text style={[styles.liveSyncText, { color: theme.alertLight }]}>
                      SAFETY NET ACTIVE
                    </Text>
                  </View>
                </View>
                <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                  Adherence Sanctuary
                </Text>
                <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                  {user.username} • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>

            {/* Top Right Controls: Theme Toggle + Logout */}
            <View style={styles.heroRightActions}>
              <TouchableOpacity
                style={[
                  styles.actionIconBtn,
                  {
                    backgroundColor: isDark ? '#141822' : '#F1F5F9',
                    borderColor: isDark ? '#242D3A' : '#E2E8F0',
                  },
                ]}
                onPress={toggleTheme}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Toggle Theme"
              >
                {isDark ? (
                  <Sun size={16} color="#F59E0B" />
                ) : (
                  <Moon size={16} color={theme.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionIconBtn,
                  {
                    backgroundColor: isDark ? '#141822' : '#F1F5F9',
                    borderColor: isDark ? '#242D3A' : '#E2E8F0',
                  },
                ]}
                onPress={onLogout}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Log Out"
              >
                <LogOut size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Quick Stat Ticker */}
          <View
            style={[
              styles.heroMetricsGrid,
              {
                backgroundColor: isDark ? '#090D14' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.heroMetricItem}>
              <Text style={[styles.heroMetricVal, { color: theme.textPrimary }]}>
                {profile?.currentStreak || 0}d
              </Text>
              <Text style={[styles.heroMetricLabel, { color: theme.textSecondary }]}>
                Streak
              </Text>
            </View>
            <View
              style={[
                styles.heroMetricDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
              ]}
            />
            <View style={styles.heroMetricItem}>
              <Text style={[styles.heroMetricVal, { color: theme.alertLight }]}>
                {logs.filter((l) => l.status !== 'Taken').length}
              </Text>
              <Text style={[styles.heroMetricLabel, { color: theme.textSecondary }]}>
                Due Today
              </Text>
            </View>
            <View
              style={[
                styles.heroMetricDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
              ]}
            />
            <View style={styles.heroMetricItem}>
              <Text style={[styles.heroMetricVal, { color: theme.primaryLight }]}>
                {profile?.treesGrown || 0}
              </Text>
              <Text style={[styles.heroMetricLabel, { color: theme.textSecondary }]}>
                Trees Grown
              </Text>
            </View>
          </View>
        </View>

        {/* 1. Daily Encouragement Quote Card */}
        <DailyQuoteCard streak={profile?.currentStreak || 0} />

        {/* 2. Embedded Recovery Gamification Card */}
        <View
          style={[
            styles.recoveryCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : theme.border,
              shadowColor: theme.primary,
            },
          ]}
        >
          <View style={styles.recoveryCardHeader}>
            <View style={styles.recoveryHeaderTitleRow}>
              <Activity size={18} color={theme.primaryLight} />
              <Text style={[styles.recoveryTitle, { color: theme.textPrimary }]}>
                Adherence & Wellness Plant
              </Text>
            </View>
            <View
              style={[
                styles.stageTag,
                {
                  backgroundColor: theme.primaryContainer,
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : '#BAE6FD',
                },
              ]}
            >
              <Text style={[styles.stageTagText, { color: theme.primaryLight }]}>
                {profile?.plantStage || 'Seed'}
              </Text>
            </View>
          </View>

          {/* Plant Animation / Dynamic Botanical Progress */}
          <GardenView
            plantStage={profile?.plantStage || 'Sprout'}
            plantStatus={profile?.plantStatus || 'Healthy'}
            streakDays={profile?.currentStreak || 0}
            growthPercentage={profile?.growthPercentage || 25}
            treesGrown={profile?.treesGrown || 0}
            dosagePeriodDays={medications[0]?.durationDays || 0}
            activeMedName={medications[0]?.drugName}
          />

          {/* Streak & Milestone Progress HUD */}
          {profile && <StreakHUD profile={profile} />}
        </View>

        {/* 3. Today's Adherence Schedule Timeline */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Today's Adherence Timeline
          </Text>
          <TouchableOpacity
            style={[styles.addMedQuickBtn, { backgroundColor: theme.primary }]}
            onPress={onOpenAddMedication}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.addMedQuickBtnText}>Add Rx</Text>
          </TouchableOpacity>
        </View>

        {logs.length === 0 ? (
          <View
            style={[
              styles.emptyDoseCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.2)' : theme.border,
              },
            ]}
          >
            <LottieView
              source={require('../../assets/animations/water_splash.json')}
              autoPlay
              loop
              style={styles.emptyLottie}
            />
            <Text style={[styles.emptyDoseTitle, { color: theme.textPrimary }]}>
              All Doses Up to Date
            </Text>
            <Text style={[styles.emptyDoseSubtext, { color: theme.textSecondary }]}>
              You have no pending medication doses right now. Great job maintaining your regimen!
            </Text>
          </View>
        ) : (
          logs.map((log) => {
            const med =
              typeof log.medId === 'object'
                ? (log.medId as Medication)
                : medications.find((m) => m._id === log.medId);

            return (
              <DoseCard
                key={log._id}
                log={log}
                medication={med}
                onTakeDose={() => handleTakeDose(log)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoRingWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  heroTextCol: {
    flex: 1,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  heroAppName: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  liveSyncChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  liveSyncDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  liveSyncText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  heroRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 14,
  },
  heroMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroMetricVal: {
    fontSize: 17,
    fontWeight: '800',
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  heroMetricDivider: {
    width: 1,
    height: 24,
  },
  recoveryCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  recoveryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recoveryHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recoveryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  stageTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  stageTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  addMedQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addMedQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyDoseCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    marginTop: 6,
  },
  emptyLottie: {
    width: 64,
    height: 64,
    marginBottom: 6,
  },
  emptyDoseTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDoseSubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
