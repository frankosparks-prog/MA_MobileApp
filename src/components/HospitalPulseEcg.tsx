import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, LayoutChangeEvent, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface HospitalPulseEcgProps {
  isDark?: boolean;
  primaryColor?: string;
  glowColor?: string;
  height?: number;
  bpm?: number;
}

/**
 * HospitalPulseEcg
 * 
 * Recreates a realistic ICU patient telemetry monitor:
 * - Authentic P-Q-R-S-T cardiac waveform spikes
 * - Phosphor scan beam sweeping left-to-right at ~72 BPM
 * - Luminous trailing phosphorescent gradient decay
 * - Glowing energized cardiac blip head at the wavefront
 * - 60 FPS hardware accelerated animation via useNativeDriver
 */
export const HospitalPulseEcg: React.FC<HospitalPulseEcgProps> = ({
  isDark = true,
  primaryColor,
  glowColor,
  height = 28,
  bpm = 72,
}) => {
  const [containerWidth, setContainerWidth] = useState(340);
  const sweepAnim = useRef(new Animated.Value(0)).current;

  // Colors tailored for MediAlert medical theme
  const restingStroke = primaryColor || (isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(2, 132, 199, 0.22)');
  const activeStroke = glowColor || (isDark ? '#38BDF8' : '#0284C7');
  const blipDotColor = isDark ? '#FFFFFF' : '#0284C7';

  // Sweep cycle duration based on target BPM (e.g., 72 BPM = ~2.5s per sweep window)
  const sweepDuration = Math.round((60 / bpm) * 3000); // ~2500ms

  useEffect(() => {
    const sweepLoop = Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: sweepDuration,
        useNativeDriver: true,
      })
    );
    sweepLoop.start();

    return () => {
      sweepLoop.stop();
    };
  }, [sweepAnim, sweepDuration]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && Math.abs(width - containerWidth) > 2) {
      setContainerWidth(width);
    }
  };

  // Generate authentic P-Q-R-S-T waveform matching the width
  // Baseline is y = 14 (half of height 28)
  const ecgPath = React.useMemo(() => {
    const w = containerWidth;
    const midY = height / 2; // 14
    
    // Each heartbeat cycle is ~140px wide:
    // P wave: gentle rise (y: 14 -> 9 -> 14)
    // PR interval: flat (y: 14)
    // Q wave: small downward deflection (y: 14 -> 17)
    // R wave: explosive ventricular spike (y: 17 -> 2 -> 24)
    // S wave: downward rebound (y: 2 -> 24 -> 14)
    // ST segment: flat (y: 14)
    // T wave: smooth ventricular repolarization dome (y: 14 -> 8 -> 14)
    // Isoelectric baseline to next cycle
    const cycleWidth = 140;
    const numCycles = Math.ceil(w / cycleWidth) + 1;
    
    let d = `M 0,${midY}`;
    for (let i = 0; i < numCycles; i++) {
      const startX = i * cycleWidth;
      
      // Isoelectric pre-lead
      d += ` L ${startX + 18},${midY}`;
      
      // P Wave: gentle atrial depolarization
      d += ` C ${startX + 23},${midY - 4} ${startX + 28},${midY - 4} ${startX + 33},${midY}`;
      
      // PR segment
      d += ` L ${startX + 44},${midY}`;
      
      // QRS Complex:
      // Q dip
      d += ` L ${startX + 47},${midY + 3}`;
      // R spike: tall explosive cardiac peak
      d += ` L ${startX + 52},2`;
      // S dip: rebound deep below baseline
      d += ` L ${startX + 58},${height - 3}`;
      // Return to baseline
      d += ` L ${startX + 63},${midY}`;
      
      // ST segment
      d += ` L ${startX + 74},${midY}`;
      
      // T Wave: smooth repolarization dome
      d += ` C ${startX + 82},${midY - 6} ${startX + 92},${midY - 6} ${startX + 100},${midY}`;
      
      // Isoelectric recovery baseline
      d += ` L ${startX + cycleWidth},${midY}`;
    }
    
    return d;
  }, [containerWidth, height]);

  // Traveling beam translation
  const beamWidth = Math.min(containerWidth * 0.45, 160);
  const translateX = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-beamWidth, containerWidth + 20],
  });

  return (
    <View style={[styles.wrapper, { height }]} onLayout={handleLayout}>
      {/* 1. Inactive / Resting ECG Waveform Track */}
      <Svg
        width={containerWidth}
        height={height}
        viewBox={`0 0 ${containerWidth} ${height}`}
        style={StyleSheet.absoluteFill}
      >
        <Path
          d={ecgPath}
          stroke={restingStroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>

      {/* 2. Sweeping Phosphor Beam Mask / Active Illuminated ECG */}
      <Animated.View
        style={[
          styles.sweepBeamContainer,
          {
            width: beamWidth,
            height,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Phosphor Glow Gradient Tail */}
        <LinearGradient
          colors={[
            'rgba(56, 189, 248, 0)',
            isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.35)',
            isDark ? 'rgba(56, 189, 248, 0.85)' : 'rgba(2, 132, 199, 0.85)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Leading Medical Blip Head */}
        <View
          style={[
            styles.blipHead,
            {
              backgroundColor: blipDotColor,
              shadowColor: activeStroke,
            },
          ]}
        />
      </Animated.View>

      {/* 3. Luminous Active Highlight Overlay (revealed by beam) */}
      <Svg
        width={containerWidth}
        height={height}
        viewBox={`0 0 ${containerWidth} ${height}`}
        style={[StyleSheet.absoluteFill, { opacity: 0.95 }]}
      >
        <Defs>
          <SvgLinearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={activeStroke} stopOpacity="0.1" />
            <Stop offset="70%" stopColor={activeStroke} stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={ecgPath}
          stroke="url(#beamGrad)"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={isDark ? 0.9 : 0.8}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 4,
  },
  sweepBeamContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'visible',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  blipHead: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
  },
});

