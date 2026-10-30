export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface RequestOtpResponse {
  success: boolean;
  correlationId?: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
  devCode?: string; // Only present in mock/development mode
  error?: ApiError;
}

export interface VerifyOtpResponse {
  success: boolean;
  status?: string;
  sessionToken?: string;
  user?: {
    id: string;
    phoneNumber: string;
  };
  error?: ApiError;
}

export interface ResendOtpResponse {
  success: boolean;
  correlationId?: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
  devCode?: string;
  error?: ApiError;
}

export interface SessionResponse {
  success: boolean;
  user?: {
    id: string;
    phoneNumber: string;
  };
  expiresAt?: string;
  error?: ApiError;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'ok';
  service: string;
  version?: string;
  uptimeSeconds?: number;
  complianceMode?: 'DEVELOPMENT_MOCK' | 'DEVELOPMENT_RESTRICTED' | 'PRODUCTION_DLT';
  database?: {
    connected: boolean;
    latencyMs?: number;
    error?: string;
  };
  gateway?: {
    isOnline: boolean;
    device?: {
      name: string;
      model: string | null;
      lastHeartbeat: string | null;
      batteryLevel: number | null;
      simCarrier: string | null;
    } | null;
  };
  queue?: {
    queued: number;
    submitted: number;
    failed: number;
    totalOtps: number;
  };
}

export interface SmsJobStatusResponse {
  success: boolean;
  job?: {
    id: string;
    status: 'QUEUED' | 'ASSIGNED' | 'SENDING' | 'SUBMITTED' | 'FAILED' | 'EXPIRED';
    recipientNumber: string;
    retryCount: number;
    assignedAt?: string | null;
    submittedAt?: string | null;
    failedAt?: string | null;
    failureReason?: string | null;
    logs?: Array<{
      id: string;
      level: string;
      message: string;
      timestamp: string;
    }>;
  };
  error?: ApiError;
}

export interface ApiTrace {
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  requestBody?: unknown;
  responseBody?: unknown;
  durationMs: number;
}
