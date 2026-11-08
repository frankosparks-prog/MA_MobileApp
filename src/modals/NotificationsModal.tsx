import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { AdherenceLog, Medication } from '../types';
import { typography } from '../theme/typography';
import hapticService from '../services/hapticService';

export interface NotificationItem {
  id: string;
  type: 'urgent' | 'reminder' | 'streak' | 'system';
  title: string;
  message: string;
  timestamp: string;
  actionLabel?: string;
  log?: AdherenceLog;
  medication?: Medication;
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onTakeDose?: (log: AdherenceLog, med: Medication) => void;
  onClearAll?: () => void;
}

/**
 * Defensive formatter ensuring that even if raw ISO timestamps (e.g. 2026-11-08T17:28:00.000Z)
 * reach the UI, they render as clean, human-friendly medical timestamps.
 */
const formatDisplayTimestamp = (raw: string): string => {
  if (!raw) return 'Today';
  if (raw === 'Active' || raw === 'Daily' || raw === 'Today' || raw === 'Due') return raw;

  // If already formatted like "Today, 5:28 PM" or "5:28 PM"
  if (raw.includes('AM') || raw.includes('PM')) {
    return raw;
  }

  // 24h format HH:mm e.g. "17:28"
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }

  // Check if ISO string or parseable date
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    const now = new Date();
    const isToday = parsed.toDateString() === now.toDateString();
    const hours = parsed.getHours();
    const minutes = parsed.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayH = hours % 12 || 12;
    const timeStr = `${displayH}:${minutes.toString().padStart(2, '0')} ${period}`;

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (parsed.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeStr}`;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parsed.getMonth()]} ${parsed.getDate()}, ${timeStr}`;
  }

  return raw;
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
  notifications,
  onTakeDose,
  onClearAll,
}) => {
  const { theme, isDark } = useTheme();

  const handleAction = (item: NotificationItem) => {
    hapticService.selection();
    if (item.log && item.medication && onTakeDose) {
      onClose();
      onTakeDose(item.log, item.medication);
    }
  };

  const handleClose = () => {
    hapticService.selection();
    onClose();
  };

  const handleClear = () => {
    hapticService.selection();
    onClearAll?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.bgCard,
                  borderColor: isDark ? 'rgba(0, 123, 167, 0.35)' : theme.border,
                },
              ]}
            >
              {/* Header */}
              <View
                style={[
                  styles.headerRow,
                  { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border },
                ]}
              >
                <View style={styles.titleGroup}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDark ? 'rgba(0, 123, 167, 0.15)' : theme.primaryContainer,
                      },
                    ]}
                  >
                    <Bell size={18} color={theme.primaryLight} />
                  </View>
                  <View>
                    <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                      Clinical Alerts
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                      {notifications.length} active updates
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { backgroundColor: isDark ? '#161D2B' : '#F1F5F9' },
                  ]}
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Notification Items List - Fully Scrollable */}
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
                nestedScrollEnabled={true}
              >
                {notifications.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View
                      style={[
                        styles.emptyIconCircle,
                        { backgroundColor: isDark ? '#111723' : '#F1F5F9' },
                      ]}
                    >
                      <ShieldCheck size={36} color={theme.emerald} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                      All Regimens Current
                    </Text>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      No pending medication alerts or escalation notices. Your safety net is actively monitoring.
                    </Text>
                  </View>
                ) : (
                  notifications.map((item) => {
                    const isUrgent = item.type === 'urgent';
                    const isStreak = item.type === 'streak';
                    const formattedTime = formatDisplayTimestamp(item.timestamp);

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.alertItem,
                          {
                            backgroundColor: isDark ? '#101522' : '#F8FAFC',
                            borderColor: isUrgent
                              ? theme.alertBorder
                              : isDark
                              ? 'rgba(255, 255, 255, 0.06)'
                              : theme.border,
                          },
                        ]}
                      >
                        <View style={styles.alertHeaderRow}>
                          <View style={styles.alertTypeRow}>
                            {isUrgent ? (
                              <AlertTriangle size={15} color={theme.alert} />
                            ) : isStreak ? (
                              <Flame size={15} color="#F59E0B" />
                            ) : (
                              <Clock size={15} color={theme.primaryLight} />
                            )}
                            <Text
                              style={[
                                styles.alertTitle,
                                {
                                  color: isUrgent
                                    ? theme.alert
                                    : isStreak
                                    ? '#F59E0B'
                                    : theme.textPrimary,
                                },
                              ]}
                            >
                              {item.title}
                            </Text>
                          </View>
                          <Text style={[styles.alertTime, { color: theme.textSubtle }]}>
                            {formattedTime}
                          </Text>
                        </View>

                        <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>
                          {item.message}
                        </Text>

                        {item.actionLabel && (
                          <TouchableOpacity
                            style={[
                              styles.actionBtn,
                              {
                                backgroundColor: isUrgent
                                  ? theme.alert
                                  : isDark
                                  ? theme.primary
                                  : theme.primary,
                              },
                            ]}
                            onPress={() => handleAction(item)}
                          >
                            <Text style={styles.actionBtnText}>{item.actionLabel}</Text>
                            <ArrowRight size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Bottom Footer */}
              {notifications.length > 0 && onClearAll && (
                <View
                  style={[
                    styles.footerRow,
                    { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.clearBtn,
                      { backgroundColor: isDark ? '#141822' : '#F1F5F9' },
                    ]}
                    onPress={handleClear}
                  >
                    <Text style={[styles.clearBtnText, { color: theme.textSecondary }]}>
                      Clear All Notifications
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '84%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: typography.medium,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: typography.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  alertItem: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 14,
    gap: 8,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  alertTitle: {
    fontFamily: typography.bold,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  alertTime: {
    fontFamily: typography.medium,
    fontSize: 11,
    fontWeight: '500',
  },
  alertMessage: {
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  actionBtnText: {
    fontFamily: typography.bold,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  clearBtnText: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
});
