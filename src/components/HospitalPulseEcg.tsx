import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, LayoutChangeEvent, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Activity } from 'lucide-react-native';
import { typography } from '../theme/typography';

interface HospitalPulseEcgProps {
  isDark?: boolean;
  primaryColor?: string;
  glowColor?: string;
  height?: number;
  bpm?: number;
  showTelemetryHUD?: boolean;
}

/**
 * HospitalPulseEcg
 * 
 * Recreates an authentic ICU / ER patient vital signs monitor:
 * - Precision Lead II P-Q-R-S-T cardiac telemetry waveform
 * - Continuous cathode-ray / digital sweep bar with trailing phosphor decay
 * - Moving erase gap ahead of the scanning head (wiping old trace like real monitors)
 * - White-hot cardiac tracer blip at the wavefront
 * - Live HR (74 BPM) telemetry readout with synchronized heartbeat pulse
 * - 60 FPS hardware accelerated animation via useNativeDriver
 */
export const HospitalPulseEcg: React.FC<HospitalPulseEcgProps> = ({
  isDark = true,
  primaryColor,
  glowColor,
  height = 36,
  bpm = 74,
  showTelemetryHUD = true,
}) => {
  const [containerWidth, setContainerWidth] = useState(340);
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const bpmPulseAnim = useRef(new Animated.Value(1)).current;

  // Authentic clinical telemetry colors: ICU cyan/green
  const traceBase = primaryColor || (isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(2, 132, 199, 0.22)');
  const traceBright = glowColor || (isDark ? '#38BDF8' : '#0284C7');
  const cardBg = isDark ? '#0C1322' : '#FFFFFF';

  // Sweep cycle duration (authentic standard 25mm/s medical monitor sweep: ~2.4s)
  const sweepDuration = 2400;
  const heartbeatDuration = Math.round((60 / bpm) * 1000);

  useEffect(() => {
    // 1. Continuous patient monitor scanning sweep
    const sweepLoop = Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: sweepDuration,
        useNativeDriver: true,
      })
    );
    sweepLoop.start();

    // 2. Synchronized cardiac Lub-Dub pulse for the HR heart telemetry indicator
    const bpmLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bpmPulseAnim, {
          toValue: 1.25,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bpmPulseAnim, {
          toValue: 0.95,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(bpmPulseAnim, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bpmPulseAnim, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.delay(heartbeatDuration - 420),
      ])
    );
    bpmLoop.start();

    return () => {
      sweepLoop.stop();
      bpmLoop.stop();
    };
  }, [sweepAnim, bpmPulseAnim, sweepDuration, heartbeatDuration]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && Math.abs(width - containerWidth) > 2) {
      setContainerWidth(width);
    }
  };

  // Generate precision P-Q-R-S-T medical waveform
  const ecgPath = React.useMemo(() => {
    const w = containerWidth;
    const midY = height / 2;
    const cycleWidth = 140;
    const numCycles = Math.ceil(w / cycleWidth) + 1;

    let d = `M 0,${midY}`;

    for (let i = 0; i < numCycles; i++) {
      const startX = i * cycleWidth;

      // Baseline pre-lead
      d += ` L ${startX + 16},${midY}`;

      // P Wave: gentle rounded atrial depolarization
      d += ` C ${startX + 21},${midY - 4.5} ${startX + 27},${midY - 4.5} ${startX + 32},${midY}`;

      // PR segment: brief baseline
      d += ` L ${startX + 42},${midY}`;

      // QRS Complex:
      // Q dip: sharp downward deflection
      d += ` L ${startX + 45},${midY + 3.5}`;
      // R spike: tall vertical cardiac peak
      d += ` L ${startX + 51},3`;
      // S dip: rapid rebound below baseline
      d += ` L ${startX + 57},${height - 3}`;
      // Return to isoelectric line
      d += ` L ${startX + 62},${midY}`;

      // ST segment
      d += ` L ${startX + 72},${midY}`;

      // T Wave: smooth ventricular repolarization dome
      d += ` C ${startX + 80},${midY - 6.5} ${startX + 90},${midY - 6.5} ${startX + 98},${midY}`;

      // Isoelectric recovery baseline to next cardiac cycle
      d += ` L ${startX + cycleWidth},${midY}`;
    }

    return d;
  }, [containerWidth, height]);

  // Sweep phosphor head & erase gap calculations
  const trailWidth = Math.min(containerWidth * 0.42, 140);
  const eraseGapWidth = 28; // erasing window ahead of scanning head

  const translateX = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-trailWidth, containerWidth + eraseGapWidth],
  });

  return (
    <View style={styles.outerContainer} onLayout={handleLayout}>
      {/* Top Clinical Telemetry Status Strip */}
      {showTelemetryHUD && (
        <View style={styles.hudRow}>
          <View style={styles.leadTag}>
            <Activity size={11} color={traceBright} strokeWidth={2.4} />
            <Text style={[styles.leadText, { color: traceBright }]}>ECG LEAD II</Text>
          </View>

          <View style={styles.vitalGroup}>
            <Animated.View style={{ transform: [{ scale: bpmPulseAnim }] }}>
              <Heart size={12} color="#EF4444" fill="#EF4444" />
            </Animated.View>
            <Text style={[styles.bpmValueText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {bpm}
            </Text>
            <Text style={[styles.bpmUnitText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              BPM • NSR
            </Text>
          </View>
        </View>
      )}

      {/* Main Patient Monitor Screen Canvas */}
      <View
        style={[
          styles.monitorScreen,
          {
            height,
            backgroundColor: isDark ? 'rgba(8, 14, 26, 0.65)' : 'rgba(240, 249, 255, 0.75)',
            borderColor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#E0F2FE',
          },
        ]}
      >
        {/* 1. Subtle Medical Baseline Grid Dots / Lines */}
        <Svg width="100%" height={height} style={StyleSheet.absoluteFill}>
          <Line
            x1="0"
            y1={height / 2}
            x2={containerWidth}
            y2={height / 2}
            stroke={isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.08)'}
            strokeWidth={1}
            strokeDasharray="4 6"
          />
        </Svg>

        {/* 2. Inactive / Resting ECG Waveform Track */}
        <Svg
          width={containerWidth}
          height={height}
          viewBox={`0 0 ${containerWidth} ${height}`}
          style={StyleSheet.absoluteFill}
        >
          <Path
            d={ecgPath}
            stroke={traceBase}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>

        {/* 3. Sweeping Phosphor Beam with Trailing Decay & Erase Gap */}
        <Animated.View
          style={[
            styles.sweepWrapper,
            {
              width: trailWidth + eraseGapWidth,
              height,
              transform: [{ translateX }],
            },
          ]}
          pointerEvents="none"
        >
          {/* Luminous Phosphorescent Trail (Fade-in Behind Head) */}
          <LinearGradient
            colors={[
              'rgba(56, 189, 248, 0)',
              isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.28)',
              isDark ? 'rgba(56, 189, 248, 0.95)' : 'rgba(2, 132, 199, 0.95)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.trailGradient, { width: trailWidth }]}
          />

          {/* Glowing White-Hot Patient Monitor Scan Head */}
          <View style={styles.scanHeadContainer}>
            <View
              style={[
                styles.scanBlipDot,
                {
                  backgroundColor: '#FFFFFF',
                  shadowColor: traceBright,
                },
              ]}
            />
          </View>

          {/* Erase Gap Ahead of Scanning Head (Authentic CRT / Digital Monitor Sweep) */}
          <View
            style={[
              styles.eraseGap,
              {
                width: eraseGapWidth,
                backgroundColor: isDark ? 'rgba(8, 14, 26, 0.82)' : 'rgba(240, 249, 255, 0.88)',
              },
            ]}
          />
        </Animated.View>

        {/* 4. Active Illuminated ECG Trace Overlay (High Intensity Phosphor) */}
        <Svg
          width={containerWidth}
          height={height}
          viewBox={`0 0 ${containerWidth} ${height}`}
          style={[StyleSheet.absoluteFill, { opacity: 0.95 }]}
          pointerEvents="none"
        >
          <Defs>
            <SvgLinearGradient id="activeTraceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={traceBright} stopOpacity="0.1" />
              <Stop offset="65%" stopColor={traceBright} stopOpacity="0.75" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d={ecgPath}
            stroke="url(#activeTraceGrad)"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={isDark ? 0.95 : 0.85}
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginVertical: 4,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  leadTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leadText: {
    fontFamily: typography.bold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  vitalGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bpmValueText: {
    fontFamily: typography.extraBold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  bpmUnitText: {
    fontFamily: typography.semiBold,
    fontSize: 10,
    fontWeight: '600',
  },
  monitorScreen: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  sweepWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trailGradient: {
    height: '100%',
  },
  scanHeadContainer: {
    width: 8,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scanBlipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  eraseGap: {
    height: '100%',
  },
});
