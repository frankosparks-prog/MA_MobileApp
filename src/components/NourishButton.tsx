import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Droplets, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';
import hapticService from '../services/hapticService';
import soundService from '../services/soundService';

interface NourishButtonProps {
  onNourish: () => Promise<void> | void;
  title?: string;
  disabled?: boolean;
}

export const NourishButton: React.FC<NourishButtonProps> = ({
  onNourish,
  title = 'Nourish My Garden',
  disabled = false,
}) => {
  const [isWatering, setIsWatering] = useState(false);
  const buttonScale = useSharedValue(1);

  const handlePress = async () => {
    if (disabled || isWatering) return;
    setIsWatering(true);

    // Physical reward & audio
    hapticService.triggerNourishSuccess();
    soundService.playWaterSplash();

    // Button pulse
    buttonScale.value = withSequence(
      withTiming(0.94, { duration: 100 }),
      withSpring(1, { damping: 6 })
    );

    // Complete callback after animation plays
    setTimeout(async () => {
      try {
        await onNourish();
      } finally {
        setIsWatering(false);
      }
    }, 850);
  };

  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedBtnStyle]}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={disabled || isWatering}
      >
        {isWatering ? (
          <View style={styles.wateringContent}>
            <LottieView
              source={require('../../assets/animations/water_splash.json')}
              autoPlay
              loop={false}
              style={styles.splashLottie}
            />
            <Text style={styles.buttonText}>Nourishing...</Text>
          </View>
        ) : (
          <View style={styles.idleContent}>
            <Droplets size={20} color="#0A0A0A" />
            <Text style={styles.buttonText}>{title}</Text>
            <Sparkles size={16} color="rgba(10, 10, 10, 0.6)" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
    width: '100%',
  },
  button: {
    backgroundColor: colors.ceruleanLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: colors.cerulean,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 56,
  },
  buttonDisabled: {
    backgroundColor: '#374151',
    shadowOpacity: 0,
  },
  idleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wateringContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
  },
  splashLottie: {
    width: 38,
    height: 38,
  },
  buttonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

