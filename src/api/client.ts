import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const STORAGE_KEY_TOKEN = '@medialert_token';
const STORAGE_KEY_SERVER_URL = '@medialert_server_url';

export const getAutoDetectedServerUrl = (): string => {
  try {
    // 1. Auto-detect from Expo Metro host (e.g. "192.168.1.100:8081")
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
      (Constants as any).manifest?.debuggerHost;

    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1' && hostIp !== '10.0.2.2') {
        return `http://${hostIp}:5000`;
      }
    }
  } catch (_) {}

  // 2. Physical device LAN default on host network
  if (Platform.OS === 'android') {
    return 'http://192.168.1.100:5000';
  }
  return 'http://localhost:5000';
};

class ApiClient {
  private baseUrl: string = getAutoDetectedServerUrl();

  constructor() {
    this.loadServerUrl();
  }

  async loadServerUrl() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
      // Clean up legacy 10.0.2.2 if previously stored in AsyncStorage
      if (stored && !stored.includes('10.0.2.2') && !stored.includes('localhost') && Platform.OS === 'android') {
        this.baseUrl = stored;
      } else if (stored && Platform.OS !== 'android') {
        this.baseUrl = stored;
      } else {
        this.baseUrl = getAutoDetectedServerUrl();
        await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, this.baseUrl);
      }
    } catch (_) {
      this.baseUrl = getAutoDetectedServerUrl();
    }
  }

  async setServerUrl(url: string) {
    let clean = url.trim().replace(/\/$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    this.baseUrl = clean;
    await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, this.baseUrl);
  }

  getServerUrl(): string {
    return this.baseUrl;
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
    } catch {
      return null;
    }
  }

  async setToken(token: string) {
    await AsyncStorage.setItem(STORAGE_KEY_TOKEN, token);
  }

  async removeToken() {
    await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
  }

  async testConnection(customUrl?: string): Promise<{ ok: boolean; statusText?: string }> {
    const targetUrl = customUrl ? customUrl.trim().replace(/\/$/, '') : this.baseUrl;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${targetUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return { ok: res.ok, statusText: res.ok ? 'Connected' : `HTTP ${res.status}` };
    } catch (e: any) {
      return { ok: false, statusText: e.message || 'Offline' };
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (error: any) {
      console.warn(`[API] Error on ${options.method || 'GET'} ${url}:`, error.message);
      throw error;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export default new ApiClient();
