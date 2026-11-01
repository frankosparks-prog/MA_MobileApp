import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Users, X, HeartHandshake, Heart } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { NourishButton } from '../components/NourishButton';
import { Medication } from '../types';

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
  caregiverName = 'your designated caregiver',
  onConfirmTaken,
  onDismiss,
}) => {
  const { theme, isDark } = useTheme();

  // Paper airplane flight trajectory animation
  const planeX = useSharedValue(-60);
  const planeY = useSharedValue(20);
  const planeOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      planeX.value = -60;
      planeY.value = 20;
      planeOpacity.value = 0;

      planeOpacity.value = withTiming(1, { duration: 300 });

      planeX.value = withRepeat(
        withSequence(
          withTiming(60, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
          withTiming(-60, { duration: 0 }) // reset
        ),
        -1,
        false
      );

      planeY.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: 1100, easing: Easing.out(Easing.quad) }),
          withTiming(15, { duration: 1100, easing: Easing.in(Easing.quad) }),
          withTiming(20, { duration: 0 }) // reset
        ),
        -1,
        false
      );
    }
  }, [visible]);

  const animatedPlaneStyle = useAnimatedStyle(() => ({
    opacity: planeOpacity.value,
    transform: [
      { translateX: planeX.value },
      { translateY: planeY.value },
      { rotate: '-18deg' },
    ],
  }));

  if (!visible || !medication) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : theme.border,
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
          >
            <X size={18} color={theme.textSubtle} />
          </TouchableOpacity>

          {/* Circle of Care Header */}
          <View
            style={[
              styles.headerTag,
              { backgroundColor: theme.primaryContainer },
            ]}
          >
            <HeartHandshake size={15} color={theme.primaryLight} />
            <Text style={[styles.headerTagText, { color: theme.primaryLight }]}>
              Caregiver Escalation Notice
            </Text>
          </View>

          {/* Paper Airplane Flying Animation */}
          <View style={styles.animationCanvas}>
            {/* Left: Patient */}
            <View style={styles.nodeLeft}>
              <Heart size={22} color={theme.primaryLight} />
              <Text style={[styles.nodeLabel, { color: theme.textSubtle }]}>Patient</Text>
            </View>

            {/* Flying Paper Plane */}
            <Animated.View style={[styles.planeWrapper, animatedPlaneStyle]}>
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2Z"
                  stroke={theme.primaryLight}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>

            {/* Right: Family / Caregiver */}
            <View
              style={[
                styles.nodeRight,
                { backgroundColor: theme.primaryContainer },
              ]}
            >
              <Users size={24} color={theme.primaryLight} />
              <Text style={[styles.nodeLabel, { color: theme.textSubtle }]}>Caregiver</Text>
            </View>
          </View>

          {/* Clinical check-in message */}
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Caregiver Escalation Dispatched
          </Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            Your scheduled dose of {medication.quantity || '1 dose'} of{' '}
            <Text style={[styles.boldText, { color: theme.emerald }]}>
              {medication.drugName}
            </Text>{' '}
            ({medication.dosage}) has passed the confirmation window.
          </Text>

          <View
            style={[
              styles.smsNoticeBox,
              {
                backgroundColor: theme.primaryContainer,
                borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD',
              },
            ]}
          >
            <Text style={[styles.smsNoticeText, { color: theme.primaryLight }]}>
              A priority check-in alert and SMS notification were sent to{' '}
              <Text style={[styles.boldWhite, { color: theme.textPrimary }]}>
                {caregiverName}
              </Text>.
            </Text>
          </View>

          {/* Action to take now */}
          <View style={styles.actionSection}>
            <Text style={[styles.actionPrompt, { color: theme.textSubtle }]}>
              Have you taken this dose?
            </Text>
            <NourishButton onNourish={onConfirmTaken} title="Confirm Dose Taken" />
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
    maxWidth: 380,
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
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  animationCanvas: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginVertical: 6,
    position: 'relative',
  },
  nodeLeft: {
    alignItems: 'center',
    gap: 4,
  },
  nodeRight: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 16,
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  planeWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  boldText: {
    fontWeight: '800',
  },
  boldWhite: {
    fontWeight: '700',
  },
  smsNoticeBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  smsNoticeText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  actionPrompt: {
    fontSize: 12,
    marginBottom: 4,
  },
});
