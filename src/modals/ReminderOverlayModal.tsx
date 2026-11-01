import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { X, Sparkles, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { NourishButton } from '../components/NourishButton';
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

  useEffect(() => {
    if (visible) {
      setShowCelebration(false);
      // Trigger appropriate sound & haptic for this stage
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
    setShowCelebration(true);
    soundService.playWaterSplash();
    hapticService.triggerNourishSuccess();
    try {
      await onConfirm();
    } finally {
      setTimeout(() => {
        setShowCelebration(false);
      }, 1000);
    }
  };

  if (!visible || !medication) return null;

  // Stage configurations
  let stageTitle = 'Medication Due';
  let stageSubtitle = 'Time for your scheduled dose.';
  let auraColor = 'rgba(0, 123, 167, 0.35)';

  if (level === 2) {
    stageTitle = 'Second Reminder';
    stageSubtitle = 'Please verify your dose to maintain your adherence streak.';
    auraColor = 'rgba(255, 179, 0, 0.35)';
  } else if (level === 3) {
    stageTitle = 'Urgent Notice';
    stageSubtitle = 'Tap below to confirm intake before caregiver escalation triggers.';
    auraColor = 'rgba(239, 68, 68, 0.45)';
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {/* Glassmorphic Overlay Card */}
        <View
          style={[
            styles.glassCard,
            {
              backgroundColor: isDark ? 'rgba(14, 20, 30, 0.96)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: auraColor,
            },
          ]}
        >
          {/* Dismiss button */}
          <TouchableOpacity
            style={[
              styles.closeBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
              },
            ]}
            onPress={onDismiss}
          >
            <X size={18} color={theme.textSubtle} />
          </TouchableOpacity>

          {/* Motivational Quote Banner */}
          {quote && (
            <View
              style={[
                styles.quoteBox,
                {
                  backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : '#FEF3C7',
                },
              ]}
            >
              <Sparkles size={14} color={theme.bloomGold} />
              <Text
                style={[
                  styles.quoteText,
                  { color: isDark ? '#FDE68A' : '#92400E' },
                ]}
              >
                "{quote.text}"
              </Text>
            </View>
          )}

          {/* Stage Banner */}
          <View style={styles.stageRow}>
            <View
              style={[
                styles.levelBadge,
                level === 2 && styles.levelBadge2,
                level === 3 && [styles.levelBadge3, { backgroundColor: theme.alertContainer }],
              ]}
            >
              <Text
                style={[
                  styles.levelBadgeText,
                  { color: level === 3 ? theme.alert : theme.textPrimary },
                ]}
              >
                Reminder {level} of 3
              </Text>
            </View>
            <Text style={[styles.stageTitleText, { color: theme.textPrimary }]}>
              {stageTitle}
            </Text>
          </View>

          {/* Centerpiece: Animated Lottie Medical Pulse Capsule */}
          <View style={styles.buddyContainer}>
            <View style={[styles.buddyAura, { backgroundColor: auraColor }]} />
            <LottieView
              source={require('../../assets/animations/heartbeat_pulse.json')}
              autoPlay
              loop
              style={styles.lottiePulse}
            />
          </View>

          {/* Medication & Quantity Details */}
          <View style={styles.medCard}>
            <Text style={[styles.medNameText, { color: theme.textPrimary }]}>
              {medication.drugName}
            </Text>
            <View style={styles.medSubRow}>
              <View
                style={[
                  styles.qtyBadge,
                  { backgroundColor: theme.emerald },
                ]}
              >
                <Text style={styles.qtyText}>{medication.quantity || '1 pill'}</Text>
              </View>
              <Text style={[styles.dosageText, { color: theme.textSecondary }]}>
                ({medication.dosage})
              </Text>
            </View>
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
                },
              ]}
            >
              <View style={styles.goalHeader}>
                <Text style={[styles.goalLabel, { color: theme.textSubtle }]}>
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
                Final in-app reminder before your circle of care is notified.
              </Text>
            </View>
          )}

          {/* The Confirmation Action Button */}
          <NourishButton onNourish={handleConfirmWithCelebration} title="Confirm Dose Taken" />

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
    backgroundColor: 'rgba(5, 8, 14, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    marginBottom: 14,
    marginRight: 24,
  },
  quoteText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  levelBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelBadge2: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  levelBadge3: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stageTitleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buddyContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  buddyAura: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  medCard: {
    alignItems: 'center',
    marginVertical: 8,
  },
  medNameText: {
    fontSize: 22,
    fontWeight: '800',
  },
  medSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  qtyBadge: {
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 8,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dosageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitleText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  goalBox: {
    width: '100%',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalValue: {
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
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginVertical: 8,
  },
  lottiePulse: {
    width: 135,
    height: 135,
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
  urgentNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
});
