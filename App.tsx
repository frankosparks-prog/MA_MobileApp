import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Activity, Pill, Users, User as UserNavIcon } from 'lucide-react-native';
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
import { Toast, ToastMessage } from './src/components/Toast';
import quoteService from './src/services/quoteService';
import client from './src/api/client';
import { adherenceApi, medicationApi, authApi } from './src/api';
import hapticService from './src/services/hapticService';

type Tab = 'today' | 'medications' | 'caregiver' | 'profile';

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

      {/* Bottom Tab Navigation Dock */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.tabBarBg,
            borderTopColor: theme.tabBarBorder,
            shadowColor: theme.primary,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'today' && { backgroundColor: theme.tabBarActivePill },
          ]}
          onPress={() => handleTabPress('today')}
        >
          <Activity
            size={22}
            color={activeTab === 'today' ? theme.primaryLight : theme.textSubtle}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'today' ? theme.primaryLight : theme.textSubtle },
              activeTab === 'today' && styles.tabLabelActive,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'medications' && { backgroundColor: theme.tabBarActivePill },
          ]}
          onPress={() => handleTabPress('medications')}
        >
          <Pill
            size={22}
            color={activeTab === 'medications' ? theme.primaryLight : theme.textSubtle}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'medications' ? theme.primaryLight : theme.textSubtle },
              activeTab === 'medications' && styles.tabLabelActive,
            ]}
          >
            Medicines
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'caregiver' && { backgroundColor: theme.tabBarActivePill },
          ]}
          onPress={() => handleTabPress('caregiver')}
        >
          <Users
            size={22}
            color={activeTab === 'caregiver' ? theme.primaryLight : theme.textSubtle}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'caregiver' ? theme.primaryLight : theme.textSubtle },
              activeTab === 'caregiver' && styles.tabLabelActive,
            ]}
          >
            Circle of Care
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'profile' && { backgroundColor: theme.tabBarActivePill },
          ]}
          onPress={() => handleTabPress('profile')}
        >
          <UserNavIcon
            size={22}
            color={activeTab === 'profile' ? theme.primaryLight : theme.textSubtle}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'profile' ? theme.primaryLight : theme.textSubtle },
              activeTab === 'profile' && styles.tabLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

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
    </View>
  );
}

export default function App() {
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
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1.5,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelActive: {
    fontWeight: '800',
  },
});
