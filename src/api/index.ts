import client from './client';
import { User, Medication, AdherenceLog, GamificationProfile, CaregiverAlert } from '../types';

export const authApi = {
  register: (data: { username: string; role: string; contactInfo: string; phoneNumber?: string; pinHash: string }) =>
    client.post<{ status: string; token: string; data: { user: User } }>('/api/auth/register', data),

  login: (data: { username: string; pin: string }) =>
    client.post<{ status: string; token: string; data: { user: User } }>('/api/auth/login', data),

  getProfile: () =>
    client.get<{ status: string; data: { user: User } }>('/api/auth/profile'),

  associate: (identifier: string) =>
    client.post<{ status: string; data: { user: User } }>('/api/auth/associate', {
      identifier,
      phoneNumber: identifier,
      associateUsername: identifier,
    }),
};

export const medicationApi = {
  list: (patientId?: string) =>
    client.get<{ status: string; data: { medications: Medication[] } }>(
      patientId ? `/api/medications?patientId=${patientId}` : '/api/medications'
    ),

  create: (data: Partial<Medication>) =>
    client.post<{ status: string; data: { medication: Medication } }>('/api/medications', data),

  update: (id: string, data: Partial<Medication>) =>
    client.put<{ status: string; data: { medication: Medication } }>(`/api/medications/${id}`, data),

  delete: (id: string) =>
    client.delete<{ status: string; message: string }>(`/api/medications/${id}`),
};

export const adherenceApi = {
  getLogs: (patientId?: string) =>
    client.get<{ status: string; data: { logs: AdherenceLog[] } }>(
      patientId ? `/api/adherence?patientId=${patientId}` : '/api/adherence'
    ),

  confirmTaken: (logId: string) =>
    client.post<{ status: string; data: { log: AdherenceLog; gamification: GamificationProfile } }>(
      `/api/adherence/confirm/${logId}`
    ),

  triggerSchedule: (patientId?: string, medId?: string) =>
    client.post<{ status: string; data: { log: AdherenceLog } }>('/api/adherence/trigger', { patientId, medId }),

  sweep: () =>
    client.post<{ status: string; data: { processedLogsCount: number } }>('/api/adherence/sweep'),

  getCaregiverAlerts: () =>
    client.get<{ status: string; data: { alerts: CaregiverAlert[] } }>('/api/adherence/alerts'),

  viewAlert: (alertId: string) =>
    client.post<{ status: string; data: { alert: CaregiverAlert } }>(`/api/adherence/alerts/${alertId}/view`),

  acknowledgeAlert: (alertId: string) =>
    client.post<{ status: string; data: { alert: CaregiverAlert } }>(`/api/adherence/alerts/${alertId}/acknowledge`),
};

export const gamificationApi = {
  getProfile: (patientId?: string) =>
    client.get<{ status: string; data: { profile: GamificationProfile } }>(
      patientId ? `/api/gamification/profile?patientId=${patientId}` : '/api/gamification/profile'
    ),
};

