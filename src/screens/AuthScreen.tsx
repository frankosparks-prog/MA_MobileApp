import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { DoctorIllustration } from '../components/DoctorIllustration';
import {
  ShieldCheck,
  Server,
  RefreshCw,
  ArrowRight,
  Phone,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Pill,
  Users,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Activity,
  KeyRound,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { UserRole, User } from '../types';
import { authApi } from '../api';
import client, { getAutoDetectedServerUrl } from '../api/client';
import hapticService from '../services/hapticService';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [contactInfo, setContactInfo] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+254');
  const [role, setRole] = useState<UserRole>('Patient');

  // Server URL & Connection Status
  const [serverUrl, setServerUrl] = useState(client.getServerUrl());
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [connStatus, setConnStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connMessage, setConnMessage] = useState('Testing server connection...');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Smooth entrance animation for form card
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 8,
      tension: 45,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isLogin]);

  // Test server connectivity on mount and when serverUrl updates
  const testConnection = async (urlToTest: string) => {
    setConnStatus('checking');
    setConnMessage('Connecting to server...');
    const result = await client.testConnection(urlToTest);
    if (result.ok) {
      setConnStatus('connected');
      setConnMessage('Server Online');
    } else {
      setConnStatus('error');
      setConnMessage(result.statusText || 'Unable to connect to backend');
    }
  };

  useEffect(() => {
    const initServer = async () => {
      await client.loadServerUrl();
      const current = client.getServerUrl();
      setServerUrl(current);
      testConnection(current);
    };
    initServer();
  }, []);

  const handleApplyServerUrl = async (url: string) => {
    setServerUrl(url);
    await client.setServerUrl(url);
    testConnection(url);
  };

  const handleResetToAutoDetected = async () => {
    const autoUrl = getAutoDetectedServerUrl();
    await handleApplyServerUrl(autoUrl);
  };

  const handleTabSwitch = (loginMode: boolean) => {
    hapticService.selection();
    setIsLogin(loginMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    hapticService.selection();
    setRole(selectedRole);
  };

  const handleQuickDemo = (demoUser: 'patient1' | 'caregiver1') => {
    hapticService.selection();
    setIsLogin(true);
    setUsername(demoUser);
    setPin('1234');
    setRole(demoUser === 'caregiver1' ? 'Caregiver' : 'Patient');
    setErrorMsg('');
    setSuccessMsg(`Credentials loaded for ${demoUser}. Ready to sign in.`);
  };

  const handleForgotPin = () => {
    hapticService.selection();
    Alert.alert(
      'PIN Recovery',
      'For patient safety and adherence tracking, PIN resets are coordinated through your designated Caregiver or clinical administrator.\n\nQuick Tip: If evaluating MediAlert, use demo credentials (patient1 / 1234).'
    );
  };

  const handleSubmit = async () => {
    if (!username.trim() || !pin.trim()) {
      setErrorMsg('Please enter your username and security PIN.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        const res = await authApi.login({ username: username.trim(), pin: pin.trim() });
        const userObj = res.data?.user || (res as any).user;
        if (!userObj) {
          throw new Error('Authentication succeeded but user profile was not received.');
        }
        await client.setToken(res.token);
        setSuccessMsg(`Welcome, ${userObj.username}`);
        hapticService.triggerNourishSuccess();
        setTimeout(() => onAuthSuccess(userObj), 300);
      } else {
        if (!contactInfo.trim()) {
          setErrorMsg('Please enter a contact phone number for escalation.');
          setIsLoading(false);
          return;
        }

        // Clean phone number format
        let cleanPhone = contactInfo.trim();
        if (!cleanPhone.startsWith('+')) {
          if (cleanPhone.startsWith('0')) {
            cleanPhone = phoneCountryCode + cleanPhone.slice(1);
          } else {
            cleanPhone = phoneCountryCode + cleanPhone;
          }
        }

        const res = await authApi.register({
          username: username.trim(),
          role,
          contactInfo: cleanPhone,
          phoneNumber: cleanPhone,
          pinHash: pin.trim(),
        });
        const userObj = res.data?.user || (res as any).user;
        if (!userObj) {
          throw new Error('Account created but user profile was not received.');
        }
        await client.setToken(res.token);
        setSuccessMsg('Profile initialized successfully. Entering sanctuary...');
        hapticService.triggerNourishSuccess();
        setTimeout(() => onAuthSuccess(userObj), 400);
      }
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('Network request failed') || msg.includes('ConnectException')) {
        setErrorMsg(
          `Cannot reach backend at ${serverUrl}. Ensure the backend server is running and MongoDB is started.`
        );
      } else {
        setErrorMsg(msg || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Color schemes for background, card, and wave
  const heroGradient = isDark
    ? (['#030712', '#07101E', '#0D1B33'] as const)
    : (['#BAE6FD', '#DDF0FD', '#F0F9FF'] as const);

  const cardBg = isDark ? '#0D131F' : '#FFFFFF';
  const inputBg = isDark ? '#141C2B' : '#F8FAFC';
  const inputBorder = isDark ? 'rgba(0, 123, 167, 0.3)' : '#E2E8F0';

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: isDark ? '#030712' : '#F0F9FF' }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Hero Section: Atmospheric Medical Gradient & Animations */}
        <LinearGradient
          colors={heroGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.heroSection}
        >
          {/* Top Floating Control Bar */}
          <View style={styles.topControlBar}>
            {/* Server Connectivity Status Pill */}
            <TouchableOpacity
              style={[
                styles.serverPill,
                {
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.35)' : '#CBD5E1',
                },
              ]}
              onPress={() => setShowServerConfig(!showServerConfig)}
            >
              <View
                style={[
                  styles.statusDot,
                  connStatus === 'connected' && { backgroundColor: theme.emerald },
                  connStatus === 'checking' && { backgroundColor: theme.amberWarning },
                  connStatus === 'error' && { backgroundColor: theme.alert },
                ]}
              />
              <Text style={[styles.serverPillText, { color: theme.textSecondary }]} numberOfLines={1}>
                {connStatus === 'connected' ? 'API Live' : connMessage}
              </Text>
              {showServerConfig ? (
                <ChevronUp size={12} color={theme.primaryLight} />
              ) : (
                <ChevronDown size={12} color={theme.primaryLight} />
              )}
            </TouchableOpacity>

            {/* Dark / Light Theme Toggle Button */}
            <TouchableOpacity
              style={[
                styles.themeToggleBtn,
                {
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.35)' : '#CBD5E1',
                },
              ]}
              onPress={toggleTheme}
              accessibilityLabel="Toggle Theme"
            >
              {isDark ? (
                <Sun size={15} color="#F59E0B" />
              ) : (
                <Moon size={15} color={theme.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Expandable Server Config Drawer */}
          {showServerConfig && (
            <View
              style={[
                styles.serverConfigBox,
                {
                  backgroundColor: isDark ? '#0D131F' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.35)' : '#E2E8F0',
                },
              ]}
            >
              <Text style={[styles.serverConfigLabel, { color: theme.textMuted }]}>
                Backend Server Endpoint
              </Text>
              <View style={styles.serverInputRow}>
                <TextInput
                  style={[
                    styles.serverInput,
                    {
                      backgroundColor: isDark ? '#0A0E15' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : '#CBD5E1',
                      color: theme.textPrimary,
                    },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                  ]}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="http://192.168.1.100:5000"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.serverApplyBtn, { backgroundColor: theme.primary }]}
                  onPress={() => handleApplyServerUrl(serverUrl)}
                >
                  <Text style={styles.serverApplyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.serverActionRow}>
                <TouchableOpacity style={styles.autoDetectBtn} onPress={handleResetToAutoDetected}>
                  <RefreshCw size={12} color={theme.primaryLight} />
                  <Text style={[styles.autoDetectBtnText, { color: theme.primaryLight }]}>
                    Auto-detect Host IP
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Hero Brand & Doctor Illustration Centerpiece */}
          <View style={styles.heroBrandCenter}>
            {/* Glowing Brand Insignia Pill */}
            <View
              style={[
                styles.logoBadgeCard,
                {
                  backgroundColor: isDark ? 'rgba(10, 15, 26, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.45)' : '#BAE6FD',
                  shadowColor: isDark ? '#007BA7' : '#0284C7',
                },
              ]}
            >
              <Image
                source={require('../../assets/MediAlertLogo.png')}
                style={styles.heroLogoImage}
                resizeMode="contain"
              />
            </View>

            {/* Clinical Protocol Pill */}
            <View
              style={[
                styles.heroProtocolPill,
                {
                  backgroundColor: isDark ? 'rgba(0, 123, 167, 0.22)' : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#BAE6FD',
                },
              ]}
            >
              <View style={[styles.pulseDot, { backgroundColor: theme.emerald }]} />
              <Text style={[styles.heroProtocolText, { color: theme.primaryLight }]}>
                CLINICAL ADHERENCE SAFETY NET
              </Text>
            </View>

            {/* Doctor Looking at Report Illustration */}
            <View style={styles.doctorWrap}>
              {/* Soft Ambient Radial Halo */}
              <View
                style={[
                  styles.ambientAura,
                  {
                    backgroundColor: isDark ? 'rgba(0, 123, 167, 0.2)' : 'rgba(186, 230, 253, 0.65)',
                  },
                ]}
              />
              <DoctorIllustration width={220} height={195} style={styles.doctorIllustration} />
            </View>
          </View>

          {/* Majestic Asymmetric Wave Divider */}
          <View style={styles.waveContainer}>
            <Svg
              width="100%"
              height={70}
              viewBox="0 0 400 70"
              preserveAspectRatio="none"
              style={styles.waveSvg}
            >
              {/* Solid fill blending seamlessly into form sheet */}
              <Path
                d="M0,48 C140,78 260,10 400,22 L400,70 L0,70 Z"
                fill={cardBg}
              />
              {/* Illuminated luminous glowing contour crest */}
              <Path
                d="M0,48 C140,78 260,10 400,22"
                fill="none"
                stroke={isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(0, 123, 167, 0.22)'}
                strokeWidth={2.5}
              />
            </Svg>
          </View>
        </LinearGradient>

        {/* Main Curved Form Sheet Card */}
        <Animated.View
          style={[
            styles.sheetCard,
            {
              backgroundColor: cardBg,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.2)' : 'transparent',
              shadowColor: isDark ? '#000000' : '#0F172A',
              opacity: cardAnim,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          {/* Top Persona / Role Segmented Controller (User vs Vendor pattern) */}
          <View
            style={[
              styles.segmentedTrack,
              {
                backgroundColor: isDark ? '#141C2B' : '#F1F5F9',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.segmentItem,
                role === 'Patient' && {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 3,
                },
              ]}
              onPress={() => handleRoleSelect('Patient')}
            >
              <Pill
                size={16}
                color={role === 'Patient' ? '#FFFFFF' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: role === 'Patient' ? '#FFFFFF' : theme.textSecondary },
                  role === 'Patient' && styles.segmentTextActive,
                ]}
              >
                Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentItem,
                role === 'Caregiver' && {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 3,
                },
              ]}
              onPress={() => handleRoleSelect('Caregiver')}
            >
              <Users
                size={16}
                color={role === 'Caregiver' ? '#FFFFFF' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: role === 'Caregiver' ? '#FFFFFF' : theme.textSecondary },
                  role === 'Caregiver' && styles.segmentTextActive,
                ]}
              >
                Caregiver
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Header Typography */}
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, { color: theme.textPrimary }]}>
              {isLogin ? 'Welcome Back!' : 'Get Started Free'}
            </Text>
            <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
              {isLogin
                ? 'Sign in to monitor your schedule & botanical sanctuary'
                : 'Free forever. Automatic SMS & clinical safety net.'}
            </Text>
          </View>

          {/* Feedback Status Banners */}
          {errorMsg ? (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: theme.alertContainer,
                  borderColor: theme.alertBorder,
                },
              ]}
            >
              <Text style={[styles.bannerText, { color: theme.alertLight }]}>{errorMsg}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                  borderColor: theme.emerald,
                },
              ]}
            >
              <CheckCircle2 size={16} color={theme.emerald} />
              <Text style={[styles.bannerText, { color: theme.emerald }]}>{successMsg}</Text>
            </View>
          ) : null}

          {/* Input Fields Container */}
          <View style={styles.fieldsContainer}>
            {/* Field 1: Username / Patient ID */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Username or Patient ID
              </Text>
              <View
                style={[
                  styles.inputFieldContainer,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                  },
                ]}
              >
                <View style={styles.inputPrefixIcon}>
                  <UserIcon size={18} color={theme.primaryLight} />
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    { color: theme.textPrimary },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                  ]}
                  placeholder={role === 'Caregiver' ? 'e.g. caregiver1' : 'e.g. patient1'}
                  placeholderTextColor={theme.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Field 2: Emergency Contact Phone (on Sign Up) */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Emergency Phone (SMS Escalation)
                </Text>
                <View
                  style={[
                    styles.inputFieldContainer,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                    },
                  ]}
                >
                  <View style={styles.inputPrefixIcon}>
                    <Phone size={18} color={theme.primaryLight} />
                  </View>
                  <View
                    style={[
                      styles.countryCodeBadge,
                      {
                        backgroundColor: isDark ? '#1F2A3E' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.countryCodeText, { color: theme.textPrimary }]}>
                      {phoneCountryCode}
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.textInput,
                      { color: theme.textPrimary },
                      Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                    ]}
                    placeholder="712 345 678"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="phone-pad"
                    value={contactInfo}
                    onChangeText={setContactInfo}
                  />
                </View>
                <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                  Used for real-time fallback SMS alerts if a critical dose is overdue.
                </Text>
              </View>
            )}

            {/* Field 3: Security PIN / Passcode */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Security PIN
              </Text>
              <View
                style={[
                  styles.inputFieldContainer,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                  },
                ]}
              >
                <View style={styles.inputPrefixIcon}>
                  <KeyRound size={18} color={theme.primaryLight} />
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    { color: theme.textPrimary },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                  ]}
                  placeholder="Enter 4-6 digit PIN"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPin}
                  keyboardType="numeric"
                  maxLength={6}
                  value={pin}
                  onChangeText={setPin}
                />
                <TouchableOpacity
                  style={styles.eyeToggleBtn}
                  onPress={() => {
                    hapticService.selection();
                    setShowPin(!showPin);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Toggle PIN Visibility"
                >
                  {showPin ? (
                    <EyeOff size={18} color={theme.textSecondary} />
                  ) : (
                    <Eye size={18} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Password / PIN Help Row */}
              <View style={styles.pinHelperRow}>
                <View style={styles.pinSecurityBadge}>
                  <View style={[styles.greenDot, { backgroundColor: theme.emerald }]} />
                  <Text style={[styles.pinSecurityText, { color: theme.textMuted }]}>
                    End-to-End Encrypted
                  </Text>
                </View>

                {isLogin && (
                  <TouchableOpacity onPress={handleForgotPin} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={[styles.forgotPinText, { color: theme.primaryLight }]}>
                      Forgot PIN?
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* High-Impact Gradient Action Button */}
          <TouchableOpacity
            style={styles.actionBtnWrap}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={
                isDark
                  ? (['#007BA7', '#0284C7'] as const)
                  : (['#007BA7', '#0369A1'] as const)
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.actionBtnText}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#232D3F' : '#E2E8F0' }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>
              Or Quick Demo Access
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#232D3F' : '#E2E8F0' }]} />
          </View>

          {/* Quick Demo Pre-fill Cards */}
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={[
                styles.demoBtn,
                {
                  backgroundColor: isDark ? '#141C2B' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : '#CBD5E1',
                },
              ]}
              onPress={() => handleQuickDemo('patient1')}
            >
              <Pill size={15} color={theme.primaryLight} />
              <Text style={[styles.demoBtnText, { color: theme.textPrimary }]}>
                Patient Demo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.demoBtn,
                {
                  backgroundColor: isDark ? '#141C2B' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : '#CBD5E1',
                },
              ]}
              onPress={() => handleQuickDemo('caregiver1')}
            >
              <Users size={15} color={theme.emerald} />
              <Text style={[styles.demoBtnText, { color: theme.textPrimary }]}>
                Caregiver Demo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Switcher: Sign In vs Sign Up */}
          <View style={styles.footerSwitchRow}>
            <Text style={[styles.footerPromptText, { color: theme.textSecondary }]}>
              {isLogin ? "Don't have an account?" : 'Already have a clinical profile?'}
            </Text>
            <TouchableOpacity onPress={() => handleTabSwitch(!isLogin)}>
              <Text style={[styles.footerActionText, { color: theme.primaryLight }]}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Footnote */}
          <View style={styles.securityFootnote}>
            <ShieldCheck size={13} color={theme.emerald} />
            <Text style={[styles.securityFootnoteText, { color: theme.textMuted }]}>
              MediAlert Clinical Adherence Protocol • Secure Local Data
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 20,
    paddingBottom: 0,
    alignItems: 'center',
    position: 'relative',
    minHeight: 350,
  },
  topControlBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 10,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 7,
    maxWidth: '75%',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  serverPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverConfigBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    zIndex: 20,
  },
  serverConfigLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  serverInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serverInput: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  serverApplyBtn: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverApplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  serverActionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  autoDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  autoDetectBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  heroBrandCenter: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    position: 'relative',
  },
  ambientAura: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  doctorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 4,
    marginBottom: -14,
    zIndex: 5,
  },
  doctorIllustration: {
    width: 220,
    height: 195,
  },
  logoBadgeCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  heroLogoImage: {
    width: 130,
    height: 42,
  },
  heroProtocolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroProtocolText: {
    fontFamily: typography.extraBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardiogramWrap: {
    width: '100%',
    alignItems: 'center',
    height: 24,
    marginBottom: 6,
  },
  waveContainer: {
    width: '100%',
    height: 70,
    marginTop: 'auto',
  },
  waveSvg: {
    width: '100%',
    height: 70,
  },
  sheetCard: {
    flex: 1,
    marginTop: -2,
    borderWidth: 1,
    borderTopWidth: 0,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 40,
  },
  segmentedTrack: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    padding: 3,
    marginBottom: 20,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    gap: 7,
  },
  segmentText: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontFamily: typography.extraBold,
    fontWeight: '800',
  },
  formHeader: {
    marginBottom: 20,
  },
  formTitle: {
    fontFamily: typography.extraBold,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  formSubtitle: {
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  bannerText: {
    fontFamily: typography.medium,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  fieldsContainer: {
    gap: 16,
    marginBottom: 22,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  inputPrefixIcon: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: typography.medium,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  countryCodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  countryCodeText: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  eyeToggleBtn: {
    padding: 6,
    marginLeft: 6,
  },
  fieldHint: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  pinHelperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  pinSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pinSecurityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  forgotPinText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnWrap: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#007BA7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontFamily: typography.extraBold,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: typography.semiBold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  demoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  demoBtnText: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  footerSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  footerPromptText: {
    fontFamily: typography.medium,
    fontSize: 13,
    fontWeight: '500',
  },
  footerActionText: {
    fontFamily: typography.extraBold,
    fontSize: 13,
    fontWeight: '800',
  },
  securityFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityFootnoteText: {
    fontFamily: typography.medium,
    fontSize: 11,
    fontWeight: '500',
  },
});
