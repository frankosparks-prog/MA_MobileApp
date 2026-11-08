import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, AlertCircle, Pill, Check, Droplets } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import hapticService from '../services/hapticService';
import soundService from '../services/soundService';
import { EscalationLevel, Medication, Quote } from '../types';

interface ReminderOverlayModalProps {
  visible: boolean;
  level: EscalationLevel; // 1, 2, or 3
  medication: Medication | null;
  quote: Quote | null;
  streak: number;
  onConfirm: () => Promise<void> | void;
  onDismiss: () => void;
}

export const ReminderOverlayModal: React.FC<ReminderOverlayModalProps> = ({
  visible,
  level = 1,
  medication,
  quote,
  streak,
  onConfirm,
  onDismiss,
}) => {
  const { theme, isDark } = useTheme();
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowCelebration(false);
      setIsSubmitting(false);
      // Trigger appropriate clinical sound & haptic for this escalation stage
      if (level === 1) {
        soundService.playChime();
        hapticService.triggerHeartbeat();
      } else if (level === 2) {
        soundService.playPianoChord();
        hapticService.triggerPulse();
      } else if (level === 3) {
        soundService.playHeartbeat();
        hapticService.triggerUrgent();
      }
    }
  }, [visible, level]);

  const handleConfirmWithCelebration = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowCelebration(true);
    soundService.playWaterSplash();
    hapticService.triggerNourishSuccess();
    try {
      await onConfirm();
    } finally {
      setTimeout(() => {
        setShowCelebration(false);
        setIsSubmitting(false);
      }, 1000);
    }
  };

  if (!visible || !medication) return null;

  // Clinical Stage configurations
  let stageTitle = 'Medication Due';
  let stageSubtitle = 'Time for your scheduled dose.';
  let stageThemeColor = isDark ? '#38BDF8' : '#0284C7';
  let badgeBg = isDark ? 'rgba(56, 189, 248, 0.16)' : '#E0F2FE';
  let badgeBorder = isDark ? 'rgba(56, 189, 248, 0.35)' : '#BAE6FD';
  let auraColor = isDark ? 'rgba(0, 123, 167, 0.35)' : 'rgba(186, 230, 253, 0.6)';

  if (level === 2) {
    stageTitle = 'Second Reminder';
    stageSubtitle = 'Please verify your dose to maintain your adherence streak.';
    stageThemeColor = '#F59E0B';
    badgeBg = isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7';
    badgeBorder = isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A';
    auraColor = isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(254, 243, 199, 0.6)';
  } else if (level === 3) {
    stageTitle = 'Urgent Notice';
    stageSubtitle = 'Tap below to confirm intake before caregiver escalation triggers.';
    stageThemeColor = '#EF4444';
    badgeBg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2';
    badgeBorder = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
    auraColor = isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(254, 226, 226, 0.6)';
  }

  const defaultQuoteText =
    streak >= 7
      ? 'One whole week without missing a beat! Your consistency is healing your body.'
      : 'Every dose taken on time actively nourishes your botanical sanctuary.';

  const displayQuote = quote?.text || defaultQuoteText;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {/* Glassmorphic Rounded Sanctuary Dialog */}
        <View
          style={[
            styles.glassCard,
            {
              backgroundColor: isDark ? '#0C1322' : '#FFFFFF',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#E2E8F0',
              shadowColor: isDark ? '#000000' : '#007BA7',
            },
          ]}
        >
          {/* Top Dismiss Button */}
          <TouchableOpacity
            style={[
              styles.closeBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
              },
            ]}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <X size={16} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* 1. Motivational Praise & Streak Banner */}
          <View
            style={[
              styles.quoteBox,
              {
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.28)' : '#FDE68A',
              },
            ]}
          >
            <View style={styles.quoteIconBadge}>
              <Sparkles size={14} color="#F59E0B" />
            </View>
            <Text
              style={[
                styles.quoteText,
                { color: isDark ? '#FDE68A' : '#92400E' },
              ]}
            >
              "{displayQuote}"
            </Text>
          </View>

          {/* 2. Stage Row: Escalation Level Badge & Stage Title */}
          <View style={styles.stageRow}>
            <View
              style={[
                styles.levelBadge,
                {
                  backgroundColor: badgeBg,
                  borderColor: badgeBorder,
                },
              ]}
            >
              <Text style={[styles.levelBadgeText, { color: stageThemeColor }]}>
                Reminder {level} of 3
              </Text>
            </View>

            <Text style={[styles.stageTitleText, { color: theme.textPrimary }]}>
              {stageTitle}
            </Text>
          </View>

          {/* 3. Centerpiece: Animated Medical Cardiac Pulse with Ambient Halo */}
          <View style={styles.buddyContainer}>
            <View style={[styles.buddyAura, { backgroundColor: auraColor }]} />
            <LottieView
              source={require('../../assets/animations/heartbeat_pulse.json')}
              autoPlay
              loop
              style={styles.lottiePulse}
            />
          </View>

          {/* 4. Medication Clinical Details Spotlight Card */}
          <View
            style={[
              styles.medCard,
              {
                backgroundColor: isDark ? '#141D2E' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
              },
            ]}
          >
            {/* Drug Name */}
            <Text style={[styles.medNameText, { color: theme.textPrimary }]}>
              {medication.drugName}
            </Text>

            {/* Badges: Quantity & Dosage */}
            <View style={styles.medSubRow}>
              <View
                style={[
                  styles.qtyBadge,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
                  },
                ]}
              >
                <Text style={styles.qtyText}>
                  {medication.quantity || '1 pill'}
                </Text>
              </View>

              <View
                style={[
                  styles.dosageBadge,
                  {
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : '#E0F2FE',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.28)' : '#BAE6FD',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dosageText,
                    { color: isDark ? '#38BDF8' : '#0284C7' },
                  ]}
                >
                  ({medication.dosage || '001'})
                </Text>
              </View>
            </View>

            {/* Instruction / Stage Subtitle */}
            <Text style={[styles.subtitleText, { color: theme.textSecondary }]}>
              {stageSubtitle}
            </Text>
          </View>

          {/* Level 2 Daily Goal Progress Bar */}
          {level === 2 && (
            <View
              style={[
                styles.goalBox,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.goalHeader}>
                <Text style={[styles.goalLabel, { color: theme.textSecondary }]}>
                  Streak Milestone Goal
                </Text>
                <Text style={[styles.goalValue, { color: theme.bloomGold }]}>
                  {streak}/21 Days
                </Text>
              </View>
              <View
                style={[
                  styles.goalTrack,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' },
                ]}
              >
                <View
                  style={[
                    styles.goalFill,
                    {
                      width: `${Math.min((streak / 21) * 100, 100)}%`,
                      backgroundColor: theme.bloomGold,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Level 3 Warning Notice */}
          {level === 3 && (
            <View
              style={[
                styles.urgentNotice,
                {
                  backgroundColor: theme.alertContainer,
                  borderColor: theme.alertBorder,
                },
              ]}
            >
              <AlertCircle size={15} color={theme.alert} />
              <Text style={[styles.urgentNoticeText, { color: theme.alert }]}>
                Final in-app reminder before your circle of care is notified via SMS.
              </Text>
            </View>
          )}

          {/* 5. Tactile Confirmation Action Button */}
          <TouchableOpacity
            style={styles.confirmActionBtn}
            onPress={handleConfirmWithCelebration}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#0284C7', '#007BA7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmActionGradient}
            >
              <Check size={19} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.confirmActionBtnText}>
                {isSubmitting ? 'Confirming...' : 'Confirm Dose Taken'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Lottie Confetti Celebration Overlay */}
          {showCelebration && (
            <View style={styles.celebrationOverlay} pointerEvents="none">
              <LottieView
                source={require('../../assets/animations/confetti.json')}
                autoPlay
                loop={false}
                style={styles.confetti}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
    elevation: 12,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    marginRight: 28,
  },
  quoteIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: {
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontFamily: typography.extraBold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stageTitleText: {
    fontFamily: typography.bold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  buddyContainer: {
    width: 135,
    height: 135,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  buddyAura: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 62.5,
  },
  lottiePulse: {
    width: 130,
    height: 130,
  },
  medCard: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 10,
  },
  medNameText: {
    fontFamily: typography.extraBold,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  medSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  qtyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  qtyText: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  dosageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  dosageText: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  subtitleText: {
    fontFamily: typography.medium,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  goalBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginVertical: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalLabel: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  goalValue: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  goalTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 3,
  },
  urgentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginVertical: 8,
  },
  urgentNoticeText: {
    fontFamily: typography.medium,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    flexShrink: 1,
  },
  confirmActionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmActionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmActionBtnText: {
    fontFamily: typography.extraBold,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    width: 320,
    height: 320,
  },
});
