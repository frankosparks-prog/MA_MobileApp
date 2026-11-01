import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
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

              {/* Notification Items List */}
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
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
                            {item.timestamp}
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
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
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
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
    maxHeight: 400,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
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
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  alertTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  alertMessage: {
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
    fontSize: 12,
    fontWeight: '600',
  },
});

