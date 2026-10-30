export interface DashboardMetrics {
  totalOtpRequests: number;
  queuedJobs: number;
  messagesSubmitted: number;
  failedMessages: number;
  activeDevices: number;
  messagesSentToday: number;
}

export interface GatewayInfo {
  isOnline: boolean;
  activeDeviceCount: number;
  devices: Array<{
    id: string;
    deviceId: string;
    name: string;
    lastHeartbeat: string;
    batteryLevel: number | null;
  }>;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  gateway: GatewayInfo;
}

export interface SmsMessage {
  id: string;
  recipientNumber: string;
  messageBody: string;
  status: 'QUEUED' | 'ASSIGNED' | 'SENDING' | 'SUBMITTED' | 'FAILED' | 'EXPIRED';
  retryCount: number;
  createdAt: string;
  submittedAt?: string;
  failedAt?: string;
  failureReason?: string;
  application: {
    appId: string;
    name: string;
  };
  device?: {
    name: string;
    model: string;
  } | null;
}

export interface DeviceRecord {
  id: string;
  deviceId: string;
  name: string;
  model?: string;
  androidVersion?: string;
  simCarrier?: string;
  simSlot?: number;
  status: 'ONLINE' | 'OFFLINE' | 'PAUSED' | 'DISABLED';
  batteryLevel?: number;
  isCharging?: boolean;
  lastHeartbeat?: string;
  _count?: {
    smsJobs: number;
  };
}

export interface ApplicationRecord {
  id: string;
  appId: string;
  name: string;
  description?: string;
  allowedOrigins: string;
  isEnabled: boolean;
  rateLimitPerMin: number;
  createdAt: string;
}

export type TabId =
  | 'overview'
  | 'applications'
  | 'gateway'
  | 'devices'
  | 'otp-requests'
  | 'messages'
  | 'credentials'
  | 'security'
  | 'settings';
