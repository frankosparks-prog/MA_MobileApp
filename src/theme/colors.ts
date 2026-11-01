export interface ThemeColors {
  isDark: boolean;
  
  // Base surfaces
  bg: string;
  bgCard: string;
  bgCardElevated: string;
  bgGlass: string;
  bgInput: string;
  border: string;
  borderSubtle: string;

  // Blue (#007BA7 / #38BDF8) - Primary Brand & Clinical Serenity
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  primaryContainer: string;

  // Red (#EF4444 / #DC2626) - Urgent Alerts & Escalation Safety Net
  alert: string;
  alertLight: string;
  alertDark: string;
  alertGlow: string;
  alertContainer: string;
  alertBorder: string;

  // Pure White & Light Accents
  white: string;
  whiteSubtle: string;
  whiteMuted: string;

  // Clinical Status & Secondary Accents
  emerald: string;
  emeraldLight: string;
  emeraldDark: string;
  emeraldGlow: string;
  
  amberWarning: string;
  amberGlow: string;

  // Gamification & Sanctuary Bloom
  bloomGold: string;
  sunflower: string;
  lavender: string;
  terracotta: string;
  bloomPink: string;

  // Medical Text & Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;

  // Wilted State (Overdue Dose Thirst)
  wiltedGrey: string;
  wiltedBg: string;
  wiltedText: string;

  // Bottom Navigation Dock
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActivePill: string;

  // Plant Canvas
  plantHaloHealthy: string;
  plantHaloWilted: string;
  plantHudBg: string;

  // Backward compatibility aliases
  brandBlue: string;
  brandBlueLight: string;
  brandBlueDark: string;
  brandBlueGlow: string;
  cerulean: string;
  ceruleanLight: string;
  ceruleanDark: string;
  ceruleanGlow: string;
  brandRed: string;
  brandRedLight: string;
  brandRedDark: string;
  brandRedGlow: string;
  neonRed: string;
  neonRedLight: string;
  neonRedDark: string;
  neonRedGlow: string;
  caregiverNavy: string;
  caregiverBlue: string;
  caregiverGlow: string;
  bgDark: string;
  bgCardDark: string;
  bgGlassBorder: string;
  bgGlassBorderRed: string;
  bgGlassLight: string;
}

export const darkTheme: ThemeColors = {
  isDark: true,
  bg: '#0A0A0A',
  bgCard: '#0E1420',
  bgCardElevated: '#131A29',
  bgGlass: 'rgba(14, 20, 32, 0.88)',
  bgInput: '#111827',
  border: 'rgba(0, 123, 167, 0.35)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',

  primary: '#007BA7',
  primaryLight: '#38BDF8',
  primaryDark: '#0369A1',
  primaryGlow: 'rgba(0, 123, 167, 0.45)',
  primaryContainer: 'rgba(0, 123, 167, 0.16)',

  alert: '#EF4444',
  alertLight: '#F87171',
  alertDark: '#B91C1C',
  alertGlow: 'rgba(239, 68, 68, 0.50)',
  alertContainer: 'rgba(239, 68, 68, 0.15)',
  alertBorder: 'rgba(239, 68, 68, 0.35)',

  white: '#FFFFFF',
  whiteSubtle: '#F1F5F9',
  whiteMuted: 'rgba(255, 255, 255, 0.75)',

  emerald: '#10B981',
  emeraldLight: '#34D399',
  emeraldDark: '#059669',
  emeraldGlow: 'rgba(16, 185, 129, 0.35)',

  amberWarning: '#F59E0B',
  amberGlow: 'rgba(245, 158, 11, 0.35)',

  bloomGold: '#F59E0B',
  sunflower: '#F59E0B',
  lavender: '#818CF8',
  terracotta: '#FB7185',
  bloomPink: '#EF4444',

  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textSubtle: '#64748B',

  wiltedGrey: '#64748B',
  wiltedBg: 'rgba(30, 41, 59, 0.75)',
  wiltedText: '#94A3B8',

  tabBarBg: '#0A0E15',
  tabBarBorder: 'rgba(0, 123, 167, 0.25)',
  tabBarActivePill: 'rgba(0, 123, 167, 0.14)',

  plantHaloHealthy: 'rgba(0, 123, 167, 0.14)',
  plantHaloWilted: 'rgba(239, 68, 68, 0.18)',
  plantHudBg: 'rgba(14, 20, 32, 0.92)',

  // Backward-compat aliases
  brandBlue: '#007BA7',
  brandBlueLight: '#38BDF8',
  brandBlueDark: '#0369A1',
  brandBlueGlow: 'rgba(0, 123, 167, 0.45)',
  cerulean: '#007BA7',
  ceruleanLight: '#38BDF8',
  ceruleanDark: '#0369A1',
  ceruleanGlow: 'rgba(0, 123, 167, 0.45)',
  brandRed: '#EF4444',
  brandRedLight: '#F87171',
  brandRedDark: '#B91C1C',
  brandRedGlow: 'rgba(239, 68, 68, 0.45)',
  neonRed: '#EF4444',
  neonRedLight: '#F87171',
  neonRedDark: '#B91C1C',
  neonRedGlow: 'rgba(239, 68, 68, 0.45)',
  caregiverNavy: '#0F172A',
  caregiverBlue: '#007BA7',
  caregiverGlow: 'rgba(0, 123, 167, 0.35)',
  bgDark: '#0A0A0A',
  bgCardDark: '#0E1420',
  bgGlassBorder: 'rgba(0, 123, 167, 0.32)',
  bgGlassBorderRed: 'rgba(239, 68, 68, 0.35)',
  bgGlassLight: 'rgba(255, 255, 255, 0.06)',
};

