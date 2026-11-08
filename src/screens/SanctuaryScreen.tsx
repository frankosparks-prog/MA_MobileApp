import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShieldCheck,
  Activity,
  Flame,
  Clock,
  Bell,
  Flower2,
  Plus,
  CheckCircle2,
  Check,
  Info,
  Pill,
  ClipboardCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Repeat,
  Heart,
  Droplets,
  Calendar,
  X,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { User, Medication, AdherenceLog, GamificationProfile } from '../types';
import { SuccessfulTargetIllustration } from '../components/SuccessfulTargetIllustration';
import { HospitalPulseEcg } from '../components/HospitalPulseEcg';
import { PlantIllustration } from '../components/PlantIllustration';
import { GardenView } from '../components/GardenView';
import { typography } from '../theme/typography';
import { medicationApi, adherenceApi, gamificationApi } from '../api';
import hapticService from '../services/hapticService';

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
  const { theme, isDark } = useTheme();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<AdherenceLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllTaken, setShowAllTaken] = useState(false);
  const [selectedMedForInfo, setSelectedMedForInfo] = useState<Medication | null>(null);
  const autoAlertedLogsRef = useRef<Set<string>>(new Set());

  // 1. Data Fetching
  const fetchData = async () => {
    try {
      // Profile
      const profileRes = await gamificationApi.getProfile(user._id);
      if (profileRes.data?.profile) {
        setProfile(profileRes.data.profile);
      }

      // Medications
      const medsRes = await medicationApi.list(user._id);
      const fetchedMeds = medsRes.data?.medications || [];
      if (fetchedMeds.length > 0) {
        setMedications(fetchedMeds);
      }

      // Logs
      const logsRes = await adherenceApi.getLogs(user._id);
      if (logsRes.data?.logs) {
        const fetchedLogs = logsRes.data.logs;
        setLogs(fetchedLogs);

        // Auto reminder escalation check
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

  useEffect(() => {
    fetchData();
  }, [user._id, dataVersion]);

  // Periodic polling every 15s to update real-time status
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

  // 2. Computed Doses & Logs
  const dueLogs = useMemo(() => {
    return logs.filter((l) => l.status !== 'Taken');
  }, [logs]);

  const takenLogs = useMemo(() => {
    return logs
      .filter((l) => l.status === 'Taken')
      .sort((a, b) => {
        const timeA = a.takenTime || a.scheduledTime || '';
        const timeB = b.takenTime || b.scheduledTime || '';
        return timeB.localeCompare(timeA);
      });
  }, [logs]);

  // User requirement: ONLY log the previous 3 instead of everything
  const displayedTakenLogs = showAllTaken ? takenLogs : takenLogs.slice(0, 3);

  // Cardiac pulse animation for SAFETY NET ARMED indicator
  const safetyNetPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(safetyNetPulseAnim, {
          toValue: 1.35,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(safetyNetPulseAnim, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(safetyNetPulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(safetyNetPulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [safetyNetPulseAnim]);

  // Robust parser for scheduled time strings (ISO timestamps, Date strings, or HH:mm)
  const parseScheduledDate = (timeStr?: string): Date => {
    if (!timeStr) return new Date();

    // Check if it's an ISO or date-time string (e.g. "2026-11-08T20:23:00.000Z")
    if (timeStr.includes('T') || (timeStr.includes('-') && timeStr.length > 8)) {
      const parsed = new Date(timeStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Clean any time string like "20:23", "08:00", "8:00 AM", "10:23 PM"
    const now = new Date();
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const clean = timeStr.replace(/[^0-9:]/g, '');
    const parts = clean.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10) || 0;
      if (!isNaN(hours)) {
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        const sched = new Date(now);
        sched.setHours(hours, minutes, 0, 0);
        return sched;
      }
    }

    return now;
  };

  // Time formatter
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '08:00 AM';

    // If it's an ISO string or contains a date component:
    if (timeStr.includes('T') || (timeStr.includes('-') && timeStr.length > 8)) {
      const parsed = new Date(timeStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      }
    }

    // If it's a simple HH:mm string:
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const clean = timeStr.replace(/[^0-9:]/g, '');
    const parts = clean.split(':');
    if (parts.length >= 2) {
      let hour = parseInt(parts[0], 10);
      const minute = parts[1].slice(0, 2).padStart(2, '0');
      if (!isNaN(hour)) {
        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hr12 = hour % 12 || 12;
        return `${hr12}:${minute} ${ampm}`;
      }
    }

    return timeStr;
  };

  // Calculate relative overdue or due string with accurate boundary handling
  const getRelativeDueInfo = (scheduledTimeStr?: string) => {
    if (!scheduledTimeStr) return { text: 'Due Now', isOverdue: true };

    const sched = parseScheduledDate(scheduledTimeStr);
    const now = new Date();
    const diffMs = now.getTime() - sched.getTime();
    const diffMins = Math.round(diffMs / 60000);

    // If within 5 minutes of scheduled time, treat as "Due Now"
    if (Math.abs(diffMins) <= 5) {
      return { text: 'Due Now', isOverdue: true };
    }

    if (diffMins > 5) {
      if (diffMins >= 1440) {
        const days = Math.floor(diffMins / 1440);
        return { text: `Overdue by ${days}d`, isOverdue: true };
      }
      if (diffMins >= 60) {
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return { text: `Overdue by ${hrs}h ${mins > 0 ? `${mins}m` : ''}`, isOverdue: true };
      }
      return { text: `Overdue by ${diffMins} min`, isOverdue: true };
    } else {
      const waitMins = Math.abs(diffMins);
      if (waitMins >= 1440) {
        const days = Math.floor(waitMins / 1440);
        return { text: `In ${days}d`, isOverdue: false };
      }
      if (waitMins >= 60) {
        const hrs = Math.floor(waitMins / 60);
        const mins = waitMins % 60;
        return { text: `In ${hrs}h ${mins > 0 ? `${mins}m` : ''}`, isOverdue: false };
      }
      return { text: `In ${waitMins}m`, isOverdue: false };
    }
  };

  // Next Dose Info for Garden Pill
  const nextDosePillInfo = useMemo(() => {
    if (dueLogs.length === 0) {
      return { label: 'Sanctuary in Bloom', isDue: false };
    }
    const firstDue = dueLogs[0];
    const med =
      typeof firstDue.medId === 'object'
        ? (firstDue.medId as Medication)
        : medications.find((m) => m._id === firstDue.medId);

    const medName = med?.drugName || 'Next Dose';
    const rel = getRelativeDueInfo(firstDue.scheduledTime);
    return {
      label: rel.isOverdue ? `${medName} • Due Now` : `${medName} in ${rel.text.replace('In ', '')}`,
      isDue: true,
    };
  }, [dueLogs, medications]);

  const handleTakeDose = (log: AdherenceLog) => {
    hapticService.selection();
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

  const handleInfoPress = (med?: Medication | null) => {
    hapticService.selection();
    if (!med) return;
    setSelectedMedForInfo(med);
  };

  // Sanctuary Garden metrics
  const activeMed = medications[0];
  const courseDays = activeMed?.durationDays || 7;
  const currentCourseDay = Math.min(courseDays, (profile?.currentStreak || 5) % courseDays || 5);
  const adherencePercent = profile?.growthPercentage || 79;
  const dosesRemaining = Math.max(1, courseDays - currentCourseDay);

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
        {/* ========================================================================= */}
        {/* 1. TOP SANCTUARY HERO COMMAND CARD WITH SUCCESSFUL TARGET SVG ANIMATION    */}
        {/* ========================================================================= */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? theme.bgCard : '#FFFFFF',
              borderColor: isDark ? 'rgba(0, 123, 167, 0.35)' : '#E2E8F0',
              shadowColor: isDark ? '#000000' : 'rgba(0, 123, 167, 0.16)',
            },
          ]}
        >
          {/* Top Sanctuary & Safety Net Pill Row */}
          <View style={styles.heroTopHeaderRow}>
            <View style={styles.brandBadgeGroup}>
              <View
                style={[
                  styles.brandShieldCircle,
                  {
                    backgroundColor: isDark ? 'rgba(0, 123, 167, 0.2)' : '#E0F2FE',
                  },
                ]}
              >
                <ShieldCheck size={16} color={theme.primaryLight} strokeWidth={2.4} />
              </View>
              <Text style={[styles.brandBadgeTitle, { color: isDark ? theme.primaryLight : '#0369A1' }]}>
                MediAlert Sanctuary
              </Text>
            </View>

            {/* Armed Safety Net Pill with Synchronized Cardiac Heartbeat Pulse */}
            <View
              style={[
                styles.safetyNetPill,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.safetyNetPulsingDot,
                  { transform: [{ scale: safetyNetPulseAnim }] },
                ]}
              />
              <Text style={styles.safetyNetPillText}>SAFETY NET ARMED</Text>
            </View>
          </View>

          {/* Patient Vital Signs Monitor Telemetry Strip */}
          <View style={styles.ecgContainer}>
            <HospitalPulseEcg isDark={isDark} height={32} bpm={74} showTelemetryHUD={true} />
          </View>

          {/* Greeting Typography & Animated Successful Target SVG Centerpiece */}
          <View style={styles.greetingCenterRow}>
            <View style={styles.greetingTextColumn}>
              <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>
                Welcome back, {user.username || 'Alex'}
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Continuous adherence protection is synced with clinic.
              </Text>
            </View>

            {/* Animated Target Graphic with Ambient Aura */}
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
              <SuccessfulTargetIllustration size={102} />
            </View>
          </View>

          {/* 3 Metric Quick Badges Row (Streak, Due Today, Bloomed) */}
          <View style={styles.metricsRow}>
            {/* 1. Streak */}
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: isDark ? '#101E2E' : '#F0F9FF',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : '#E0F2FE',
                },
              ]}
            >
              <View style={[styles.metricIconCircle, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#E0F2FE' }]}>
                <Flame size={18} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.3} />
              </View>
              <Text style={[styles.metricValue, { color: isDark ? '#38BDF8' : '#0369A1' }]}>
                {profile?.currentStreak || 14}d
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Streak</Text>
            </View>

            {/* 2. Due Today (Vibrant Alert Highlight) */}
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: isDark ? '#2A1318' : '#FEF2F2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FEE2E2',
                },
              ]}
            >
              <View style={[styles.metricIconCircle, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2' }]}>
                <Bell size={18} color={theme.alert} strokeWidth={2.3} />
              </View>
              <Text style={[styles.metricValue, { color: theme.alert }]}>
                {dueLogs.length}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.alert, fontWeight: '700' }]}>
                Due Today
              </Text>
            </View>

            {/* 3. Bloomed */}
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: isDark ? '#10262C' : '#F0FDF4',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.22)' : '#DCFCE7',
                },
              ]}
            >
              <View style={[styles.metricIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7' }]}>
                <Flower2 size={18} color={isDark ? '#34D399' : '#059669'} strokeWidth={2.3} />
              </View>
              <Text style={[styles.metricValue, { color: isDark ? '#34D399' : '#047857' }]}>
                {profile?.treesGrown || 3}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Bloomed</Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 2. LIVING VIGOR GARDEN BOTANICAL SANCTUARY CARD                           */}
        {/* ========================================================================= */}
        <View
          style={[
            styles.gardenCard,
            {
              backgroundColor: isDark ? theme.bgCard : '#FFFFFF',
              borderColor: isDark ? 'rgba(0, 123, 167, 0.28)' : '#E2E8F0',
              shadowColor: isDark ? '#000000' : 'rgba(0, 123, 167, 0.14)',
            },
          ]}
        >
          {/* Card Title Row & Next Dose Capsule */}
          <View style={styles.gardenHeaderRow}>
            <View style={styles.gardenTitleGroup}>
              <Flower2 size={20} color={theme.primaryLight} strokeWidth={2.4} />
              <Text style={[styles.gardenTitleText, { color: theme.textPrimary }]}>
                Living Vigor Garden
              </Text>
            </View>

            {/* Countdown / Dose Status Pill */}
            <View
              style={[
                styles.nextDosePill,
                nextDosePillInfo.isDue
                  ? {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
                    }
                  : {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
                    },
              ]}
            >
              {nextDosePillInfo.isDue ? (
                <Clock size={12} color={theme.alert} strokeWidth={2.3} />
              ) : (
                <Sparkles size={12} color={theme.emerald} strokeWidth={2.3} />
              )}
              <Text
                style={[
                  styles.nextDosePillText,
                  { color: nextDosePillInfo.isDue ? theme.alert : theme.emerald },
                ]}
              >
                {nextDosePillInfo.label}
              </Text>
            </View>
          </View>

          {/* Plant Visual Center with Animated Botanical Plant & Ambient Backdrop */}
          <View style={styles.plantVisualWrap}>
            <View
              style={[
                styles.plantGlowHalo,
                {
                  backgroundColor: isDark
                    ? 'rgba(0, 123, 167, 0.18)'
                    : 'rgba(186, 230, 253, 0.65)',
                },
              ]}
            />
            <PlantIllustration size={165} progress={adherencePercent} />

            {/* Course Stage Label */}
            <Text style={[styles.plantCourseLabel, { color: theme.textSecondary }]}>
              Lotus of Resiliency • Day {currentCourseDay} of {courseDays}
            </Text>
          </View>

          {/* Flowering Stage & Adherence Progress Bar Container */}
          <View
            style={[
              styles.progressContainerCard,
              {
                backgroundColor: isDark ? '#0D1422' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
              },
            ]}
          >
            {/* Stage Title & Adherence Percentage */}
            <View style={styles.progressTextRow}>
              <Text style={[styles.progressStageName, { color: theme.textPrimary }]}>
                {profile?.plantStage || 'Flowering'} Stage
              </Text>
              <Text style={[styles.progressAdherenceVal, { color: theme.primaryLight }]}>
                {adherencePercent}% Adherence
              </Text>
            </View>

            {/* Visual Gradient Progress Bar */}
            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: isDark ? '#1B2638' : '#E2E8F0' },
              ]}
            >
              <LinearGradient
                colors={['#38BDF8', '#007BA7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(Math.max(adherencePercent, 12), 100)}%` },
                ]}
              />
            </View>

            {/* Course & Blossom Countdown Details Row */}
            <View style={styles.progressBottomDetailRow}>
              <Text style={[styles.courseDetailText, { color: theme.textSecondary }]}>
                Course: {courseDays}-Day {activeMed?.drugName || 'Regimen'}
              </Text>
              <Text style={[styles.dosesRemainingText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                {dosesRemaining} doses to full blossom
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 3. TODAY'S PRESCRIPTIONS SECTION HEADER                                   */}
        {/* ========================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <ClipboardCheck size={21} color={theme.primaryLight} strokeWidth={2.4} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Today's Prescriptions
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addRxPillBtn, { backgroundColor: isDark ? 'rgba(0, 123, 167, 0.2)' : '#E0F2FE' }]}
            onPress={onOpenAddMedication}
            activeOpacity={0.7}
          >
            <Plus size={15} color={theme.primaryLight} strokeWidth={2.5} />
            <Text style={[styles.addRxPillBtnText, { color: theme.primaryLight }]}>Add Rx</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* 4. ACTIVE DUE PRESCRIPTION CARDS                                          */}
        {/* ========================================================================= */}
        {dueLogs.length === 0 ? (
          <View
            style={[
              styles.allTakenCard,
              {
                backgroundColor: isDark ? theme.bgCard : '#FFFFFF',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0',
              },
            ]}
          >
            <CheckCircle2 size={32} color={theme.emerald} />
            <Text style={[styles.allTakenTitle, { color: theme.textPrimary }]}>
              All Scheduled Doses Complete
            </Text>
            <Text style={[styles.allTakenSubtext, { color: theme.textSecondary }]}>
              Your clinical adherence protocol is on track today. The botanical sanctuary is fully nourished!
            </Text>
          </View>
        ) : (
          dueLogs.map((log) => {
            const med =
              typeof log.medId === 'object'
                ? (log.medId as Medication)
                : medications.find((m) => m._id === log.medId);

            const rel = getRelativeDueInfo(log.scheduledTime);
            const drugName = med?.drugName || 'Prescription Dose';
            const dosage = med?.dosage || 'Standard Dosage';
            const quantity = med?.quantity || '1 Dose';
            const instructions = med?.instructions || 'With Full Glass of Water';

            return (
              <View
                key={log._id}
                style={[
                  styles.duePrescriptionCard,
                  {
                    backgroundColor: isDark ? theme.bgCard : '#FFFFFF',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
                    shadowColor: isDark ? '#000000' : 'rgba(239, 68, 68, 0.14)',
                  },
                ]}
              >
                {/* Red Left Edge Accent Stripe */}
                <View style={styles.cardLeftRedStripe} />

                <View style={styles.dueCardContent}>
                  {/* Top Header Row with Pill Icon, Drug Name & DUE NOW Badge */}
                  <View style={styles.dueCardTopRow}>
                    <View style={styles.dueCardMainInfo}>
                      {/* Pill Icon Circle */}
                      <View
                        style={[
                          styles.duePillCircle,
                          {
                            backgroundColor: isDark ? 'rgba(0, 123, 167, 0.2)' : '#E0F2FE',
                          },
                        ]}
                      >
                        <Pill size={20} color={theme.primaryLight} strokeWidth={2.4} />
                      </View>

                      {/* Drug Name & Due Now Badge */}
                      <View style={styles.drugTitleCol}>
                        <View style={styles.drugTitleRow}>
                          <Text style={[styles.drugNameText, { color: theme.textPrimary }]}>
                            {drugName}
                          </Text>
                          <View style={styles.dueNowBadge}>
                            <Text style={styles.dueNowBadgeText}>
                              {rel.isOverdue ? 'DUE NOW' : 'PENDING'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.dosageInstructionText, { color: theme.textSecondary }]}>
                          {dosage} • {quantity} • {instructions}
                        </Text>
                      </View>
                    </View>

                    {/* Alarm Icon Slot */}
                    <TouchableOpacity
                      style={[
                        styles.bellIconBtn,
                        { backgroundColor: isDark ? 'rgba(0, 123, 167, 0.15)' : '#E0F2FE' },
                      ]}
                      onPress={() => handleTakeDose(log)}
                    >
                      <Bell size={16} color={theme.primaryLight} strokeWidth={2.3} />
                    </TouchableOpacity>
                  </View>

                  {/* Scheduled Alert Banner Container */}
                  <View
                    style={[
                      styles.scheduledBanner,
                      {
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                        borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2',
                      },
                    ]}
                  >
                    <Clock size={14} color={theme.alert} strokeWidth={2.4} />
                    <Text style={styles.scheduledBannerText}>
                      Scheduled:{' '}
                      <Text style={{ fontWeight: '800', color: theme.alert }}>
                        {formatTime(log.scheduledTime)}
                      </Text>{' '}
                      ({rel.text})
                    </Text>
                  </View>

                  {/* Action Buttons Row: Primary 'Confirm Ingestion' + Secondary 'Info (i)' */}
                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      style={styles.confirmIngestionBtn}
                      onPress={() => handleTakeDose(log)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#0284C7', '#007BA7']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.confirmIngestionGradient}
                      >
                        <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.4} />
                        <Text style={styles.confirmIngestionBtnText}>Confirm Ingestion</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Clinical Details Info Button */}
                    <TouchableOpacity
                      style={[
                        styles.infoCircleBtn,
                        {
                          backgroundColor: isDark ? '#141E2F' : '#F1F5F9',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => handleInfoPress(med)}
                      accessibilityLabel="Medication Details"
                    >
                      <Info size={18} color={theme.textSecondary} strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* ========================================================================= */}
        {/* 5. ALREADY TAKEN PRESCRIPTIONS (MAX 3 LOGS AS SPECIFIED)                  */}
        {/* ========================================================================= */}
        {takenLogs.length > 0 && (
          <View style={styles.takenSectionWrap}>
            <View style={styles.takenSectionHeaderRow}>
              <Text style={[styles.takenSectionHeading, { color: theme.textSecondary }]}>
                Recently Logged ({displayedTakenLogs.length} of {takenLogs.length})
              </Text>
              {takenLogs.length > 3 && (
                <TouchableOpacity
                  onPress={() => {
                    hapticService.selection();
                    setShowAllTaken(!showAllTaken);
                  }}
                  style={styles.toggleTakenBtn}
                >
                  <Text style={[styles.toggleTakenBtnText, { color: theme.primaryLight }]}>
                    {showAllTaken ? 'Show Previous 3' : `+${takenLogs.length - 3} More`}
                  </Text>
                  {showAllTaken ? (
                    <ChevronUp size={14} color={theme.primaryLight} />
                  ) : (
                    <ChevronDown size={14} color={theme.primaryLight} />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {displayedTakenLogs.map((log) => {
              const med =
                typeof log.medId === 'object'
                  ? (log.medId as Medication)
                  : medications.find((m) => m._id === log.medId);

              const drugName = med?.drugName || 'Prescription Intake';
              const dosage = med?.dosage || '';
              const timeDisplay = formatTime(log.takenTime || log.scheduledTime);

              return (
                <View
                  key={log._id}
                  style={[
                    styles.takenCardItem,
                    {
                      backgroundColor: isDark ? theme.bgCard : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    },
                  ]}
                >
                  {/* Left Check Circle */}
                  <View
                    style={[
                      styles.takenCheckCircle,
                      {
                        backgroundColor: isDark ? 'rgba(0, 123, 167, 0.18)' : '#E0F2FE',
                      },
                    ]}
                  >
                    <Check size={16} color={theme.primaryLight} strokeWidth={2.6} />
                  </View>

                  {/* Name, Dosage & Verification Details */}
                  <View style={styles.takenTextColumn}>
                    <Text style={[styles.takenDrugNameText, { color: theme.textPrimary }]}>
                      {drugName} <Text style={styles.takenDosageText}>{dosage}</Text>
                    </Text>
                    <Text style={[styles.takenDetailText, { color: theme.textMuted }]}>
                      Taken at {timeDisplay} • Verified by Self
                    </Text>
                  </View>

                  {/* Logged Badge Pill */}
                  <View
                    style={[
                      styles.loggedBadgePill,
                      {
                        backgroundColor: isDark ? 'rgba(0, 123, 167, 0.16)' : '#E0F2FE',
                      },
                    ]}
                  >
                    <Check size={12} color={theme.primaryLight} strokeWidth={2.4} />
                    <Text style={[styles.loggedBadgeText, { color: theme.primaryLight }]}>
                      Logged
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* 6. CLINICAL MEDICATION INFO MODAL DIALOG                                  */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedMedForInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMedForInfo(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.infoModalCard,
              {
                backgroundColor: isDark ? '#0D1424' : '#FFFFFF',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.28)' : '#E2E8F0',
                shadowColor: isDark ? '#000000' : '#007BA7',
              },
            ]}
          >
            {/* Header: Drug Name, Dosage Badge & Close Button */}
            <View style={styles.infoModalHeader}>
              <View
                style={[
                  styles.infoModalIconCircle,
                  {
                    backgroundColor: isDark ? 'rgba(0, 123, 167, 0.25)' : '#E0F2FE',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD',
                  },
                ]}
              >
                <Pill size={22} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.4} />
              </View>

              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.infoModalTitle, { color: theme.textPrimary }]}>
                  {selectedMedForInfo?.drugName}
                </Text>
                <View style={styles.infoModalBadgeRow}>
                  <View
                    style={[
                      styles.infoPillBadge,
                      {
                        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE',
                        borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.infoPillBadgeText,
                        { color: isDark ? '#38BDF8' : '#0284C7' },
                      ]}
                    >
                      {selectedMedForInfo?.dosage || '001'} • {selectedMedForInfo?.quantity || '1 pill'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.modalCloseIconBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  },
                ]}
                onPress={() => setSelectedMedForInfo(null)}
              >
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Structured Clinical Sections */}
            <View style={styles.infoModalBody}>
              {/* 1. Instructions */}
              <View
                style={[
                  styles.infoSectionCard,
                  {
                    backgroundColor: isDark ? '#141D2E' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.infoSectionTop}>
                  <ClipboardCheck size={14} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.4} />
                  <Text style={[styles.infoSectionLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Instructions:
                  </Text>
                </View>
                <Text style={[styles.infoSectionValue, { color: theme.textPrimary }]}>
                  {selectedMedForInfo?.instructions || 'Take with water after meals'}
                </Text>
              </View>

              {/* 2. Daily Schedule */}
              <View
                style={[
                  styles.infoSectionCard,
                  {
                    backgroundColor: isDark ? '#141D2E' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.infoSectionTop}>
                  <Clock size={14} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.4} />
                  <Text style={[styles.infoSectionLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Daily Schedule:
                  </Text>
                </View>
                <Text style={[styles.infoSectionValue, { color: isDark ? '#38BDF8' : '#0369A1' }]}>
                  {selectedMedForInfo?.scheduleInterval || '08:00,20:23'}
                </Text>
              </View>

              {/* 3. Regimen Course */}
              <View
                style={[
                  styles.infoSectionCard,
                  {
                    backgroundColor: isDark ? '#141D2E' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.infoSectionTop}>
                  <Calendar size={14} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.4} />
                  <Text style={[styles.infoSectionLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Regimen Course:
                  </Text>
                </View>
                <Text style={[styles.infoSectionValue, { color: theme.textPrimary }]}>
                  {selectedMedForInfo?.durationDays
                    ? `${selectedMedForInfo.durationDays} Days Duration`
                    : 'Ongoing Regimen'}
                </Text>
              </View>

              {/* 4. Safety Net */}
              <View
                style={[
                  styles.infoSectionCard,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0',
                  },
                ]}
              >
                <View style={styles.infoSectionTop}>
                  <ShieldCheck size={14} color="#10B981" strokeWidth={2.4} />
                  <Text style={[styles.infoSectionLabel, { color: isDark ? '#34D399' : '#047857' }]}>
                    Safety Net:
                  </Text>
                </View>
                <Text style={[styles.infoSectionValue, { color: isDark ? '#34D399' : '#059669' }]}>
                  Active • 3-Tier Alert & Caregiver SMS
                </Text>
              </View>
            </View>

            {/* Acknowledge Action Button */}
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setSelectedMedForInfo(null)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#0284C7', '#007BA7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeModalBtnGradient}
              >
                <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.closeModalBtnText}>Acknowledge Details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 115, // Clearance for curved bottom nav bar
  },

  /* Hero Command Card */
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  heroTopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandShieldCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeTitle: {
    fontFamily: typography.extraBold,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  safetyNetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  safetyNetPulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  safetyNetPillText: {
    fontFamily: typography.extraBold,
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
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
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  targetIllustrationWrap: {
    width: 102,
    height: 102,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  targetAmbientAura: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  /* 3 Metric Badges Row */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
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
    marginBottom: 8,
  },
  metricValue: {
    fontFamily: typography.extraBold,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: typography.semiBold,
    fontSize: 11,
    fontWeight: '600',
  },

  /* Living Vigor Garden Card */
  gardenCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 22,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  gardenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gardenTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gardenTitleText: {
    fontFamily: typography.bold,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  nextDosePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  nextDosePillText: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  plantVisualWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  plantGlowHalo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  plantCourseLabel: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 12,
  },

  /* Progress Bar Container */
  progressContainerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStageName: {
    fontFamily: typography.bold,
    fontSize: 13,
    fontWeight: '700',
  },
  progressAdherenceVal: {
    fontFamily: typography.extraBold,
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBottomDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseDetailText: {
    fontFamily: typography.medium,
    fontSize: 11,
    fontWeight: '500',
  },
  dosesRemainingText: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
  },

  /* Prescriptions Section Header */
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
  addRxPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addRxPillBtnText: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Empty State */
  allTakenCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  allTakenTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  allTakenSubtext: {
    fontFamily: typography.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Due Prescription Card */
  duePrescriptionCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  cardLeftRedStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4.5,
    backgroundColor: '#DC2626',
    zIndex: 2,
  },
  dueCardContent: {
    padding: 16,
    paddingLeft: 20, // offset from left stripe
  },
  dueCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dueCardMainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  duePillCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drugTitleCol: {
    flex: 1,
  },
  drugTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  drugNameText: {
    fontFamily: typography.bold,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  dueNowBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  dueNowBadgeText: {
    fontFamily: typography.extraBold,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dosageInstructionText: {
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  bellIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  /* Scheduled Alert Banner */
  scheduledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  scheduledBannerText: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '500',
  },

  /* Action Buttons Row */
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  confirmIngestionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmIngestionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmIngestionBtnText: {
    fontFamily: typography.extraBold,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  infoCircleBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Already Taken Section */
  takenSectionWrap: {
    marginTop: 6,
    marginBottom: 20,
  },
  takenSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  takenSectionHeading: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleTakenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  toggleTakenBtnText: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  takenCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 9,
  },
  takenCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  takenTextColumn: {
    flex: 1,
  },
  takenDrugNameText: {
    fontFamily: typography.bold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  takenDosageText: {
    fontFamily: typography.regular,
    fontSize: 12,
    fontWeight: '400',
  },
  takenDetailText: {
    fontFamily: typography.medium,
    fontSize: 11,
    fontWeight: '500',
  },
  loggedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  loggedBadgeText: {
    fontFamily: typography.extraBold,
    fontSize: 11,
    fontWeight: '800',
  },

  /* Clinical Medication Info Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 26,
    borderWidth: 1.5,
    padding: 20,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  infoModalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalTitle: {
    fontFamily: typography.extraBold,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  infoModalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoPillBadgeText: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  modalCloseIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalBody: {
    gap: 9,
    marginBottom: 16,
  },
  infoSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoSectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoSectionLabel: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoSectionValue: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  closeModalBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  closeModalBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closeModalBtnText: {
    fontFamily: typography.extraBold,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
