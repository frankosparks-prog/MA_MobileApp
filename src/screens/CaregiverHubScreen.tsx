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
} from 'react-native';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Phone,
  UserPlus,
  ShieldCheck,
  BellRing,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { CaregiverAlert, User } from '../types';
import { adherenceApi, authApi } from '../api';

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
    setRefreshing(true);
    await fetchAlertsAndProfile();
    setRefreshing(false);
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await adherenceApi.acknowledgeAlert(alertId);
      showToast('success', 'Alert acknowledged! Fallback SMS cancelled.');
      await fetchAlertsAndProfile();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to acknowledge alert.');
    }
  };

  const handleLinkByPhone = async () => {
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
      showToast('success', `Linked contact with ${cleanPhone}!`);
      setPhoneInput('');
      await fetchAlertsAndProfile();
    } catch (e: any) {
      showToast('error', e.message || 'Could not link caregiver/contact.');
    } finally {
      setIsLinking(false);
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
        {/* Cyber-Medical Safety Net Hero Section */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.35)' : theme.border,
              shadowColor: theme.primary,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.heroShieldBadge,
                {
                  backgroundColor: isDark ? '#111827' : theme.primaryContainer,
                  borderColor: theme.primaryLight,
                },
              ]}
            >
              <ShieldCheck size={26} color={theme.primaryLight} />
              <View style={[styles.heroAlertPulse, { backgroundColor: theme.alert }]} />
            </View>
            <View style={styles.heroTextCol}>
              <View style={styles.heroTagRow}>
                <Text style={[styles.heroTagText, { color: theme.primaryLight }]}>
                  SAFETY NET GUARD
                </Text>
                <View
                  style={[
                    styles.heroStatusChip,
                    {
                      backgroundColor: theme.alertContainer,
                      borderColor: theme.alertBorder,
                    },
                  ]}
                >
                  <View style={[styles.heroRedDot, { backgroundColor: theme.alert }]} />
                  <Text style={[styles.heroStatusChipText, { color: theme.alertLight }]}>
                    ARMED
                  </Text>
                </View>
              </View>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                Circle of Care
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Automated multi-tier notification & SMS fallback safety net
              </Text>
            </View>
          </View>

          {/* Quick Security Metrics */}
          <View
            style={[
              styles.heroStatsRow,
              {
                backgroundColor: isDark ? '#090D14' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: theme.textPrimary }]}>
                {associatedList.length}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                Contacts
              </Text>
            </View>
            <View
              style={[
                styles.heroStatDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
              ]}
            />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: theme.primaryLight }]}>
                SMS Ready
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                Fallback Mode
              </Text>
            </View>
            <View
              style={[
                styles.heroStatDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
              ]}
            />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: theme.alertLight }]}>
                3 Tiers
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                Auto-Escalation
              </Text>
            </View>
          </View>
        </View>

        {/* Link via Phone Number Box */}
        <View
          style={[
            styles.linkCard,
            {
              backgroundColor: theme.bgCard,
              borderColor: isDark ? 'rgba(0, 123, 167, 0.28)' : theme.border,
            },
          ]}
        >
          <View style={styles.linkHeader}>
            <Phone size={18} color={theme.primaryLight} />
            <Text style={[styles.linkTitle, { color: theme.textPrimary }]}>
              Connect via Mobile Phone Number
            </Text>
          </View>
          <Text style={[styles.linkSubtext, { color: theme.textMuted }]}>
            Enter your caregiver or patient's registered phone number (e.g. +254... or 07...).
          </Text>

          <View style={styles.linkRow}>
            <TextInput
              style={[
                styles.linkInput,
                {
                  backgroundColor: isDark ? '#0A0D14' : '#F8FAFC',
                  borderColor: isDark ? '#242D3A' : '#CBD5E1',
                  color: theme.textPrimary,
                },
              ]}
              placeholder="+254712345678 or username"
              placeholderTextColor={theme.textMuted}
              value={phoneInput}
              onChangeText={setPhoneInput}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[
                styles.linkBtn,
                { backgroundColor: theme.primary },
                isLinking && styles.linkBtnDisabled,
              ]}
              onPress={handleLinkByPhone}
              disabled={isLinking}
            >
              {isLinking ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <UserPlus size={16} color="#FFFFFF" />
                  <Text style={styles.linkBtnText}>Connect</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Connected Members Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Connected Contacts ({associatedList.length})
          </Text>
        </View>

        {associatedList.length === 0 ? (
          <View
            style={[
              styles.emptyContactsCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? '#1D2533' : theme.border,
              },
            ]}
          >
            <Text style={[styles.emptyContactsText, { color: theme.textMuted }]}>
              No contacts connected yet. Enter their phone number above to create your safety circle.
            </Text>
          </View>
        ) : (
          <View style={styles.contactsGrid}>
            {associatedList.map((contact, idx) => {
              const name = typeof contact === 'object' ? contact.username : `User #${idx + 1}`;
              const phone =
                typeof contact === 'object' ? contact.phoneNumber || contact.contactInfo : '';
              const contactRole = typeof contact === 'object' ? contact.role : 'Contact';

              return (
                <View
                  key={idx}
                  style={[
                    styles.contactItem,
                    {
                      backgroundColor: theme.bgCard,
                      borderColor: isDark ? 'rgba(0, 123, 167, 0.2)' : theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.contactAvatar,
                      { backgroundColor: theme.primaryContainer },
                    ]}
                  >
                    <Users size={16} color={theme.primaryLight} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: theme.textPrimary }]}>
                      {name}
                    </Text>
                    <Text style={[styles.contactPhone, { color: theme.primaryLight }]}>
                      {phone || 'No phone recorded'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.contactBadge,
                      {
                        backgroundColor: isDark ? '#192230' : theme.primaryContainer,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.contactBadgeText,
                        { color: isDark ? theme.textSecondary : theme.primary },
                      ]}
                    >
                      {contactRole}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Escalation Alerts Section */}
        <View style={[styles.sectionHeader, { marginTop: 26 }]}>
          <View style={styles.alertsTitleRow}>
            <BellRing size={18} color={theme.alert} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Active Escalation Alerts
            </Text>
          </View>
          <Text
            style={[
              styles.alertCountBadge,
              {
                backgroundColor: theme.alertContainer,
                color: theme.alert,
              },
            ]}
          >
            {alerts.length}
          </Text>
        </View>

        {alerts.length === 0 ? (
          <View
            style={[
              styles.healthyStateCard,
              {
                backgroundColor: theme.bgCard,
                borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0',
              },
            ]}
          >
            <CheckCircle
              size={28}
              color={theme.emerald}
              style={{ marginBottom: 6 }}
            />
            <Text style={[styles.healthyStateTitle, { color: theme.textPrimary }]}>
              All Prescriptions on Track
            </Text>
            <Text style={[styles.healthyStateSubtext, { color: theme.textMuted }]}>
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
                    backgroundColor: isDark ? '#141822' : theme.bgCard,
                    borderColor: isAcknowledged
                      ? theme.border
                      : theme.alert,
                  },
                  !isAcknowledged && {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
                  },
                ]}
              >
                <View style={styles.alertTop}>
                  <View style={styles.patientInfo}>
                    <AlertTriangle
                      size={20}
                      color={isAcknowledged ? theme.emerald : theme.alert}
                    />
                    <View>
                      <Text style={[styles.patientName, { color: theme.textPrimary }]}>
                        {patientName}
                      </Text>
                      <Text style={[styles.alertStatusText, { color: theme.alertLight }]}>
                        Status: {alert.status}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.phoneTag,
                      {
                        backgroundColor: isDark ? '#192230' : theme.primaryContainer,
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
                  {patientName} missed Level 3 reminder. Fallback SMS was prepared for {alert.recipientPhone}.
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
                      <CheckCircle size={14} color={theme.emerald} />
                      <Text style={[styles.acknowledgedText, { color: theme.emerald }]}>
                        Acknowledged • SMS Cancelled
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.ackBtn, { backgroundColor: theme.alert }]}
                      onPress={() => handleAcknowledge(alert._id)}
                    >
                      <ShieldCheck size={16} color="#FFFFFF" />
                      <Text style={styles.ackBtnText}>Acknowledge & Cancel SMS</Text>
                    </TouchableOpacity>
                  )}
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
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroShieldBadge: {
    width: 50,
    height: 50,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroAlertPulse: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroTextCol: {
    flex: 1,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  heroRedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  heroStatusChipText: {
    fontSize: 9,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 14,
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatVal: {
    fontSize: 17,
    fontWeight: '800',
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
  },
  linkCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  linkSubtext: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 10,
  },
  linkInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  linkBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkBtnDisabled: {
    opacity: 0.6,
  },
  linkBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  alertCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContactsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyContactsText: {
    fontSize: 12,
    lineHeight: 16,
  },
  contactsGrid: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
  },
  contactPhone: {
    fontSize: 12,
    marginTop: 2,
  },
  contactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  contactBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  healthyStateCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  healthyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  healthyStateSubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  alertCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 15,
    fontWeight: '700',
  },
  alertStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  phoneTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  alertMsg: {
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 10,
  },
  alertFooter: {
    marginTop: 6,
  },
  ackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  ackBtnText: {
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
    fontSize: 12,
    fontWeight: '700',
  },
});
