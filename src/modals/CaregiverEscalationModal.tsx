import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Users, X, HeartHandshake, Heart, Shield, Radio, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { NourishButton } from '../components/NourishButton';
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
  caregiverName = 'designated caregiver',
  onConfirmTaken,
  onDismiss,
}) => {
  const { theme, isDark } = useTheme();

  // Animation values for realistic telemetry arrow and pulse bridge
  const flightProgress = useSharedValue(0); // 0 to 1 traversal
  const receiverPing = useSharedValue(0);   // Caregiver radar ping
  const beaconPulse = useSharedValue(1);    // Patient transmission pulse

  useEffect(() => {
    if (visible) {
      // Continuous telemetry arrow flight from Patient (0) to Caregiver (1)
      flightProgress.value = 0;
      flightProgress.value = withRepeat(
        withTiming(1, {
          duration: 1800,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }),
        -1,
        false
      );

      // Radar receiver ping synchronized as arrow reaches caregiver (around 80-100% of cycle)
      receiverPing.value = 0;
      receiverPing.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1200 }),
          withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
        ),
        -1,
        false
      );

      // Patient beacon pulse
      beaconPulse.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  // Main Arrow flight style: moves horizontally across the bridge
  const arrowStyle = useAnimatedStyle(() => {
    // Canvas span between patient node and caregiver node is ~170px
    const translateX = interpolate(flightProgress.value, [0, 0.1, 0.9, 1], [-85, -75, 75, 85]);
    const translateY = interpolate(flightProgress.value, [0, 0.5, 1], [0, -6, 0]);
    const opacity = interpolate(flightProgress.value, [0, 0.08, 0.92, 1], [0, 1, 1, 0]);
    const scale = interpolate(flightProgress.value, [0, 0.5, 1], [0.85, 1.05, 0.9]);

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
    };
  });

  // Secondary data packet trailing the arrow
  const packetStyle = useAnimatedStyle(() => {
    const progress = (flightProgress.value + 0.35) % 1;
    const translateX = interpolate(progress, [0, 1], [-85, 85]);
    const opacity = interpolate(progress, [0, 0.15, 0.85, 1], [0, 0.8, 0.8, 0]);
    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  // Caregiver receiver radar rings style
  const radarRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(receiverPing.value, [0, 1], [0.8, 1.6]);
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
              backgroundColor: isDark ? 'rgba(10, 15, 26, 0.97)' : 'rgba(255, 255, 255, 0.99)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#BAE6FD',
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
                backgroundColor: isDark ? 'rgba(0, 123, 167, 0.18)' : '#E0F2FE',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD',
              },
            ]}
          >
            <Radio size={14} color="#38BDF8" />
            <Text style={[styles.headerTagText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
              PRIORITY ESCALATION ACTIVE
            </Text>
          </View>

          {/* Realistic Telemetry Arrow & Signal Bridge Canvas */}
          <View style={styles.telemetrySection}>
            <View
              style={[
                styles.telemetryBridgeBg,
                {
                  backgroundColor: isDark ? 'rgba(14, 23, 42, 0.7)' : '#F0F9FF',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#E0F2FE',
                },
              ]}
            >
              {/* Underlying telemetry transmission line */}
              <View style={styles.bridgeTrackContainer}>
                <Svg width="180" height="24" viewBox="0 0 180 24">
                  <Defs>
                    <LinearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#007BA7" stopOpacity="0.4" />
                      <Stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
                      <Stop offset="100%" stopColor="#10B981" stopOpacity="0.5" />
                    </LinearGradient>
                  </Defs>
                  {/* Dashed baseline track */}
                  <Line
                    x1="10"
                    y1="12"
                    x2="170"
                    y2="12"
                    stroke="url(#trackGrad)"
                    strokeWidth="2"
                    strokeDasharray="4, 4"
                  />
                </Svg>
              </View>

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

              {/* Trailing Signal Packet */}
              <Animated.View style={[styles.signalPacket, packetStyle]}>
                <View style={styles.packetDot} />
              </Animated.View>

              {/* Sleek High-Tech Telemetry Directed Arrow */}
              <Animated.View style={[styles.arrowWrapper, arrowStyle]}>
                <Svg width="44" height="26" viewBox="0 0 44 26" fill="none">
                  <Defs>
                    <LinearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.1" />
                      <Stop offset="40%" stopColor="#38BDF8" stopOpacity="0.7" />
                      <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
                      <Stop offset="80%" stopColor="#38BDF8" stopOpacity="0.6" />
                      <Stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
                    </LinearGradient>
                  </Defs>
                  {/* Glowing Aerodynamic Tracer Trail */}
                  <Path
                    d="M2 13 H 26"
                    stroke="url(#trailGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Aerodynamic Speed Vanes */}
                  <Path
                    d="M8 8 L 18 13 L 8 18"
                    stroke="#38BDF8"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.6"
                  />
                  {/* Main Razor Arrow Head with White Energy Core */}
                  <Path
                    d="M22 6 L 35 13 L 22 20 L 26 13 Z"
                    fill="url(#arrowGrad)"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  {/* White-Hot Tip Blip */}
                  <Circle cx="35" cy="13" r="2.2" fill="#FFFFFF" />
                </Svg>
              </Animated.View>

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
            Your scheduled dose of {medication.quantity || '1 dose'} of{' '}
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
    gap: 7,
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
    height: 94,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  bridgeTrackContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -90,
    top: 26,
    zIndex: 1,
  },
  nodeColumn: {
    alignItems: 'center',
    zIndex: 4,
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
  arrowWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -22,
    top: 26,
    zIndex: 5,
  },
  signalPacket: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -4,
    top: 36,
    zIndex: 3,
  },
  packetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
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
