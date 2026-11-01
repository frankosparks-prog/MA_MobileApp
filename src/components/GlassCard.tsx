import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'glow' | 'wilted' | 'urgent';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = 'default' }) => {
  let gradientColors = ['rgba(20, 48, 36, 0.72)', 'rgba(10, 28, 20, 0.85)'];
  let borderColor = colors.bgGlassBorder;

  if (variant === 'glow') {
    gradientColors = ['rgba(26, 68, 50, 0.82)', 'rgba(12, 38, 28, 0.9)'];
    borderColor = 'rgba(52, 211, 153, 0.45)';
  } else if (variant === 'wilted') {
    gradientColors = ['rgba(55, 65, 81, 0.75)', 'rgba(31, 41, 55, 0.88)'];
    borderColor = 'rgba(156, 163, 175, 0.3)';
  } else if (variant === 'urgent') {
    gradientColors = ['rgba(88, 28, 28, 0.75)', 'rgba(45, 15, 15, 0.88)'];
    borderColor = 'rgba(239, 68, 68, 0.4)';
  }

  return (
    <View style={[styles.outerContainer, { borderColor }, style]}>
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.innerGradient}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 22,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  innerGradient: {
    padding: 16,
    borderRadius: 22,
  },
});

