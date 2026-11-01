import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, Clock, AlertTriangle, Pill, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { Medication, AdherenceStatus, EscalationLevel, AdherenceLog } from '../types';

interface DoseCardProps {
  medication?: Medication | null;
  scheduledTime?: string;
  status?: AdherenceStatus;
  escalationLevel?: EscalationLevel;
  onTakeDose?: () => void;
  isTaken?: boolean;
  log?: AdherenceLog;
}

export const DoseCard: React.FC<DoseCardProps> = ({
  medication,
  scheduledTime: propTime,
  status: propStatus,
  escalationLevel: propLvl,
  onTakeDose,
  isTaken: propTaken,
  log,
}) => {
  const { theme, isDark } = useTheme();
  const scheduledTime = log?.scheduledTime || propTime || '08:00';
  const status = log?.status || propStatus || 'Taken';
  const escalationLevel = log?.escalationLevel ?? propLvl ?? 0;
  const isTaken = propTaken !== undefined ? propTaken : status === 'Taken';
  const isDue = status === 'Escalated' && !isTaken;
  const isMissed = status === 'Missed';

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  const drugName = medication?.drugName || 'Prescription Intake';
  const quantity = medication?.quantity || '1 dose';
  const dosage = medication?.dosage || 'Standard';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.bgCard,
          borderColor: isDark ? 'rgba(0, 123, 167, 0.22)' : theme.border,
          shadowColor: theme.primary,
        },
        isDue && {
          borderColor: theme.alert,
          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
        },
        isTaken && {
          borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0',
          opacity: 0.9,
        },
        isMissed && {
          borderColor: theme.alertDark,
          backgroundColor: isDark ? 'rgba(153, 17, 82, 0.1)' : '#FEE2E2',
        },
      ]}
    >
      {/* Time & Status Row */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.timeTag,
            {
              backgroundColor: isDark ? '#0A0E14' : '#F1F5F9',
            },
          ]}
        >
          <Clock
            size={13}
            color={isDue ? theme.alertLight : theme.primaryLight}
          />
          <Text
            style={[
              styles.timeText,
              { color: theme.textPrimary },
              isDue && { color: theme.alertLight },
            ]}
          >
            {formatTime(scheduledTime)}
          </Text>
        </View>

        {/* Status Badge */}
        {isTaken && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#DCFCE7' },
            ]}
          >
            <CheckCircle2 size={13} color={theme.emerald} />
            <Text style={[styles.statusTakenText, { color: theme.emerald }]}>
              Taken
            </Text>
          </View>
        )}

        {!isTaken && !isMissed && escalationLevel === 0 && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: theme.primaryContainer,
                borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : '#BAE6FD',
              },
            ]}
          >
            <Clock size={13} color={theme.primaryLight} />
            <Text style={[styles.statusUpcomingText, { color: theme.primaryLight }]}>
              Scheduled Today
            </Text>
          </View>
        )}

        {isDue && escalationLevel > 0 && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: theme.alertContainer,
                borderColor: theme.alertBorder,
              },
            ]}
          >
            <AlertTriangle size={13} color={theme.alert} />
            <Text style={[styles.statusDueText, { color: theme.alert }]}>
              {escalationLevel > 1 ? `Due (Lvl ${escalationLevel})` : 'Due Now'}
            </Text>
          </View>
        )}

        {isMissed && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: theme.alertContainer },
            ]}
          >
            <ShieldAlert size={13} color={theme.alert} />
            <Text style={[styles.statusMissedText, { color: theme.alert }]}>
              Missed
            </Text>
          </View>
        )}
      </View>

      {/* Drug & Quantity Info */}
      <View style={styles.midRow}>
        <View
          style={[
            styles.medIconBox,
            {
              backgroundColor: theme.primaryContainer,
            },
            isDue && {
              backgroundColor: theme.alertContainer,
            },
          ]}
        >
          <Pill
            size={20}
            color={isDue ? theme.alert : theme.primaryLight}
          />
        </View>

        <View style={styles.medDetails}>
          <Text style={[styles.drugName, { color: theme.textPrimary }]}>
            {drugName}
          </Text>
          <View style={styles.doseRow}>
            <View
              style={[
                styles.quantityChip,
                {
                  backgroundColor: isDark ? '#192230' : theme.primaryContainer,
                },
              ]}
            >
              <Text style={[styles.quantityText, { color: theme.primaryLight }]}>
                {quantity}
              </Text>
            </View>
            <Text style={[styles.dosageText, { color: theme.textSecondary }]}>
              • {dosage}
            </Text>
          </View>

          {medication?.instructions ? (
            <Text style={[styles.instructionsText, { color: theme.textMuted }]}>
              📌 {medication.instructions}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Footer Row: Action Button */}
      {isDue && onTakeDose && (
        <View
          style={[
            styles.bottomRow,
            {
              borderTopColor: isDark ? '#1A2230' : '#E2E8F0',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              { backgroundColor: theme.primary },
            ]}
            onPress={onTakeDose}
          >
            <Text style={styles.confirmBtnText}>Confirm Intake</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusTakenText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusUpcomingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusDueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusMissedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  midRow: {
    flexDirection: 'row',
    gap: 12,
  },
  medIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medDetails: {
    flex: 1,
  },
  drugName: {
    fontSize: 15,
    fontWeight: '700',
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  quantityChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dosageText: {
    fontSize: 11,
  },
  instructionsText: {
    fontSize: 11,
    marginTop: 6,
  },
  bottomRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  confirmBtn: {
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
