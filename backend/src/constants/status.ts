export const JobStatus = {
  QUEUED: 'QUEUED',
  ASSIGNED: 'ASSIGNED',
  SENDING: 'SENDING',
  SUBMITTED: 'SUBMITTED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
} as const;

export type JobStatusType = (typeof JobStatus)[keyof typeof JobStatus];

export const DeviceStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  PAUSED: 'PAUSED',
  DISABLED: 'DISABLED',
} as const;

export type DeviceStatusType = (typeof DeviceStatus)[keyof typeof DeviceStatus];

export const ComplianceMode = {
  DEVELOPMENT_MOCK: 'DEVELOPMENT_MOCK',
  DEVELOPMENT_RESTRICTED: 'DEVELOPMENT_RESTRICTED',
  PRODUCTION_DLT: 'PRODUCTION_DLT',
} as const;

export type ComplianceModeType = (typeof ComplianceMode)[keyof typeof ComplianceMode];

export const ErrorCode = {
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  COOLDOWN_ACTIVE: 'COOLDOWN_ACTIVE',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',
  MAX_ATTEMPTS_EXCEEDED: 'MAX_ATTEMPTS_EXCEEDED',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_UNAUTHORIZED: 'DEVICE_UNAUTHORIZED',
  COMPLIANCE_BLOCKED: 'COMPLIANCE_BLOCKED',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
