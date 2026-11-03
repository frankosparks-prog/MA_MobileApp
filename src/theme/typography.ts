import { Platform } from 'react-native';

/**
 * Unified Typography System for MediAlert
 * Powered by Plus Jakarta Sans across iOS, Android, and Web
 */
export const typography = {
  regular: Platform.select({
    web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    default: 'PlusJakartaSans_400Regular',
  }),
  medium: Platform.select({
    web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    default: 'PlusJakartaSans_500Medium',
  }),
  semiBold: Platform.select({
    web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    default: 'PlusJakartaSans_600SemiBold',
  }),
  bold: Platform.select({
    web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    default: 'PlusJakartaSans_700Bold',
  }),
  extraBold: Platform.select({
    web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    default: 'PlusJakartaSans_800ExtraBold',
  }),
};

export const fontWeights = {
  regular: {
    fontFamily: typography.regular,
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: typography.medium,
    fontWeight: '500' as const,
  },
  semiBold: {
    fontFamily: typography.semiBold,
    fontWeight: '600' as const,
  },
  bold: {
    fontFamily: typography.bold,
    fontWeight: '700' as const,
  },
  extraBold: {
    fontFamily: typography.extraBold,
    fontWeight: '800' as const,
  },
};

