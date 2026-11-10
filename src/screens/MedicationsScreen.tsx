import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Plus,
  Trash2,
  Clock,
  Pill,
  Edit3,
  AlertCircle,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  Heart,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { Medication, User } from '../types';
import { medicationApi } from '../api';
import { typography } from '../theme/typography';
import { BicycleIllustration } from '../components/BicycleIllustration';
import hapticService from '../services/hapticService';

interface MedicationsScreenProps {
  user: User;
  onOpenAddMedication: () => void;
  onEditMedication: (med: Medication) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  dataVersion?: number;
  onMedicationDeleted?: () => void;
}

/**
 * Format 24h string (e.g. "08:00" or "20:30") into a clean 12h display string ("8:00 AM")
 */
const formatScheduleTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }
  return trimmed;
};

export const MedicationsScreen: React.FC<MedicationsScreenProps> = ({
  user,
  onOpenAddMedication,
  onEditMedication,
  showToast,
  dataVersion = 0,
  onMedicationDeleted,
}) => {
  const { theme, isDark } = useTheme();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMeds = async () => {
    setLoading(true);
    try {
      const res = await medicationApi.list(user._id);
      if (res.data?.medications) {
        setMedications(res.data.medications);
      }
    } catch (e: any) {
      console.log('Error fetching medications:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeds();
  }, [user._id, dataVersion]);

  const onRefresh = async () => {
    hapticService.selection();
    setRefreshing(true);
    await fetchMeds();
    setRefreshing(false);
  };

  const handleOpenAdd = () => {
    hapticService.selection();
    onOpenAddMedication();
  };

  const handleOpenEdit = (med: Medication) => {
    hapticService.selection();
    onEditMedication(med);
  };

  const handleDelete = (medId: string, name: string) => {
    hapticService.selection();
    Alert.alert(
      'Remove Prescription',
      `Are you sure you want to remove "${name}" from your active schedule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationApi.delete(medId);
              setMedications((prev) => prev.filter((m) => m._id !== medId));
              showToast('info', `Removed "${name}" from your active schedule.`);
              onMedicationDeleted?.();
            } catch (e: any) {
              showToast('error', `Failed to delete medication: ${e.message}`);
            }
          },
        },
      ]
    );
  };

  // Compute total daily doses scheduled
  const totalDailyDoses = medications.reduce((acc, m) => {
    if (!m.scheduleInterval) return acc + 1;
    return acc + m.scheduleInterval.split(',').filter(Boolean).length;
  }, 0);

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
        {/* ============================================================== */}
        {/* UNIFIED HERO CARD (Matches Home Screen Sanctuary Design Language) */}
        {/* ============================================================== */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.35)' : '#BAE6FD',
              shadowColor: theme.primary,
            },
          ]}
        >
          {/* Top Header Label */}
          <View style={styles.heroTopProtocolRow}>
            <View style={styles.protocolTitleRow}>
              <View
                style={[
                  styles.protocolIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0, 123, 167, 0.2)'
                      : theme.primaryContainer,
                  },
                ]}
              >
                <Pill size={15} color={theme.primaryLight} />
              </View>
              <Text style={[styles.protocolLabel, { color: theme.textPrimary }]}>
                Prescriptions & Regimens
              </Text>
            </View>
          </View>

          {/* Greeting Typography & Animated Riding Bicycle Centerpiece */}
          <View style={styles.greetingCenterRow}>
            <View style={styles.greetingTextColumn}>
              <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>
                Active Regimens
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Manage your daily dosage schedule, strengths, and reminder intervals.
              </Text>

              {/* Add Prescription Primary Action Button */}
              <TouchableOpacity
                style={[
                  styles.addRxPillBtn,
                  {
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary,
                  },
                ]}
                onPress={handleOpenAdd}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.addRxPillBtnText}>Add Prescription</Text>
              </TouchableOpacity>
            </View>

            {/* Animated Riding Bicycle Illustration with Ambient Glowing Aura */}
            <View style={styles.targetIllustrationWrap}>
              <View
                style={[
                  styles.targetAmbientAura,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0, 123, 167, 0.22)'
                      : 'rgba(186, 230, 253, 0.6)',
                  },
                ]}
              />
              <BicycleIllustration size={132} />
            </View>
          </View>

          {/* 3 Metric Quick Badges Row (Active Rx, Daily Doses, Safety Guard) */}
          <View style={styles.metricsRow}>
            {/* 1. Active Rx Count */}
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: isDark ? '#101E2E' : '#F0F9FF',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : '#E0F2FE',
                },
              ]}
            >
              <View
                style={[
                  styles.metricIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(56, 189, 248, 0.18)'
                      : '#E0F2FE',
                  },
                ]}
              >
                <Pill size={17} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.3} />
              </View>
              <Text style={[styles.metricValue, { color: isDark ? '#38BDF8' : '#0369A1' }]}>
                {medications.length}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Active Rx
              </Text>
            </View>

            {/* 2. Doses / Day */}
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: isDark ? '#1C1917' : '#FFFBEB',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.22)' : '#FEF3C7',
                },
              ]}
            >
              <View
                style={[
                  styles.metricIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(245, 158, 11, 0.18)'
                      : '#FEF3C7',
                  },
                ]}
              >
                <Clock size={17} color="#F59E0B" strokeWidth={2.3} />
              </View>
              <Text style={[styles.metricValue, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                {totalDailyDoses}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Doses / Day
              </Text>
            </View>

            {/* 3. Safety Guard Armed */}
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: isDark ? '#06261C' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5',
                },
              ]}
            >
              <View
                style={[
                  styles.metricIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(16, 185, 129, 0.18)'
                      : '#D1FAE5',
                  },
                ]}
              >
                <ShieldCheck size={17} color="#10B981" strokeWidth={2.3} />
              </View>
              <Text style={[styles.metricValue, { color: '#10B981' }]}>
                Active
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Caregiver Net
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================== */}
        {/* PRESCRIPTIONS SECTION HEADER */}
        {/* ============================================================== */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <ClipboardList size={20} color={theme.primaryLight} strokeWidth={2.4} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Configured Regimens
            </Text>
            <View
              style={[
                styles.sectionBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(0, 123, 167, 0.2)'
                    : theme.primaryContainer,
                  borderColor: isDark
                    ? 'rgba(56, 189, 248, 0.3)'
                    : '#BAE6FD',
                },
              ]}
            >
              <Text style={[styles.sectionBadgeText, { color: theme.primaryLight }]}>
                {medications.length} Active
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================== */}
        {/* EMPTY STATE */}
        {/* ============================================================== */}
        {medications.length === 0 && (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: isDark ? '#111827' : '#F0F9FF' },
              ]}
            >
              <Pill size={36} color={theme.primaryLight} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              No Prescriptions Configured
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Tap "Add Prescription" to schedule your dose intervals, strengths, and automated caregiver SMS safety net.
            </Text>
            <TouchableOpacity
              style={[
                styles.emptyActionBtn,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleOpenAdd}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.emptyActionBtnText}>Register First Prescription</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* MEDICATION PRESCRIPTION CARDS */}
        {/* ============================================================== */}
        {medications.map((med) => {
          const times = med.scheduleInterval ? med.scheduleInterval.split(',').filter(Boolean) : ['08:00'];

          return (
            <View
              key={med._id}
              style={[
                styles.medCard,
                {
                  backgroundColor: theme.bgCard,
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.22)' : theme.border,
                  shadowColor: theme.primary,
                },
              ]}
            >
              {/* Left Medical Accent Stripe (Matches Home Screen Due Card) */}
              <View
                style={[
                  styles.cardLeftStripe,
                  { backgroundColor: isDark ? '#007BA7' : '#0284C7' },
                ]}
              />

              <View style={styles.medCardContent}>
                {/* Top Info & Actions Row */}
                <View style={styles.cardTop}>
                  <View style={styles.iconAndName}>
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: isDark
                            ? 'rgba(0, 123, 167, 0.2)'
                            : theme.primaryContainer,
                          borderColor: isDark
                            ? 'rgba(56, 189, 248, 0.35)'
                            : '#BAE6FD',
                        },
                      ]}
                    >
                      <Pill size={22} color={theme.primaryLight} strokeWidth={2.2} />
                    </View>

                    <View style={styles.titleArea}>
                      <Text style={[styles.drugName, { color: theme.textPrimary }]}>
                        {med.drugName}
                      </Text>
                      <View style={styles.qtyRow}>
                        <View
                          style={[
                            styles.qtyChip,
                            {
                              backgroundColor: isDark
                                ? '#142136'
                                : theme.primaryContainer,
                              borderColor: isDark
                                ? 'rgba(56, 189, 248, 0.3)'
                                : '#BAE6FD',
                            },
                          ]}
                        >
                          <Text style={[styles.qtyText, { color: theme.primaryLight }]}>
                            {med.quantity || '1 pill'}
                          </Text>
                        </View>
                        <Text style={[styles.dosageText, { color: theme.textSecondary }]}>
                          • {med.dosage}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Edit & Delete Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtnIcon,
                        {
                          backgroundColor: isDark
                            ? '#131D2D'
                            : '#F0F9FF',
                          borderColor: isDark
                            ? 'rgba(56, 189, 248, 0.3)'
                            : '#BAE6FD',
                        },
                      ]}
                      onPress={() => handleOpenEdit(med)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Edit Prescription"
                    >
                      <Edit3 size={15} color={theme.primaryLight} strokeWidth={2.2} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionBtnIcon,
                        {
                          backgroundColor: isDark
                            ? 'rgba(239, 68, 68, 0.12)'
                            : '#FEE2E2',
                          borderColor: isDark
                            ? 'rgba(239, 68, 68, 0.3)'
                            : '#FECACA',
                        },
                      ]}
                      onPress={() => handleDelete(med._id, med.drugName)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Delete Prescription"
                    >
                      <Trash2 size={15} color="#EF4444" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Instructions Callout */}
                {med.instructions ? (
                  <View
                    style={[
                      styles.instructionsBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(10, 16, 26, 0.7)'
                          : '#F8FAFC',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.instructionsText, { color: theme.textSecondary }]}>
                      📌 {med.instructions}
                    </Text>
                  </View>
                ) : null}

                {/* Course Period Tag */}
                <View style={styles.courseRow}>
                  <View
                    style={[
                      styles.courseTag,
                      {
                        backgroundColor: isDark
                          ? 'rgba(0, 123, 167, 0.15)'
                          : theme.primaryContainer,
                        borderColor: isDark
                          ? 'rgba(0, 123, 167, 0.3)'
                          : '#BAE6FD',
                      },
                    ]}
                  >
                    <Calendar size={12} color={theme.primaryLight} strokeWidth={2.2} />
                    <Text style={[styles.courseTagText, { color: theme.primaryLight }]}>
                      {(med.durationDays || 0) > 0
                        ? `${med.durationDays}-Day Course`
                        : 'Ongoing Regimen • Weekly Cycle'}
                    </Text>
                  </View>
                </View>

                {/* Daily Schedule Times */}
                <View
                  style={[
                    styles.timesContainer,
                    {
                      borderTopColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.timesLabel, { color: theme.textMuted }]}>
                    Daily Schedule:
                  </Text>
                  <View style={styles.timesRow}>
                    {times.map((t, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.timeTag,
                          {
                            backgroundColor: isDark
                              ? '#131B2A'
                              : '#F1F5F9',
                            borderColor: isDark
                              ? 'rgba(56, 189, 248, 0.25)'
                              : '#E2E8F0',
                          },
                        ]}
                      >
                        <Clock size={12} color={theme.primaryLight} strokeWidth={2.2} />
                        <Text style={[styles.timeTagText, { color: theme.textPrimary }]}>
                          {formatScheduleTime(t)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },

  /* ============================================================== */
  /* HERO CARD & TELEMETRY */
  /* ============================================================== */
  heroCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },
  heroTopProtocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  protocolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  protocolIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolLabel: {
    fontFamily: typography.bold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  safetyPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  safetyPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  safetyPillText: {
    fontFamily: typography.extraBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ecgContainer: {
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  greetingCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  greetingTextColumn: {
    flex: 1,
    paddingRight: 10,
  },
  welcomeTitle: {
    fontFamily: typography.extraBold,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  addRxPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addRxPillBtnText: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  targetIllustrationWrap: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  targetAmbientAura: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
  },

  /* 3 Metric Cards Row */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontFamily: typography.extraBold,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: typography.semiBold,
    fontSize: 10,
    fontWeight: '600',
  },

  /* ============================================================== */
  /* PRESCRIPTIONS SECTION HEADER */
  /* ============================================================== */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: typography.extraBold,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  sectionBadgeText: {
    fontFamily: typography.bold,
    fontSize: 10,
    fontWeight: '700',
  },

  /* ============================================================== */
  /* EMPTY STATE */
  /* ============================================================== */
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 28,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: typography.bold,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtext: {
    fontFamily: typography.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    fontFamily: typography.bold,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ============================================================== */
  /* PRESCRIPTION CARD (Matches Home Screen Prescription Cards) */
  /* ============================================================== */
  medCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardLeftStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4.5,
    zIndex: 2,
  },
  medCardContent: {
    padding: 16,
    paddingLeft: 20, // offset from left stripe
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconAndName: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleArea: {
    flex: 1,
  },
  drugName: {
    fontFamily: typography.bold,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyChip: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  qtyText: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  dosageText: {
    fontFamily: typography.medium,
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsBox: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  instructionsText: {
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  courseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  courseTagText: {
    fontFamily: typography.semiBold,
    fontSize: 11,
    fontWeight: '600',
  },
  timesContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  timesLabel: {
    fontFamily: typography.semiBold,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeTagText: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
});
