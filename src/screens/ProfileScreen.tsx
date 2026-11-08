import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import {
  User as UserIcon,
  ShieldCheck,
  Trees,
  Trophy,
  Flame,
  Activity,
  Pill,
  Calendar,
  Server,
  LogOut,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Shield,
  Droplets,
  Sun,
  Moon,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { User, GamificationProfile, Medication } from '../types';
import { gamificationApi, medicationApi } from '../api';
import client, { getAutoDetectedServerUrl } from '../api/client';
import { typography } from '../theme/typography';

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  dataVersion?: number;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogout,
  showToast,
  dataVersion = 0,
}) => {
  const { theme, themeMode, isDark, setThemeMode } = useTheme();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Server management state
  const [serverUrl, setServerUrl] = useState(client.getServerUrl());
  const [isEditingServer, setIsEditingServer] = useState(false);
  const [serverTestStatus, setServerTestStatus] = useState<string>('Online');

  const fetchData = async () => {
    try {
      const [profRes, medsRes] = await Promise.all([
        gamificationApi.getProfile(user._id),
        medicationApi.list(user._id),
      ]);
      if (profRes.data?.profile) setProfile(profRes.data.profile);
      if (medsRes.data?.medications) setMedications(medsRes.data.medications);
    } catch (e: any) {
      console.log('Error refreshing profile:', e.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user._id, dataVersion]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleTestConnection = async () => {
    setServerTestStatus('Testing...');
    const res = await client.testConnection(serverUrl);
    if (res.ok) {
      setServerTestStatus('Online');
      showToast('success', 'Backend connection verified.');
    } else {
      setServerTestStatus('Offline');
      showToast('error', res.statusText || 'Could not connect to backend.');
    }
  };

  const handleSaveServerUrl = async () => {
    await client.setServerUrl(serverUrl);
    setIsEditingServer(false);
    handleTestConnection();
  };

  const handleAutoDetectServer = async () => {
    const auto = getAutoDetectedServerUrl();
    setServerUrl(auto);
    await client.setServerUrl(auto);
    setIsEditingServer(false);
    handleTestConnection();
    showToast('info', `Server updated to ${auto}`);
  };

  const currentLevel = Math.floor((profile?.xpPoints || 0) / 100) + 1;
  const treesCount = profile?.treesGrown || 0;
  const totalDoses = profile?.totalDosesTaken || 0;

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
        {/* Cyber-Medical Hero Profile Section */}
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
            <View
              style={[
                styles.heroAvatarWrap,
                {
                  backgroundColor: isDark ? '#111827' : theme.primaryContainer,
                  borderColor: theme.primaryLight,
                },
              ]}
            >
              <UserIcon size={30} color={theme.primaryLight} />
              <View style={[styles.heroVerifiedDot, { backgroundColor: theme.emerald }]} />
            </View>
            <View style={styles.heroTextCol}>
              <View style={styles.heroTagRow}>
                <Text style={[styles.heroTagText, { color: theme.primaryLight }]}>
                  PATIENT ID #MED-{user._id ? user._id.slice(-4).toUpperCase() : '0001'}
                </Text>
                <View
                  style={[
                    styles.heroStatusChip,
                    {
                      backgroundColor: theme.primaryContainer,
                      borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : '#BAE6FD',
                    },
                  ]}
                >
                  <Text style={[styles.heroStatusChipText, { color: theme.primaryLight }]}>
                    {user.role.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                {user.username}
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                {user.phoneNumber || user.contactInfo || 'No phone set'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.heroLogoutBtn,
                {
                  backgroundColor: isDark ? '#141822' : '#F1F5F9',
                  borderColor: isDark ? '#242D3A' : '#E2E8F0',
                },
              ]}
              onPress={onLogout}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <LogOut size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Emergency ID Chip Row */}
          <View style={styles.heroEmergencyRow}>
            <View
              style={[
                styles.heroEmergencyItem,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#DCFCE7',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0',
                },
              ]}
            >
              <ShieldCheck size={13} color={theme.emerald} />
              <Text style={[styles.heroEmergencyText, { color: theme.emerald }]}>
                SMS Active
              </Text>
            </View>
            <View
              style={[
                styles.heroEmergencyItem,
                {
                  backgroundColor: theme.primaryContainer,
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : '#BAE6FD',
                },
              ]}
            >
              <Activity size={13} color={theme.primaryLight} />
              <Text style={[styles.heroEmergencyText, { color: theme.primaryLight }]}>
                Blood: O+
              </Text>
            </View>
            <View
              style={[
                styles.heroEmergencyItem,
                {
                  backgroundColor: theme.alertContainer,
                  borderColor: theme.alertBorder,
                },
              ]}
            >
              <View style={[styles.heroRedDot, { backgroundColor: theme.alert }]} />
              <Text style={[styles.heroEmergencyText, { color: theme.alertLight }]}>
                Escalation Ready
              </Text>
            </View>
          </View>

          {/* Quick Adherence Metrics */}
          <View
            style={[
              styles.heroStatsRow,
              {
                backgroundColor: isDark ? '#090D14' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: theme.textPrimary }]}>
                {profile?.currentStreak || 0}d
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                Current Streak
              </Text>
            </View>
            <View
              style={[
                styles.heroStatDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
              ]}
            />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: theme.primaryLight }]}>
                {profile?.treesGrown || 0}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                Trees Harvested
              </Text>
            </View>
            <View
              style={[
                styles.heroStatDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
              ]}
            />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: theme.bloomGold }]}>
                {profile?.freePassesAvailable || 1}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                Free Passes
              </Text>
            </View>
          </View>
        </View>

        {/* 1. Appearance & Theme Switcher Card */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Appearance & Theme
          </Text>
        </View>

        <View
          style={[
            styles.themeCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : theme.border,
            },
          ]}
        >
          <View style={styles.themeHeaderRow}>
            <View style={styles.themeHeaderLeft}>
              {isDark ? (
                <Moon size={20} color={theme.primaryLight} />
              ) : (
                <Sun size={20} color="#F59E0B" />
              )}
              <View>
                <Text style={[styles.themeTitle, { color: theme.textPrimary }]}>
                  {isDark ? 'Dark Sanctuary Mode' : 'Clinical Light Mode'}
                </Text>
                <Text style={[styles.themeSubtext, { color: theme.textMuted }]}>
                  Derived from Stitch AI design tokens
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.activeThemeBadge,
                { backgroundColor: theme.primaryContainer },
              ]}
            >
              <Text style={[styles.activeThemeBadgeText, { color: theme.primaryLight }]}>
                {themeMode.toUpperCase()} ACTIVE
              </Text>
            </View>
          </View>

          {/* Segmented Controls */}
          <View
            style={[
              styles.themeSegmentTrack,
              {
                backgroundColor: isDark ? '#0A0D14' : '#F1F5F9',
                borderColor: isDark ? '#1F2937' : '#E2E8F0',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.themeSegmentBtn,
                isDark && [styles.themeSegmentBtnActive, { backgroundColor: theme.primary }],
              ]}
              onPress={() => setThemeMode('dark')}
            >
              <Moon size={15} color={isDark ? '#FFFFFF' : theme.textMuted} />
              <Text
                style={[
                  styles.themeSegmentText,
                  { color: isDark ? '#FFFFFF' : theme.textMuted },
                  isDark && styles.themeSegmentTextActive,
                ]}
              >
                Dark (Cyber-Medical)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeSegmentBtn,
                !isDark && [styles.themeSegmentBtnActive, { backgroundColor: theme.primary }],
              ]}
              onPress={() => setThemeMode('light')}
            >
              <Sun size={15} color={!isDark ? '#FFFFFF' : theme.textMuted} />
              <Text
                style={[
                  styles.themeSegmentText,
                  { color: !isDark ? '#FFFFFF' : theme.textMuted },
                  !isDark && styles.themeSegmentTextActive,
                ]}
              >
                Light (Clinical Pure)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Health & Adherence Metrics Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Treatment & Adherence Record
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          {/* Streak Card */}
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.22)' : theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: isDark ? '#1C1917' : '#FEF3C7' },
              ]}
            >
              <Flame size={20} color={theme.bloomGold} />
            </View>
            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
              {profile?.currentStreak || 0} Days
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Current Streak
            </Text>
          </View>

          {/* Longest Streak */}
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.22)' : theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' },
              ]}
            >
              <Trophy size={20} color={theme.emerald} />
            </View>
            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
              {profile?.longestStreak || 0} Days
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Best Record
            </Text>
          </View>

          {/* Total Doses */}
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.22)' : theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: theme.primaryContainer },
              ]}
            >
              <CheckCircle2 size={20} color={theme.primaryLight} />
            </View>
            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
              {totalDoses}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Doses Confirmed
            </Text>
          </View>

          {/* Active Prescriptions */}
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.22)' : theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: theme.primaryContainer },
              ]}
            >
              <Pill size={20} color={theme.primaryLight} />
            </View>
            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
              {medications.length}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Active Rx Courses
            </Text>
          </View>
        </View>

        {/* 3. Botanical Collection & Harvest Sanctuary */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Botanical Harvest Collection
          </Text>
        </View>

        <View
          style={[
            styles.gardenCollectionCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : theme.border,
            },
          ]}
        >
          <View style={styles.gardenTopRow}>
            <View style={styles.gardenTopLeft}>
              <Trees size={22} color={theme.emerald} />
              <View>
                <Text style={[styles.gardenTitle, { color: theme.textPrimary }]}>
                  {treesCount} Mature Plants Grown
                </Text>
                <Text style={[styles.gardenSubtext, { color: theme.textMuted }]}>
                  Harvested from completed adherence courses & weekly cycles
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.harvestStatsRow,
              {
                backgroundColor: isDark ? '#0A0D14' : '#F8FAFC',
                borderColor: isDark ? '#1F2937' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.harvestStat}>
              <Sparkles size={14} color={theme.bloomGold} />
              <Text style={[styles.harvestStatLabel, { color: theme.textSecondary }]}>
                Tier {currentLevel}
              </Text>
              <Text style={[styles.harvestStatValue, { color: theme.textPrimary }]}>
                {profile?.xpPoints || 0} XP
              </Text>
            </View>

            <View style={styles.harvestStat}>
              <Droplets size={14} color={theme.primaryLight} />
              <Text style={[styles.harvestStatLabel, { color: theme.textSecondary }]}>
                Current Growth
              </Text>
              <Text style={[styles.harvestStatValue, { color: theme.textPrimary }]}>
                {profile?.growthPercentage || 25}%
              </Text>
            </View>

            <View style={styles.harvestStat}>
              <Shield size={14} color={theme.emerald} />
              <Text style={[styles.harvestStatLabel, { color: theme.textSecondary }]}>
                Streak Shields
              </Text>
              <Text style={[styles.harvestStatValue, { color: theme.textPrimary }]}>
                {profile?.freePassesAvailable || 1}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Active Prescriptions Summary */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Active Medication Schedules ({medications.length})
          </Text>
        </View>

        {medications.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? '#1D2533' : theme.border,
              },
            ]}
          >
            <Text style={[styles.emptyCardText, { color: theme.textMuted }]}>
              No active medications found.
            </Text>
          </View>
        ) : (
          medications.map((med) => {
            const courseLabel =
              (med.durationDays || 0) > 0
                ? `${med.durationDays}-Day Course`
                : 'Ongoing Weekly Bloom Cycle';

            return (
              <View
                key={med._id}
                style={[
                  styles.medSummaryCard,
                  {
                    backgroundColor: theme.bgCard,
                    borderColor: isDark ? 'rgba(0, 123, 167, 0.2)' : theme.border,
                  },
                ]}
              >
                <View style={styles.medSummaryLeft}>
                  <Pill size={16} color={theme.primaryLight} />
                  <View>
                    <Text style={[styles.medSummaryName, { color: theme.textPrimary }]}>
                      {med.drugName}
                    </Text>
                    <Text style={[styles.medSummaryDosage, { color: theme.textSecondary }]}>
                      {med.quantity || '1 pill'} • {med.dosage} • Times: {med.scheduleInterval}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.courseTag,
                    {
                      backgroundColor: theme.primaryContainer,
                      borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : '#BAE6FD',
                    },
                  ]}
                >
                  <Calendar size={11} color={theme.primaryLight} />
                  <Text style={[styles.courseTagText, { color: theme.primaryLight }]}>
                    {courseLabel}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* 5. Device & Network Configuration */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Device & Network Settings
          </Text>
        </View>

        <View
          style={[
            styles.settingsCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : theme.border,
            },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Server size={18} color={theme.primaryLight} />
              <View>
                <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                  Backend Server Address
                </Text>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                  {serverUrl}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor:
                    serverTestStatus === 'Online'
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.15)'
                        : '#DCFCE7'
                      : isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : '#FEE2E2',
                },
              ]}
            >
              <View
                style={[
                  styles.statusPillDot,
                  {
                    backgroundColor:
                      serverTestStatus === 'Online' ? theme.emerald : theme.alert,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: serverTestStatus === 'Online' ? theme.emerald : theme.alert,
                  },
                ]}
              >
                {serverTestStatus}
              </Text>
            </View>
          </View>

          {isEditingServer ? (
            <View style={styles.serverEditBox}>
              <TextInput
                style={[
                  styles.serverEditInput,
                  {
                    backgroundColor: isDark ? '#0A0D14' : '#F8FAFC',
                    borderColor: isDark ? '#242D3A' : '#CBD5E1',
                    color: theme.textPrimary,
                  },
                ]}
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
              />
              <View style={styles.serverEditButtons}>
                <TouchableOpacity
                  style={[styles.serverActionBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSaveServerUrl}
                >
                  <Text style={styles.serverActionBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.serverActionBtnAuto,
                    {
                      backgroundColor: theme.primaryContainer,
                      borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : '#BAE6FD',
                    },
                  ]}
                  onPress={handleAutoDetectServer}
                >
                  <RefreshCw size={12} color={theme.primaryLight} />
                  <Text style={[styles.serverActionBtnAutoText, { color: theme.primaryLight }]}>
                    Auto-Detect
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.settingActionRow}>
              <TouchableOpacity
                style={styles.textButton}
                onPress={() => setIsEditingServer(true)}
              >
                <Text style={[styles.textButtonText, { color: theme.primaryLight }]}>
                  Change IP Address
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.textButton}
                onPress={handleTestConnection}
              >
                <Text style={[styles.textButtonText, { color: theme.primaryLight }]}>
                  Ping Server
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 6. Sign Out Button */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: theme.alertContainer,
              borderColor: theme.alertBorder,
            },
          ]}
          onPress={onLogout}
        >
          <LogOut size={18} color={theme.alert} />
          <Text style={[styles.logoutBtnText, { color: theme.alert }]}>
            Log Out of MediAlert
          </Text>
        </TouchableOpacity>

        <Text style={[styles.versionFooter, { color: theme.textSubtle }]}>
          MediAlert Protocol • Version 1.2.0 • Secured Healthcare Architecture
        </Text>
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
    padding: 18,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroVerifiedDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroTextCol: {
    flex: 1,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  heroTagText: {
    fontFamily: typography.extraBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroStatusChip: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  heroStatusChipText: {
    fontFamily: typography.bold,
    fontSize: 9,
    fontWeight: '700',
  },
  heroTitle: {
    fontFamily: typography.extraBold,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontFamily: typography.medium,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  heroLogoutBtn: {
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  heroEmergencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  heroEmergencyText: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  heroRedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 14,
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatVal: {
    fontFamily: typography.extraBold,
    fontSize: 17,
    fontWeight: '800',
  },
  heroStatLabel: {
    fontFamily: typography.semiBold,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
  },
  themeCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  themeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  themeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeTitle: {
    fontFamily: typography.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  themeSubtext: {
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 1,
  },
  activeThemeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeThemeBadgeText: {
    fontFamily: typography.bold,
    fontSize: 10,
    fontWeight: '700',
  },
  themeSegmentTrack: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  themeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  themeSegmentBtnActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  themeSegmentText: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  themeSegmentTextActive: {
    fontFamily: typography.extraBold,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: typography.extraBold,
    fontSize: 16,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontFamily: typography.extraBold,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: typography.semiBold,
    fontSize: 11,
    fontWeight: '600',
  },
  gardenCollectionCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  gardenTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gardenTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  gardenTitle: {
    fontFamily: typography.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  gardenSubtext: {
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 2,
  },
  harvestStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  harvestStat: {
    alignItems: 'center',
    gap: 3,
  },
  harvestStatLabel: {
    fontFamily: typography.semiBold,
    fontSize: 10,
    fontWeight: '600',
  },
  harvestStatValue: {
    fontFamily: typography.extraBold,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyCardText: {
    fontFamily: typography.regular,
    fontSize: 13,
  },
  medSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 10,
  },
  medSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  medSummaryName: {
    fontFamily: typography.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  medSummaryDosage: {
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: 2,
  },
  courseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  courseTagText: {
    fontFamily: typography.semiBold,
    fontSize: 10,
    fontWeight: '600',
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  settingTitle: {
    fontFamily: typography.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  settingValue: {
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  serverEditBox: {
    marginTop: 12,
    gap: 8,
  },
  serverEditInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontFamily: typography.regular,
    fontSize: 12,
  },
  serverEditButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  serverActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverActionBtnText: {
    fontFamily: typography.bold,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  serverActionBtnAuto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  serverActionBtnAutoText: {
    fontFamily: typography.bold,
    fontWeight: '700',
    fontSize: 11,
  },
  settingActionRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  textButton: {
    paddingVertical: 4,
  },
  textButtonText: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  logoutBtnText: {
    fontFamily: typography.extraBold,
    fontSize: 14,
    fontWeight: '800',
  },
  versionFooter: {
    fontFamily: typography.regular,
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 20,
  },
});