export const lightTheme: ThemeColors = {
  isDark: false,
  bg: '#F8FAFC',                          // Clean clinical slate background
  bgCard: '#FFFFFF',                      // Crisp pure white cards
  bgCardElevated: '#F1F5F9',              // Soft elevated grey
  bgGlass: 'rgba(255, 255, 255, 0.94)',   // Translucent frosted glass
  bgInput: '#FFFFFF',                     // Clean input fields
  border: '#E2E8F0',                      // Clean slate border
  borderSubtle: '#F1F5F9',

  primary: '#007BA7',                     // Primary Cerulean Blue
  primaryLight: '#0284C7',                // Active button tint
  primaryDark: '#0369A1',
  primaryGlow: 'rgba(0, 123, 167, 0.18)',
  primaryContainer: '#E0F2FE',            // Soft blue badge / chip container

  alert: '#DC2626',                       // Vibrant emergency red
  alertLight: '#EF4444',
  alertDark: '#991B1B',
  alertGlow: 'rgba(220, 38, 38, 0.20)',
  alertContainer: '#FEE2E2',              // Soft red alert chip container
  alertBorder: '#FECACA',                 // Soft red border

  white: '#FFFFFF',
  whiteSubtle: '#F8FAFC',
  whiteMuted: '#64748B',

  emerald: '#059669',
  emeraldLight: '#10B981',
  emeraldDark: '#047857',
  emeraldGlow: 'rgba(16, 185, 129, 0.20)',

  amberWarning: '#D97706',
  amberGlow: 'rgba(217, 119, 6, 0.20)',

  bloomGold: '#D97706',
  sunflower: '#F59E0B',
  lavender: '#6366F1',
  terracotta: '#E11D48',
  bloomPink: '#DC2626',

  textPrimary: '#0F172A',                 // Crisp slate-900 typography
  textSecondary: '#334155',               // Slate-700
  textMuted: '#64748B',                   // Slate-500
  textSubtle: '#94A3B8',                  // Slate-400

  wiltedGrey: '#94A3B8',
  wiltedBg: '#F1F5F9',
  wiltedText: '#64748B',

  tabBarBg: '#FFFFFF',                    // Crisp white bottom dock
  tabBarBorder: '#E2E8F0',                // Subtle top border
  tabBarActivePill: '#E0F2FE',            // Soft blue active pill

  plantHaloHealthy: 'rgba(0, 123, 167, 0.08)',
  plantHaloWilted: 'rgba(239, 68, 68, 0.10)',
  plantHudBg: 'rgba(255, 255, 255, 0.94)',

  // Backward-compat aliases
  brandBlue: '#007BA7',
  brandBlueLight: '#0284C7',
  brandBlueDark: '#0369A1',
  brandBlueGlow: 'rgba(0, 123, 167, 0.18)',
  cerulean: '#007BA7',
  ceruleanLight: '#0284C7',
  ceruleanDark: '#0369A1',
  ceruleanGlow: 'rgba(0, 123, 167, 0.18)',
  brandRed: '#DC2626',
  brandRedLight: '#EF4444',
  brandRedDark: '#991B1B',
  brandRedGlow: 'rgba(220, 38, 38, 0.20)',
  neonRed: '#DC2626',
  neonRedLight: '#EF4444',
  neonRedDark: '#991B1B',
  neonRedGlow: 'rgba(220, 38, 38, 0.20)',
  caregiverNavy: '#1E293B',
  caregiverBlue: '#007BA7',
  caregiverGlow: 'rgba(0, 123, 167, 0.15)',
  bgDark: '#F8FAFC',
  bgCardDark: '#FFFFFF',
  bgGlassBorder: '#E2E8F0',
  bgGlassBorderRed: '#FECACA',
  bgGlassLight: 'rgba(0, 0, 0, 0.04)',
};

// Default export for backward compatibility
export const colors = darkTheme;

export const shadows = {
  soft: {
    shadowColor: '#007BA7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  glow: {
    shadowColor: '#007BA7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  redGlow: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  neonRedGlow: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
};
