import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Plus, Trash2, Clock, Pill, Edit3, AlertCircle, Calendar } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { Medication, User } from '../types';
import { medicationApi } from '../api';

interface MedicationsScreenProps {
  user: User;
  onOpenAddMedication: () => void;
  onEditMedication: (med: Medication) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  dataVersion?: number;
  onMedicationDeleted?: () => void;
}

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
    setRefreshing(true);
    await fetchMeds();
    setRefreshing(false);
  };

  const handleDelete = async (medId: string, name: string) => {
    try {
      await medicationApi.delete(medId);
      setMedications((prev) => prev.filter((m) => m._id !== medId));
      showToast('info', `Removed "${name}" from your active schedule.`);
      onMedicationDeleted?.();
    } catch (e: any) {
      showToast('error', `Failed to delete medication: ${e.message}`);
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
        {/* Cyber-Medical Hero Section */}
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
                styles.heroBadgeBox,
                {
                  backgroundColor: isDark ? '#111827' : theme.primaryContainer,
                  borderColor: theme.primaryLight,
                },
              ]}
            >
              <Pill size={24} color={theme.primaryLight} />
              <View style={[styles.heroRedDot, { backgroundColor: theme.alert }]} />
            </View>
            <View style={styles.heroTextCol}>
              <View style={styles.heroTagRow}>
                <Text style={[styles.heroTagText, { color: theme.primaryLight }]}>
                  PRESCRIPTION MATRIX
                </Text>
                <View
                  style={[
                    styles.heroActiveChip,
                    {
                      backgroundColor: theme.alertContainer,
                      borderColor: theme.alertBorder,
                    },
                  ]}
                >
                  <Text style={[styles.heroActiveChipText, { color: theme.alertLight }]}>
                    CLINICAL SCHEDULE
                  </Text>
                </View>
              </View>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                Medication Regimen
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Precision dosage timing, quantities & auto-escalation
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
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
                {medications.length}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                Active Rx
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
                {medications.reduce(
                  (acc, m) =>
                    acc + (m.scheduleInterval ? m.scheduleInterval.split(',').length : 1),
                  0
                )}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                Doses / Day
              </Text>
            </View>
            <View
              style={[
                styles.heroStatDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
              ]}
            />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: theme.alertLight }]}>
                Armed
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                Safety Guard
              </Text>
            </View>
          </View>

          {/* Action Row */}
          <TouchableOpacity
            style={[styles.heroAddBtn, { backgroundColor: theme.primary }]}
            onPress={onOpenAddMedication}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.heroAddBtnText}>Add New Prescription</Text>
          </TouchableOpacity>
        </View>

        {medications.length === 0 && (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.2)' : theme.border,
              },
            ]}
          >
            <AlertCircle
              size={32}
              color={theme.primaryLight}
              style={{ marginBottom: 10 }}
            />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              No Medications Configured
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Tap "Add New Prescription" to configure your dose times, strength, and quantity.
            </Text>
          </View>
        )}

        {medications.map((med) => {
          const times = med.scheduleInterval ? med.scheduleInterval.split(',') : ['08:00'];
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
              <View style={styles.cardTop}>
                <View style={styles.iconAndName}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: theme.primaryContainer,
                        borderColor: isDark ? 'rgba(0, 123, 167, 0.35)' : '#BAE6FD',
                      },
                    ]}
                  >
                    <Pill size={22} color={theme.primaryLight} />
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
                            backgroundColor: isDark ? '#192230' : theme.primaryContainer,
                            borderColor: isDark ? theme.primaryDark : '#BAE6FD',
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
                      styles.editBtn,
                      {
                        backgroundColor: theme.primaryContainer,
                        borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : '#BAE6FD',
                      },
                    ]}
                    onPress={() => onEditMedication(med)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Edit3 size={16} color={theme.primaryLight} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.deleteBtn,
                      {
                        backgroundColor: theme.alertContainer,
                        borderColor: theme.alertBorder,
                      },
                    ]}
                    onPress={() => handleDelete(med._id, med.drugName)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color={theme.alert} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Instructions */}
              {med.instructions ? (
                <Text
                  style={[
                    styles.instructionsText,
                    {
                      color: theme.textSecondary,
                      backgroundColor: isDark ? 'rgba(10, 14, 20, 0.6)' : '#F8FAFC',
                    },
                  ]}
                >
                  📌 {med.instructions}
                </Text>
              ) : null}

              {/* Course Period */}
              <View style={styles.courseRow}>
                <View
                  style={[
                    styles.courseTag,
                    {
                      backgroundColor: theme.primaryContainer,
                      borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : '#BAE6FD',
                    },
                  ]}
                >
                  <Calendar size={12} color={theme.primaryLight} />
                  <Text style={[styles.courseTagText, { color: theme.primaryLight }]}>
                    {(med.durationDays || 0) > 0
                      ? `${med.durationDays}-Day Course`
                      : 'Ongoing Weekly Bloom Cycle'}
                  </Text>
                </View>
              </View>

              {/* Daily Schedule Times */}
              <View
                style={[
                  styles.timesContainer,
                  {
                    borderTopColor: isDark ? '#1A2330' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={[styles.timesLabel, { color: theme.textMuted }]}>
                  Daily Dosage Times:
                </Text>
                <View style={styles.timesRow}>
                  {times.map((t, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.timeTag,
                        {
                          backgroundColor: isDark ? '#161F2E' : '#F1F5F9',
                          borderColor: isDark ? theme.primaryDark : '#E2E8F0',
                        },
                      ]}
                    >
                      <Clock size={12} color={theme.primaryLight} />
                      <Text style={[styles.timeTagText, { color: theme.textPrimary }]}>
                        {t.trim()}
                      </Text>
                    </View>
                  ))}
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
    padding: 20,
    paddingTop: 16,
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
  heroBadgeBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroRedDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroActiveChip: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  heroActiveChipText: {
    fontSize: 9,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginVertical: 14,
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
  },
  heroAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 28,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  medCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleArea: {
    flex: 1,
  },
  drugName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  qtyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dosageText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  instructionsText: {
    fontSize: 12,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  courseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  courseTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timesContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  timesLabel: {
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
    borderRadius: 6,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
