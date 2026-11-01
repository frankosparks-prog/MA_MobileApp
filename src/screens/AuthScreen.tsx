import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  ShieldCheck,
  Server,
  RefreshCw,
  ArrowRight,
  Phone,
  Lock,
  User as UserIcon,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Pill,
  Users,
  LogIn,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Activity,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Floating Controls: Theme Switcher & Telemetry Pill */}
        <View style={styles.topControlBar}>
          {/* Server status pill */}
          <TouchableOpacity
            style={[
              styles.serverPill,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.28)' : theme.border,
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
              {connStatus === 'connected' ? 'API Online' : connMessage} ({serverUrl.replace(/^https?:\/\//, '')})
            </Text>
            {showServerConfig ? (
              <ChevronUp size={13} color={theme.primaryLight} />
            ) : (
              <ChevronDown size={13} color={theme.primaryLight} />
            )}
          </TouchableOpacity>

          {/* Theme Mode Toggle Button */}
          <TouchableOpacity
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.28)' : theme.border,
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
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : theme.border,
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

        {/* Clinical Branding Module from Stitch AI */}
        <View style={styles.brandingModule}>
          {/* Logo with Atmospheric Glow Ring */}
          <View
            style={[
              styles.logoRingWrapper,
              {
                borderColor: theme.primaryLight,
                backgroundColor: isDark ? '#090D14' : '#FFFFFF',
                shadowColor: theme.primary,
              },
            ]}
          >
            <Image
              source={require('../../assets/MediAlert_Logo.jpeg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Protocol Badge Pill */}
          <View
            style={[
              styles.protocolPill,
              {
                backgroundColor: theme.primaryContainer,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.35)' : '#BAE6FD',
              },
            ]}
          >
            <View style={[styles.protocolDot, { backgroundColor: theme.alert }]} />
            <Text style={[styles.protocolText, { color: theme.primaryLight }]}>
              CLINICAL ADHERENCE PROTOCOL • SAFETY NET
            </Text>
          </View>

          {/* App Title */}
          <Text style={[styles.brandTitleText, { color: theme.textPrimary }]}>
            MEDIALERT
          </Text>

          {/* Cardiogram Waveform Line (Stitch SVG Waveform) */}
          <View style={styles.waveformContainer}>
            <Svg width="100%" height={26} viewBox="0 0 320 28" fill="none">
              <Path
                d="M0 14 L80 14 L95 14 L102 3 L108 25 L116 8 L124 19 L130 14 L145 14 L170 14 L185 14 L192 1 L198 27 L206 6 L214 21 L220 14 L245 14 L320 14"
                stroke={theme.primaryLight}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            </Svg>
          </View>
        </View>

        {/* Clinical Segmented Controller (Tab Switcher) */}
        <View
          style={[
            styles.segmentedTrack,
            {
              backgroundColor: isDark ? '#090D14' : '#F1F5F9',
              borderColor: isDark ? '#1C2533' : '#E2E8F0',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              isLogin && [
                styles.segmentBtnActive,
                {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                },
              ],
            ]}
            onPress={() => handleTabSwitch(true)}
          >
            <LogIn size={15} color={isLogin ? '#FFFFFF' : theme.textMuted} />
            <Text
              style={[
                styles.segmentBtnText,
                { color: isLogin ? '#FFFFFF' : theme.textMuted },
                isLogin && styles.segmentBtnTextActive,
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              !isLogin && [
                styles.segmentBtnActive,
                {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                },
              ],
            ]}
            onPress={() => handleTabSwitch(false)}
          >
            <UserPlus size={15} color={!isLogin ? '#FFFFFF' : theme.textMuted} />
            <Text
              style={[
                styles.segmentBtnText,
                { color: !isLogin ? '#FFFFFF' : theme.textMuted },
                !isLogin && styles.segmentBtnTextActive,
              ]}
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Banners */}
        {errorMsg ? (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor: theme.alertContainer,
                borderColor: theme.alertBorder,
              },
            ]}
          >
            <Text style={[styles.feedbackText, { color: theme.alert }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.14)' : '#DCFCE7',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#BBF7D0',
              },
            ]}
          >
            <CheckCircle2 size={16} color={theme.emerald} style={{ marginRight: 6 }} />
            <Text style={[styles.feedbackText, { color: theme.emerald }]}>{successMsg}</Text>
          </View>
        ) : null}

        {/* Glassmorphic Credential Card */}
        <View
          style={[
            styles.credentialCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.32)' : theme.border,
              shadowColor: theme.primary,
            },
          ]}
        >
          {/* Field 1: Username / Clinical Identifier */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                USERNAME
              </Text>
              <Text style={[styles.fieldTag, { color: theme.primaryLight }]}>
                REQUIRED
              </Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#0A0E15' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : '#CBD5E1',
                },
              ]}
            >
              <UserIcon size={18} color={theme.primaryLight} style={styles.inputPrefixIcon} />
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                value={username}
                onChangeText={setUsername}
                placeholder="e.g. alex.mercer or dr.miller"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Field 2: Emergency Contact Telemetry (Phone Number - Shown on Sign Up) */}
          {!isLogin && (
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  PHONE NUMBER (SMS SAFETY NET)
                </Text>
                <Text style={[styles.fieldTag, { color: theme.alertLight }]}>
                  TIER 1
                </Text>
              </View>
              <View style={styles.phoneInputRow}>
                {/* Country Dial Badge */}
                <View
                  style={[
                    styles.countryCodeBadge,
                    {
                      backgroundColor: isDark ? '#111827' : theme.primaryContainer,
                      borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : '#BAE6FD',
                    },
                  ]}
                >
                  <Text style={[styles.countryCodeLabel, { color: theme.primaryLight }]}>
                    KE
                  </Text>
                  <Text style={[styles.countryCodeVal, { color: theme.textPrimary }]}>
                    +254
                  </Text>
                </View>

                {/* Line Input */}
                <View
                  style={[
                    styles.inputWrapper,
                    styles.phoneInputWrap,
                    {
                      backgroundColor: isDark ? '#0A0E15' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : '#CBD5E1',
                    },
                  ]}
                >
                  <Phone size={17} color={theme.primaryLight} style={styles.inputPrefixIcon} />
                  <TextInput
                    style={[styles.textInput, { color: theme.textPrimary }]}
                    value={contactInfo}
                    onChangeText={setContactInfo}
                    placeholder="712 345 678"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <Text style={[styles.helperNote, { color: theme.textMuted }]}>
                Receives automatic SMS fallback notifications if doses are missed.
              </Text>
            </View>
          )}

          {/* Field 3: Cryptographic Access Key (PIN / Password) */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                SECURITY PIN / PASSWORD
              </Text>
              {isLogin && (
                <TouchableOpacity onPress={() => alert('Please contact your clinic administrator to reset your PIN.')}>
                  <Text style={[styles.forgotLink, { color: theme.primaryLight }]}>
                    FORGOT PIN?
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#0A0E15' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : '#CBD5E1',
                },
              ]}
            >
              <Lock size={18} color={theme.primaryLight} style={styles.inputPrefixIcon} />
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                value={pin}
                onChangeText={setPin}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPin}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPin(!showPin)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showPin ? (
                  <EyeOff size={18} color={theme.textMuted} />
                ) : (
                  <Eye size={18} color={theme.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Field 4: Clinical Station Role Selection (Shown on Sign Up) */}
          {!isLogin && (
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  SELECT MANDATE (ROLE)
                </Text>
                <Text style={[styles.fieldTag, { color: theme.primaryLight }]}>
                  CHOOSE ONE
                </Text>
              </View>

              <View style={styles.roleCardsGrid}>
                {/* Patient Persona Card */}
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: isDark ? '#0A0E15' : '#F8FAFC',
                      borderColor: isDark ? '#1F2937' : '#E2E8F0',
                    },
                    role === 'Patient' && [
                      styles.roleCardSelected,
                      {
                        backgroundColor: isDark ? 'rgba(0, 123, 167, 0.16)' : '#E0F2FE',
                        borderColor: theme.primary,
                      },
                    ],
                  ]}
                  onPress={() => handleRoleSelect('Patient')}
                  activeOpacity={0.85}
                >
                  <View style={styles.roleCardHeader}>
                    <View
                      style={[
                        styles.roleIconWrap,
                        {
                          backgroundColor:
                            role === 'Patient' ? theme.primaryContainer : isDark ? '#131B28' : '#F1F5F9',
                        },
                      ]}
                    >
                      <Pill size={18} color={role === 'Patient' ? theme.primaryLight : theme.textMuted} />
                    </View>
                    {role === 'Patient' ? (
                      <CheckCircle2 size={18} color={theme.primaryLight} />
                    ) : (
                      <Circle size={18} color={theme.textMuted} />
                    )}
                  </View>
                  <Text style={[styles.roleCardTitle, { color: theme.textPrimary }]}>
                    Patient
                  </Text>
                  <Text style={[styles.roleCardSubtext, { color: theme.textMuted }]}>
                    Regimen Intake & Milestones
                  </Text>
                </TouchableOpacity>

                {/* Caregiver Persona Card */}
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: isDark ? '#0A0E15' : '#F8FAFC',
                      borderColor: isDark ? '#1F2937' : '#E2E8F0',
                    },
                    role === 'Caregiver' && [
                      styles.roleCardSelected,
                      {
                        backgroundColor: isDark ? 'rgba(0, 123, 167, 0.16)' : '#E0F2FE',
                        borderColor: theme.primary,
                      },
                    ],
                  ]}
                  onPress={() => handleRoleSelect('Caregiver')}
                  activeOpacity={0.85}
                >
                  <View style={styles.roleCardHeader}>
                    <View
                      style={[
                        styles.roleIconWrap,
                        {
                          backgroundColor:
                            role === 'Caregiver' ? theme.primaryContainer : isDark ? '#131B28' : '#F1F5F9',
                        },
                      ]}
                    >
                      <Users size={18} color={role === 'Caregiver' ? theme.primaryLight : theme.textMuted} />
                    </View>
                    {role === 'Caregiver' ? (
                      <CheckCircle2 size={18} color={theme.primaryLight} />
                    ) : (
                      <Circle size={18} color={theme.textMuted} />
                    )}
                  </View>
                  <Text style={[styles.roleCardTitle, { color: theme.textPrimary }]}>
                    Caregiver
                  </Text>
                  <Text style={[styles.roleCardSubtext, { color: theme.textMuted }]}>
                    Monitor, Triage & Escalation
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Primary Action Button (High-Impact Pill Button) */}
          <TouchableOpacity
            style={[
              styles.primaryAuthBtn,
              { backgroundColor: theme.primary },
              isLoading && styles.btnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.primaryAuthBtnText}>Verifying Telemetry...</Text>
              </View>
            ) : (
              <View style={styles.btnLoadingRow}>
                <Text style={styles.primaryAuthBtnText}>
                  {isLogin ? 'Enter MediAlert Sanctuary' : 'Initialize Clinical Profile'}
                </Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Security / System Footer */}
        <View style={styles.securityFooter}>
          <ShieldCheck size={14} color={theme.primaryLight} />
          <Text style={[styles.securityFooterText, { color: theme.textMuted }]}>
            Encrypted & Secure • MediAlert Clinical Patient Portal
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topControlBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  serverPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  serverPillText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  themeToggleBtn: {
    padding: 8,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverConfigBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  serverConfigLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  serverInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  serverInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
  },
  serverApplyBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  serverApplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  serverActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  autoDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  autoDetectBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  brandingModule: {
    alignItems: 'center',
    marginBottom: 18,
    width: '100%',
  },
  logoRingWrapper: {
    padding: 3,
    borderRadius: 22,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 10,
  },
  logoImage: {
    width: 86,
    height: 68,
    borderRadius: 18,
  },
  protocolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 6,
  },
  protocolDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  protocolText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandTitleText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  waveformContainer: {
    width: '100%',
    maxWidth: 280,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  segmentedTrack: {
    width: '100%',
    maxWidth: 390,
    flexDirection: 'row',
    borderRadius: 30,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 26,
  },
  segmentBtnActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    fontWeight: '800',
  },
  feedbackBanner: {
    width: '100%',
    maxWidth: 390,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  credentialCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  fieldTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  forgotLink: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputPrefixIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
  },
  countryCodeLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  countryCodeVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  phoneInputWrap: {
    flex: 1,
  },
  helperNote: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 2,
    lineHeight: 15,
  },
  roleCardsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  roleCardSelected: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  roleCardSubtext: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
  },
  primaryAuthBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryAuthBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
  },
  securityFooterText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
