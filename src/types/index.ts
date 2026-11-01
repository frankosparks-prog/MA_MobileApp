export type UserRole = 'Patient' | 'Caregiver' | 'Dependant';

export interface User {
  _id: string;
  username: string;
  role: UserRole;
  contactInfo: string;
  phoneNumber?: string;
  associatedUsers?: string[] | User[];
}

export type PlantType = 'Sunflower' | 'Golden Oak' | 'Calming Lavender' | 'Healing Aloe' | 'Bonsai';

export interface Medication {
  _id: string;
  patientId: string;
  drugName: string;
  dosage: string;
  quantity?: string; // e.g. "2 pills", "1 tablespoon", "10 ml"
  scheduleInterval: string; // e.g. "08:00,20:00" or "08:00"
  instructions?: string; // e.g. "Take after food"
  plantType?: PlantType;
  durationDays?: number; // 0 = Ongoing (7-day bloom cycle), >0 = fixed duration course (e.g. 7, 14, 30 days)
  startDate?: string;
  endDate?: string;
  dosesTakenCount?: number;
  totalDosesExpected?: number;
  isActive?: boolean;
  createdAt?: string;
}

export type EscalationLevel = 0 | 1 | 2 | 3 | 4;
export type AdherenceStatus = 'Escalated' | 'Taken' | 'Missed';

export interface AdherenceLog {
  _id: string;
  patientId: string;
  medId: Medication | string;
  scheduledTime: string;
  takenTime?: string;
  status: AdherenceStatus;
  escalationLevel: EscalationLevel;
  lastAlertSentAt: string;
}

export type PlantStage = 'Seed' | 'Sprout' | 'Bud' | 'Flowering' | 'Mature';
export type PlantStatus = 'Healthy' | 'Wilted';

export interface GamificationProfile {
  _id: string;
  patientId: string;
  currentStreak: number;
  longestStreak: number;
  xpPoints: number;
  plantStage: PlantStage;
  plantStatus: PlantStatus;
  treesGrown?: number;
  totalDosesTaken?: number;
  growthPercentage?: number;
  freePassesAvailable: number;
  lastFreePassResetMonth: string;
}

export type CaregiverAlertStatus = 'PUSH_SENT' | 'VIEWED' | 'ACKNOWLEDGED' | 'SMS_SENT' | 'FAILED' | 'CANCELLED';

export interface CaregiverAlert {
  _id: string;
  logId: AdherenceLog;
  patientId: User;
  caregiverId: string;
  recipientPhone: string;
  status: CaregiverAlertStatus;
  pushSentAt: string;
  viewedAt?: string;
  acknowledgedAt?: string;
  smsSentAt?: string;
  smsMessageId?: string;
  smsError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Quote {
  id: string;
  text: string;
  category: 'inspirational' | 'humorous' | 'relatable';
  author?: string;
}
