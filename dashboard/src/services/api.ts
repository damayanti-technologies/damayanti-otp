import { DashboardData, SmsMessage, DeviceRecord } from '../types';

const ADMIN_SECRET_STORAGE_KEY = 'damayanti_admin_secret';
const DEFAULT_SECRET = 'damayanti_session_secret_64chars_long_entropy_secure_123456';

export function getAdminSecret(): string {
  return localStorage.getItem(ADMIN_SECRET_STORAGE_KEY) || DEFAULT_SECRET;
}

export function setAdminSecret(secret: string): void {
  localStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret);
}

const headers = () => ({
  'Content-Type': 'application/json',
  'X-Admin-Secret': getAdminSecret(),
});

export const api = {
  async getDashboard(): Promise<DashboardData> {
    const res = await fetch('/api/v1/admin/dashboard', { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  },

  async getMessages(page = 1, limit = 20): Promise<{ messages: SmsMessage[]; total: number }> {
    const res = await fetch(`/api/v1/admin/messages?page=${page}&limit=${limit}`, { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { messages: data.messages || [], total: data.pagination?.total || 0 };
  },

  async getDevices(): Promise<DeviceRecord[]> {
    const res = await fetch('/api/v1/admin/devices', { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.devices || [];
  },

  async getStatistics(): Promise<any> {
    const res = await fetch('/api/v1/admin/statistics', { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async disableDevice(deviceId: string): Promise<boolean> {
    const res = await fetch('/api/v1/admin/device/disable', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ deviceId }),
    });
    return res.ok;
  },

  async checkHealth(): Promise<any> {
    const res = await fetch('/api/v1/health');
    return res.json();
  },
};
