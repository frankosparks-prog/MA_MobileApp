import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Phone,
  UserPlus,
  ShieldCheck,
  BellRing,
  HeartHandshake,
  MessageSquare,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { CaregiverAlert, User } from '../types';
import { adherenceApi, authApi } from '../api';
import { typography } from '../theme/typography';
import hapticService from '../services/hapticService';

interface CaregiverHubScreenProps {
  user: User;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const CaregiverHubScreen: React.FC<CaregiverHubScreenProps> = ({ user, showToast }) => {
  const { theme, isDark } = useTheme();
  const [alerts, setAlerts] = useState<CaregiverAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [userProfile, setUserProfile] = useState<User>(user);

  const fetchAlertsAndProfile = async () => {
    try {
      const [alertsRes, profileRes] = await Promise.all([
        adherenceApi.getCaregiverAlerts(),
        authApi.getProfile(),
      ]);

      if (alertsRes.data?.alerts) {
        setAlerts(alertsRes.data.alerts);
      }
      if (profileRes.data?.user) {
        setUserProfile(profileRes.data.user);
      }
    } catch (e: any) {
      console.log('Error refreshing caregiver hub:', e.message);
    }
  };

  useEffect(() => {
    fetchAlertsAndProfile();
  }, []);

  const onRefresh = async () => {
    hapticService.selection();
    setRefreshing(true);
    await fetchAlertsAndProfile();
    setRefreshing(false);
  };

  const handleAcknowledge = async (alertId: string) => {
    hapticService.triggerNourishSuccess();
    try {
      await adherenceApi.acknowledgeAlert(alertId);
      showToast('success', 'Alert acknowledged! Fallback SMS cancelled.');
      await fetchAlertsAndProfile();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to acknowledge alert.');
    }
  };

  const handleLinkByPhone = async () => {
    hapticService.selection();
    const cleanPhone = phoneInput.trim();
    if (!cleanPhone) {
      showToast('error', 'Please enter a valid phone number or username.');
      return;
    }

    setIsLinking(true);
    try {
      const res = await authApi.associate(cleanPhone);
      if (res.data?.user) {
        setUserProfile(res.data.user);
      }
      hapticService.triggerNourishSuccess();
      showToast('success', `Linked contact with ${cleanPhone}!`);
      setPhoneInput('');
      await fetchAlertsAndProfile();
    } catch (e: any) {
      showToast('error', e.message || 'Could not link caregiver/contact.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleCall = (phoneNum: string) => {
    hapticService.selection();
    if (phoneNum) {
      Linking.openURL(`tel:${phoneNum}`).catch(() => {
        showToast('error', 'Unable to initiate call.');
      });
    }
  };

  // Extract connected users
  const associatedList = (userProfile.associatedUsers || []) as any[];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primaryLight}
          />
        }
      >
        {/* ============================================================== */}
        {/* HERO SECTION: Circle of Care Overview */}
        {/* ============================================================== */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.32)' : '#BAE6FD',
              shadowColor: theme.primary,
            },
          ]}
        >
          {/* Top Network Protocol Tag */}
          <View style={styles.heroTopProtocolRow}>
            <View style={styles.protocolTitleRow}>
              <View
                style={[
                  styles.protocolIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0, 123, 167, 0.2)'
                      : theme.primaryContainer,
                  },
                ]}
              >
                <HeartHandshake size={15} color={theme.primaryLight} strokeWidth={2.4} />
              </View>
              <Text style={[styles.protocolLabel, { color: theme.textPrimary }]}>
                Caregiver Safety Circle
              </Text>
            </View>

            <View
              style={[
                styles.safetyPillBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(16, 185, 129, 0.12)'
                    : '#ECFDF5',
                  borderColor: isDark
                    ? 'rgba(16, 185, 129, 0.28)'
                    : '#A7F3D0',
                },
              ]}
            >
              <View style={[styles.safetyPillDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.safetyPillText, { color: '#059669' }]}>
                SMS Active
              </Text>
            </View>
          </View>

          {/* Hero Greeting & Icon Header */}
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroTextColumn}>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                Circle of Care
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Automated multi-tier notification & SMS fallback safety net
              </Text>
            </View>

            <View
              style={[
                styles.heroAvatarBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(0, 123, 167, 0.18)'
                    : theme.primaryContainer,
                  borderColor: isDark
                    ? 'rgba(56, 189, 248, 0.3)'
                    : '#BAE6FD',
                },
              ]}
            >
              <Users size={26} color={theme.primaryLight} strokeWidth={2.2} />
            </View>
          </View>

          {/* 3 Metric Clinical Telemetry Badges */}
          <View style={styles.metricsRow}>
            {/* 1. Connected Contacts */}
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: isDark ? '#101E2E' : '#F0F9FF',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : '#E0F2FE',
                },
              ]}
            >
              <Text style={[styles.metricValue, { color: isDark ? '#38BDF8' : '#0369A1' }]}>
                {associatedList.length}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Contacts
              </Text>
            </View>

            {/* 2. SMS Fallback Mode */}
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: isDark ? '#0C221A' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.22)' : '#D1FAE5',
                },
              ]}
            >
              <Text style={[styles.metricValue, { color: '#10B981' }]}>
                SMS Ready
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Fallback Mode
              </Text>
            </View>

            {/* 3. Auto-Escalation Tiers */}
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: isDark ? '#1F1710' : '#FFFBEB',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.22)' : '#FEF3C7',
                },
              ]}
            >
              <Text style={[styles.metricValue, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                3 Tiers
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Auto-Escalation
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================== */}
        {/* LINK VIA PHONE NUMBER CARD */}
        {/* ============================================================== */}
        <View
          style={[
            styles.linkCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : theme.border,
              shadowColor: theme.primary,
            },
          ]}
        >
          <View style={styles.linkHeader}>
            <View
              style={[
                styles.linkIconCircle,
                {
                  backgroundColor: isDark
                    ? 'rgba(0, 123, 167, 0.18)'
                    : theme.primaryContainer,
                },
              ]}
            >
              <Phone size={16} color={theme.primaryLight} strokeWidth={2.4} />
            </View>
            <Text style={[styles.linkTitle, { color: theme.textPrimary }]}>
              Connect via Mobile Phone Number
            </Text>
          </View>
          <Text style={[styles.linkSubtext, { color: theme.textSecondary }]}>
            Enter your caregiver or patient's registered phone number (e.g. +254... or 07...).
          </Text>

          <View style={styles.linkRow}>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#090E17' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#CBD5E1',
                },
              ]}
            >
              <Phone size={15} color={theme.textSubtle} style={{ marginRight: 8 }} />
              <TextInput
                style={[
                  styles.linkInput,
                  {
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="+254712345678 or username"
                placeholderTextColor={theme.textSubtle}
                value={phoneInput}
                onChangeText={setPhoneInput}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.linkBtn,
                {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                },
                isLinking && styles.linkBtnDisabled,
              ]}
              onPress={handleLinkByPhone}
              disabled={isLinking}
              activeOpacity={0.8}
            >
              {isLinking ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <UserPlus size={15} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.linkBtnText}>Connect</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* CONNECTED CONTACTS SECTION */}
        {/* ============================================================== */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleGroup}>
            <Users size={18} color={theme.primaryLight} strokeWidth={2.4} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Connected Contacts
            </Text>
          </View>
          <View
            style={[
              styles.countPillBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(0, 123, 167, 0.18)'
                  : theme.primaryContainer,
                borderColor: isDark
                  ? 'rgba(56, 189, 248, 0.3)'
                  : '#BAE6FD',
              },
            ]}
          >
            <Text style={[styles.countPillText, { color: theme.primaryLight }]}>
              {associatedList.length} Connected
            </Text>
          </View>
        </View>

        {associatedList.length === 0 ? (
          <View
            style={[
              styles.emptyContactsCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.2)' : theme.border,
              },
            ]}
          >
            <Users size={32} color={theme.textSubtle} style={{ marginBottom: 6 }} />
            <Text style={[styles.emptyContactsTitle, { color: theme.textPrimary }]}>
              No Contacts Linked Yet
            </Text>
            <Text style={[styles.emptyContactsText, { color: theme.textSecondary }]}>
              Enter a registered phone number above to connect your caregiver or dependent to this safety net.
            </Text>
          </View>
        ) : (
          <View style={styles.contactsGrid}>
            {associatedList.map((contact, idx) => {
              const name = typeof contact === 'object' ? contact.username : `User #${idx + 1}`;
              const phone =
                typeof contact === 'object' ? contact.phoneNumber || contact.contactInfo : '';
              const contactRole = typeof contact === 'object' ? contact.role : 'Contact';
              const isCaregiver = contactRole.toLowerCase().includes('caregiver');

              // Initials
              const initials = name
                ? name
                    .split(/[\s_]+/)
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'U';

              return (
                <View
                  key={idx}
                  style={[
                    styles.contactItem,
                    {
                      backgroundColor: theme.bgCard,
                      borderColor: isDark ? 'rgba(0, 123, 167, 0.22)' : theme.border,
                      shadowColor: theme.primary,
                    },
                  ]}
                >
                  {/* Left Medical Accent Stripe */}
                  <View
                    style={[
                      styles.cardLeftStripe,
                      {
                        backgroundColor: isCaregiver ? '#10B981' : (isDark ? '#007BA7' : '#0284C7'),
                      },
                    ]}
                  />

                  {/* Avatar Circle with Initials */}
                  <View
                    style={[
                      styles.contactAvatar,
                      {
                        backgroundColor: isCaregiver
                          ? (isDark ? '#064E3B' : '#D1FAE5')
                          : (isDark ? 'rgba(0, 123, 167, 0.22)' : theme.primaryContainer),
                        borderColor: isCaregiver
                          ? '#10B981'
                          : (isDark ? 'rgba(56, 189, 248, 0.35)' : '#BAE6FD'),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarInitials,
                        { color: isCaregiver ? '#10B981' : theme.primaryLight },
                      ]}
                    >
                      {initials}
                    </Text>
                  </View>

                  {/* Contact Info Column */}
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: theme.textPrimary }]}>
                      {name}
                    </Text>
                    <View style={styles.phoneRow}>
                      <Phone size={12} color={theme.textSecondary} />
                      <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>
                        {phone || 'No phone recorded'}
                      </Text>
                    </View>
                  </View>

                  {/* Role Badge & Call Shortcut */}
                  <View style={styles.contactActionsCol}>
                    <View
                      style={[
                        styles.contactBadge,
                        {
                          backgroundColor: isCaregiver
                            ? (isDark ? '#06281E' : '#ECFDF5')
                            : (isDark ? '#102235' : '#F0F9FF'),
                          borderColor: isCaregiver
                            ? 'rgba(16, 185, 129, 0.3)'
                            : (isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD'),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.contactBadgeText,
                          { color: isCaregiver ? '#10B981' : theme.primaryLight },
                        ]}
                      >
                        {contactRole || 'Dependant'}
                      </Text>
                    </View>

                    {phone ? (
                      <TouchableOpacity
                        style={[
                          styles.callMiniBtn,
                          {
                            backgroundColor: isDark
                              ? 'rgba(0, 123, 167, 0.18)'
                              : theme.primaryContainer,
                          },
                        ]}
                        onPress={() => handleCall(phone)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Phone size={13} color={theme.primaryLight} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ============================================================== */}
        {/* ACTIVE ESCALATION ALERTS SECTION */}
        {/* ============================================================== */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View style={styles.sectionTitleGroup}>
            <BellRing size={18} color={alerts.length > 0 ? '#EF4444' : theme.emerald} strokeWidth={2.4} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Active Escalation Alerts
            </Text>
          </View>
          <View
            style={[
              styles.countPillBadge,
              {
                backgroundColor: alerts.length > 0
                  ? (isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEE2E2')
                  : (isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5'),
                borderColor: alerts.length > 0
                  ? (isDark ? 'rgba(239, 68, 68, 0.32)' : '#FECACA')
                  : (isDark ? 'rgba(16, 185, 129, 0.28)' : '#A7F3D0'),
              },
            ]}
          >
            <Text
              style={[
                styles.countPillText,
                { color: alerts.length > 0 ? '#EF4444' : '#10B981' },
              ]}
            >
              {alerts.length} Active
            </Text>
          </View>
        </View>

        {alerts.length === 0 ? (
          <View
            style={[
              styles.healthyStateCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0',
                shadowColor: '#10B981',
              },
            ]}
          >
            <View
              style={[
                styles.healthyIconCircle,
                {
                  backgroundColor: isDark
                    ? 'rgba(16, 185, 129, 0.15)'
                    : '#DCFCE7',
                },
              ]}
            >
              <CheckCircle2 size={24} color="#10B981" strokeWidth={2.3} />
            </View>
            <Text style={[styles.healthyStateTitle, { color: theme.textPrimary }]}>
              All Prescriptions on Track
            </Text>
            <Text style={[styles.healthyStateSubtext, { color: theme.textSecondary }]}>
              No missed doses or urgent escalations pending for your connected circle.
            </Text>
          </View>
        ) : (
          alerts.map((alert) => {
            const patientName = alert.patientId?.username || 'Patient';
            const isAcknowledged = alert.status === 'ACKNOWLEDGED';

            return (
              <View
                key={alert._id}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: theme.bgCard,
                    borderColor: isAcknowledged
                      ? theme.border
                      : (isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA'),
                    shadowColor: '#EF4444',
                  },
                ]}
              >
                {/* Left Alert Accent Stripe */}
                <View
                  style={[
                    styles.cardLeftStripe,
                    {
                      backgroundColor: isAcknowledged ? '#10B981' : '#EF4444',
                    },
                  ]}
                />

                <View style={styles.alertContent}>
                  <View style={styles.alertTop}>
                    <View style={styles.patientInfo}>
                      <AlertTriangle
                        size={18}
                        color={isAcknowledged ? theme.emerald : '#EF4444'}
                        strokeWidth={2.3}
                      />
                      <View>
                        <Text style={[styles.patientName, { color: theme.textPrimary }]}>
                          {patientName}
                        </Text>
                        <Text
                          style={[
                            styles.alertStatusText,
                            { color: isAcknowledged ? theme.emerald : '#EF4444' },
                          ]}
                        >
                          Status: {alert.status}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.phoneTag,
                        {
                          backgroundColor: isDark ? '#192230' : theme.primaryContainer,
                          borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD',
                        },
                      ]}
                    >
                      <Phone size={12} color={theme.primaryLight} />
                      <Text style={[styles.phoneTagText, { color: theme.primaryLight }]}>
                        {alert.recipientPhone}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.alertMsg, { color: theme.textSecondary }]}>
                    {patientName} missed confirmation window. Fallback SMS dispatched to {alert.recipientPhone}.
                  </Text>

                  <View style={styles.alertFooter}>
                    {isAcknowledged ? (
                      <View
                        style={[
                          styles.acknowledgedBadge,
                          {
                            backgroundColor: isDark
                              ? 'rgba(16, 185, 129, 0.15)'
                              : '#DCFCE7',
                          },
                        ]}
                      >
                        <CheckCircle2 size={14} color="#10B981" />
                        <Text style={[styles.acknowledgedText, { color: '#059669' }]}>
                          Acknowledged • SMS Fallback Closed
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.ackBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => handleAcknowledge(alert._id)}
                        activeOpacity={0.8}
                      >
                        <ShieldCheck size={16} color="#FFFFFF" strokeWidth={2.3} />
                        <Text style={styles.ackBtnText}>Acknowledge & Cancel SMS</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 48,
  },
  // ==============================================================
  // HERO CARD
  // ==============================================================
  heroCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTopProtocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  protocolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  protocolIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolLabel: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  safetyPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  safetyPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  safetyPillText: {
    fontFamily: typography.bold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroTextColumn: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitle: {
    fontFamily: typography.extraBold,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontFamily: typography.regular,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  heroAvatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontFamily: typography.extraBold,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: typography.medium,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  // ==============================================================
  // LINK VIA PHONE CARD
  // ==============================================================
  linkCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  linkIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: {
    fontFamily: typography.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  linkSubtext: {
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  linkInput: {
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 13,
    paddingVertical: 0,
  },
  linkBtn: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  linkBtnDisabled: {
    opacity: 0.6,
  },
  linkBtnText: {
    fontFamily: typography.bold,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  // ==============================================================
  // SECTION HEADERS
  // ==============================================================
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  countPillBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  countPillText: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  // ==============================================================
  // EMPTY STATE
  // ==============================================================
  emptyContactsCard: {
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyContactsTitle: {
    fontFamily: typography.bold,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyContactsText: {
    fontFamily: typography.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  // ==============================================================
  // CONTACTS LIST
  // ==============================================================
  contactsGrid: {
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeftStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: typography.extraBold,
    fontSize: 14,
    fontWeight: '800',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontFamily: typography.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  contactPhone: {
    fontFamily: typography.medium,
    fontSize: 12,
    fontWeight: '500',
  },
  contactActionsCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  contactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactBadgeText: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  callMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ==============================================================
  // HEALTHY STATE / ALERTS
  // ==============================================================
  healthyStateCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  healthyIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  healthyStateTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  healthyStateSubtext: {
    fontFamily: typography.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  alertCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  alertContent: {
    padding: 16,
    paddingLeft: 18,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  patientName: {
    fontFamily: typography.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  alertStatusText: {
    fontFamily: typography.semiBold,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  phoneTagText: {
    fontFamily: typography.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  alertMsg: {
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 10,
  },
  alertFooter: {
    marginTop: 4,
  },
  ackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ackBtnText: {
    fontFamily: typography.bold,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  acknowledgedText: {
    fontFamily: typography.bold,
    fontSize: 12,
    fontWeight: '700',
  },
});
