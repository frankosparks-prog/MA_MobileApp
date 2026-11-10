import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Users, X, Heart, Radio, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { NourishButton } from '../components/NourishButton';
import { ContactUsIllustration } from '../components/ContactUsIllustration';
import { Medication } from '../types';
import { typography } from '../theme/typography';

interface CaregiverEscalationModalProps {
  visible: boolean;
  medication: Medication | null;
  caregiverName?: string;
  onConfirmTaken: () => Promise<void> | void;
  onDismiss: () => void;
}

export const CaregiverEscalationModal: React.FC<CaregiverEscalationModalProps> = ({
  visible,
  medication,
  caregiverName = 'Designated Caregiver',
  onConfirmTaken,
  onDismiss,
}) => {
  const { theme, isDark } = useTheme();

  // Radar ping on caregiver receiver & beacon pulse on patient node
  const receiverPing = useSharedValue(0);
  const beaconPulse = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      receiverPing.value = 0;
      receiverPing.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 900 }),
          withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })
        ),
        -1,
        false
      );

      beaconPulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 750, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 750, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const radarRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(receiverPing.value, [0, 1], [0.85, 1.55]);
    const opacity = interpolate(receiverPing.value, [0, 0.3, 1], [0, 0.6, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const patientBeaconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: beaconPulse.value }],
  }));

  if (!visible || !medication) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(10, 15, 26, 0.98)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#BAE6FD',
              shadowColor: '#007BA7',
            },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={[
              styles.closeBtn,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' },
            ]}
            onPress={onDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color={theme.textSubtle} />
          </TouchableOpacity>

          {/* Safety Net Escalation Tag */}
          <View
            style={[
              styles.headerTag,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEE2E2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.32)' : '#FECACA',
              },
            ]}
          >
            <Radio size={14} color="#EF4444" />
            <Text style={[styles.headerTagText, { color: isDark ? '#F87171' : '#DC2626' }]}>
              PRIORITY ESCALATION ACTIVE
            </Text>
          </View>

          {/* Telemetry Signal Bridge with Hand-drawn Animated Paper Plane */}
          <View style={styles.telemetrySection}>
            <View
              style={[
                styles.telemetryBridgeBg,
                {
                  backgroundColor: isDark ? 'rgba(14, 23, 42, 0.75)' : '#F0F9FF',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : '#E0F2FE',
                },
              ]}
            >
              {/* Patient Node (Left) */}
              <View style={styles.nodeColumn}>
                <View style={styles.nodeCircleWrapper}>
                  <Animated.View
                    style={[
                      styles.patientPulseRing,
                      { borderColor: theme.primaryLight },
                      patientBeaconStyle,
                    ]}
                  />
                  <View
                    style={[
                      styles.nodeCircle,
                      {
                        backgroundColor: isDark ? '#0F1D36' : '#E0F2FE',
                        borderColor: isDark ? '#38BDF8' : '#0284C7',
                      },
                    ]}
                  >
                    <Heart size={18} color="#38BDF8" fill={isDark ? '#007BA7' : '#BAE6FD'} />
                  </View>
                </View>
                <Text style={[styles.nodeLabel, { color: theme.textPrimary }]}>Patient</Text>
                <Text style={[styles.nodeSublabel, { color: theme.textSubtle }]}>Vitals Synced</Text>
              </View>

              {/* Contact Us Animated SVG (Center Caregiver Communication Link) */}
              <View style={styles.paperPlaneCenterWrap}>
                <ContactUsIllustration size={98} />
              </View>

              {/* Caregiver Node (Right) */}
              <View style={styles.nodeColumn}>
                <View style={styles.nodeCircleWrapper}>
                  {/* Radar receiving sonar rings */}
                  <Animated.View
                    style={[
                      styles.caregiverRadarRing,
                      { borderColor: '#10B981' },
                      radarRingStyle,
                    ]}
                  />
                  <View
                    style={[
                      styles.nodeCircle,
                      {
                        backgroundColor: isDark ? '#064E3B' : '#D1FAE5',
                        borderColor: isDark ? '#10B981' : '#059669',
                      },
                    ]}
                  >
                    <Users size={18} color="#10B981" />
                  </View>
                </View>
                <Text style={[styles.nodeLabel, { color: theme.textPrimary }]}>Caregiver</Text>
                <Text style={[styles.nodeSublabel, { color: '#10B981' }]}>SMS Dispatched</Text>
              </View>
            </View>

            {/* Micro Protocol Pill */}
            <View
              style={[
                styles.protocolPill,
                { backgroundColor: isDark ? 'rgba(0, 123, 167, 0.12)' : '#F0F9FF' },
              ]}
            >
              <View style={styles.liveGreenDot} />
              <Text style={[styles.protocolText, { color: theme.textSecondary }]}>
                Encrypted Adherence Link • Level 4 Dispatch
              </Text>
            </View>
          </View>

          {/* Clinical Check-in Message */}
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Caregiver Escalation Dispatched
          </Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            Your scheduled dose of {medication.quantity || '1 pill'} of{' '}
            <Text style={[styles.boldText, { color: theme.emerald }]}>
              {medication.drugName}
            </Text>{' '}
            ({medication.dosage}) has passed the adherence confirmation window.
          </Text>

          <View
            style={[
              styles.smsNoticeBox,
              {
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD',
              },
            ]}
          >
            <View style={styles.smsNoticeRow}>
              <CheckCircle2 size={16} color="#10B981" style={{ marginTop: 2 }} />
              <Text style={[styles.smsNoticeText, { color: theme.textPrimary }]}>
                A priority safety net alert and SMS notification were dispatched to{' '}
                <Text style={[styles.boldCaregiverName, { color: theme.primaryLight }]}>
                  {caregiverName}
                </Text>
                .
              </Text>
            </View>
          </View>

          {/* Action to take now */}
          <View style={styles.actionSection}>
            <Text style={[styles.actionPrompt, { color: theme.textSubtle }]}>
              Have you ingested this dose?
            </Text>
            <NourishButton onNourish={onConfirmTaken} title="Confirm Dose Ingested" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 12, 24, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 12,
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
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerTagText: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  telemetrySection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  telemetryBridgeBg: {
    width: '100%',
    height: 110,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  paperPlaneCenterWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 4,
  },
  nodeColumn: {
    alignItems: 'center',
    zIndex: 4,
    width: 82,
  },
  nodeCircleWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  nodeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  patientPulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    opacity: 0.5,
  },
  caregiverRadarRing: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    zIndex: 1,
  },
  nodeLabel: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  nodeSublabel: {
    fontFamily: typography.medium,
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },
  protocolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  protocolText: {
    fontFamily: typography.medium,
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontFamily: typography.extraBold,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: typography.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  boldText: {
    fontFamily: typography.bold,
    fontWeight: '700',
  },
  smsNoticeBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  smsNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  smsNoticeText: {
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  boldCaregiverName: {
    fontFamily: typography.bold,
    fontWeight: '700',
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  actionPrompt: {
    fontFamily: typography.medium,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
});
