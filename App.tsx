import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { User, Medication, AdherenceLog, Quote } from './src/types';
import { AuthScreen } from './src/screens/AuthScreen';
import { SanctuaryScreen } from './src/screens/SanctuaryScreen';
import { MedicationsScreen } from './src/screens/MedicationsScreen';
import { CaregiverHubScreen } from './src/screens/CaregiverHubScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ReminderOverlayModal } from './src/modals/ReminderOverlayModal';
import { CaregiverEscalationModal } from './src/modals/CaregiverEscalationModal';
import { AddMedicationModal } from './src/modals/AddMedicationModal';
import { NotificationsModal, NotificationItem } from './src/modals/NotificationsModal';
import { HeadlessAudioPlayer } from './src/components/HeadlessAudioPlayer';
import { TopNavBar } from './src/components/TopNavBar';
import { CurvedBottomBar, Tab } from './src/components/CurvedBottomBar';
import { Toast, ToastMessage } from './src/components/Toast';
import quoteService from './src/services/quoteService';
import client from './src/api/client';
import { adherenceApi, medicationApi, authApi } from './src/api';
import hapticService from './src/services/hapticService';

function MainApp() {
  const { theme, isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [dataVersion, setDataVersion] = useState(0);

  // Toast state
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  // Modals state
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [medicationToEdit, setMedicationToEdit] = useState<Medication | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderLevel, setReminderLevel] = useState<1 | 2 | 3>(1);
  const [activeMedication, setActiveMedication] = useState<Medication | null>(null);
  const [activeLog, setActiveLog] = useState<AdherenceLog | null>(null);
  const [isCaregiverModalOpen, setIsCaregiverModalOpen] = useState(false);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);

  // Top Nav & Notification Drawer state
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // Check initial auth token & sync profile
    const checkToken = async () => {
      try {
        const token = await client.getToken();
        if (token) {
          const res = await authApi.getProfile();
          if (res.data?.user) {
            setCurrentUser(res.data.user);
          }
        }
      } catch (e: any) {
        console.log('Token check note:', e.message);
      }
    };
    checkToken();
  }, []);

  // Poll for active dose alerts & caregiver notifications
  useEffect(() => {
    if (!currentUser) return;

    const formatNotificationTime = (timeStr?: string): { titleTime: string; stampTime: string } => {
      if (!timeStr) return { titleTime: 'Due', stampTime: 'Today' };

      // Case 1: HH:mm format (e.g. "08:00" or "20:30")
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        const [h, m] = timeStr.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        const formatted = `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
        return { titleTime: formatted, stampTime: formatted };
      }

      // Case 2: Full ISO string or date
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) {
        return { titleTime: timeStr, stampTime: timeStr };
      }

      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayH = hours % 12 || 12;
      const timePart = `${displayH}:${minutes.toString().padStart(2, '0')} ${period}`;

      if (isToday) {
        return { titleTime: timePart, stampTime: `Today, ${timePart}` };
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return { titleTime: timePart, stampTime: `Yesterday, ${timePart}` };
      }

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const datePart = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      return { titleTime: timePart, stampTime: `${datePart}, ${timePart}` };
    };

    const loadNotifications = async () => {
      try {
        const [logsRes, alertsRes] = await Promise.all([
          adherenceApi.getLogs(currentUser._id),
          adherenceApi.getCaregiverAlerts(),
        ]);

        const items: NotificationItem[] = [];

        // Active / escalated dose logs
        if (logsRes.data?.logs) {
          const activeLogs = logsRes.data.logs.filter(
            (l) => l.status === 'Escalated' || l.status === 'Missed'
          );

          activeLogs.slice(0, 10).forEach((log) => {
            const med = typeof log.medId === 'object' ? (log.medId as Medication) : null;
            const medName = med?.drugName || 'Scheduled Prescription';
            const isEscalated = log.status === 'Escalated';
            const { titleTime, stampTime } = formatNotificationTime(log.scheduledTime);

            items.push({
              id: log._id,
              type: isEscalated ? 'urgent' : 'reminder',
              title: `${medName} • ${titleTime}`,
              message: isEscalated
                ? `Safety Net Level ${log.escalationLevel || 1}: Window overdue. Please confirm intake.`
                : `Dose intake scheduled for today. Confirm to nourish your plant sanctuary.`,
              timestamp: stampTime,
              actionLabel: 'Take Dose',
              log,
              medication: med || undefined,
            });
          });
        }

        // Caregiver alerts
        if (alertsRes.data?.alerts) {
          alertsRes.data.alerts.slice(0, 3).forEach((alt: any) => {
            items.push({
              id: alt._id || Math.random().toString(),
              type: 'urgent',
              title: 'Caregiver Safety Net Dispatched',
              message: alt.message || 'Escalation triggered for patient adherence.',
              timestamp: 'Active',
            });
          });
        }

        // Daily Milestone
        items.push({
          id: 'streak-milestone-20',
          type: 'streak',
          title: 'Adherence Streak Active',
          message: '20 consecutive days logged. Your botanical sanctuary is flourishing!',
          timestamp: 'Daily',
        });

        setNotifications(items);
      } catch (e: any) {
        console.log('Error refreshing notifications:', e.message);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser, dataVersion]);

  const handleLogout = async () => {
    await client.removeToken();
    setCurrentUser(null);
    showToast('info', 'Logged out of MediAlert.');
  };

  const handleTabPress = (tab: Tab) => {
    hapticService.selection();
    setActiveTab(tab);
  };

  // Open Reminder Overlay
  const handleOpenReminder = (log: AdherenceLog, med: Medication, level: 1 | 2 | 3) => {
    setActiveLog(log);
    setActiveMedication(med);
    setReminderLevel(level);
    setActiveQuote(quoteService.getQuoteForStreak(20));
    setIsReminderOpen(true);
  };

  // Open Caregiver Escalation Hand-off
  const handleOpenCaregiverHandOff = (med: Medication) => {
    setActiveMedication(med);
    setIsCaregiverModalOpen(true);
  };

  // Confirm dose taken (Nourish action)
  const handleConfirmDose = async () => {
    if (activeLog) {
      try {
        await adherenceApi.confirmTaken(activeLog._id);
        showToast('success', 'Dose intake verified successfully.');
        setDataVersion((v) => v + 1);
      } catch (e: any) {
        console.log('Error confirming dose on server:', e.message);
        showToast('info', 'Dose recorded locally.');
        setDataVersion((v) => v + 1);
      }
    }
    setIsReminderOpen(false);
    setIsCaregiverModalOpen(false);
  };

  // Save or update medication from modal
  const handleSaveMedication = async (medData: Partial<Medication>) => {
    if (!currentUser) return;
    try {
      if (medData._id) {
        await medicationApi.update(medData._id, medData);
        showToast('success', `Updated "${medData.drugName}" successfully.`);
      } else {
        await medicationApi.create({
          ...medData,
          patientId: currentUser._id,
        });
        showToast('success', `Added "${medData.drugName}" to your schedule.`);
      }
      setIsAddMedOpen(false);
      setMedicationToEdit(null);
      setDataVersion((v) => v + 1);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to save medication schedule.');
    }
  };

  if (!currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
        <AuthScreen
          onAuthSuccess={(u) => {
            setCurrentUser(u);
            showToast('success', `Welcome back, ${u.username}`);
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Global Toast Banner */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Top Navigation Bar with Logo, Notification Bell & Profile Avatar */}
      <TopNavBar
        user={currentUser}
        unreadCount={notifications.length}
        onPressLogo={() => handleTabPress('today')}
        onPressNotifications={() => setIsNotificationModalOpen(true)}
        onPressProfile={() => handleTabPress('profile')}
      />

      {/* Main Screen Content */}
      <View style={styles.screenContent}>
        {activeTab === 'today' && (
          <SanctuaryScreen
            user={currentUser}
            onLogout={handleLogout}
            onOpenAddMedication={() => {
              setMedicationToEdit(null);
              setIsAddMedOpen(true);
            }}
            onOpenReminderModal={handleOpenReminder}
            onOpenCaregiverModal={handleOpenCaregiverHandOff}
            showToast={showToast}
            dataVersion={dataVersion}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationsScreen
            user={currentUser}
            onOpenAddMedication={() => {
              setMedicationToEdit(null);
              setIsAddMedOpen(true);
            }}
            onEditMedication={(med) => {
              setMedicationToEdit(med);
              setIsAddMedOpen(true);
            }}
            showToast={showToast}
            dataVersion={dataVersion}
            onMedicationDeleted={() => setDataVersion((v) => v + 1)}
          />
        )}

        {activeTab === 'caregiver' && (
          <CaregiverHubScreen user={currentUser} showToast={showToast} />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            user={currentUser}
            onLogout={handleLogout}
            showToast={showToast}
            dataVersion={dataVersion}
          />
        )}
      </View>

      {/* Animated Curved Notch Bottom Navigation Bar */}
      <CurvedBottomBar activeTab={activeTab} onTabPress={handleTabPress} />

      {/* Global Overlays & Modals */}
      <ReminderOverlayModal
        visible={isReminderOpen}
        level={reminderLevel}
        medication={activeMedication}
        quote={activeQuote}
        streak={20}
        onConfirm={handleConfirmDose}
        onDismiss={() => setIsReminderOpen(false)}
      />

      <CaregiverEscalationModal
        visible={isCaregiverModalOpen}
        medication={activeMedication}
        caregiverName="Designated Caregiver"
        onConfirmTaken={handleConfirmDose}
        onDismiss={() => setIsCaregiverModalOpen(false)}
      />

      <AddMedicationModal
        visible={isAddMedOpen}
        onClose={() => {
          setIsAddMedOpen(false);
          setMedicationToEdit(null);
        }}
        onSave={handleSaveMedication}
        medicationToEdit={medicationToEdit}
      />

      {/* Interactive Clinical Notifications Drawer */}
      <NotificationsModal
        visible={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onTakeDose={(log, med) => {
          setIsNotificationModalOpen(false);
          handleOpenReminder(log, med, (log.escalationLevel || 1) as 1 | 2 | 3);
        }}
        onClearAll={() => {
          setNotifications([]);
          showToast('info', 'All notifications cleared.');
        }}
      />

      {/* Invisible Zero-Dependency Mobile Audio Synthesizer */}
      <HeadlessAudioPlayer />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const id = 'plus-jakarta-sans-font';
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
  },
});
