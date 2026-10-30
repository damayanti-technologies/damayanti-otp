import { prisma } from '../db/prisma.js';
import { CryptoService } from './crypto.service.js';
import { DeviceStatus, DeviceStatusType, JobStatus } from '../constants/status.js';
import { QueueService } from './queue.service.js';
import { logger } from '../utils/logger.js';
import type { AndroidDevice, SMSJob } from '@prisma/client';

export interface RegisterDeviceParams {
  deviceId: string;
  name: string;
  model?: string;
  androidVersion?: string;
  simCarrier?: string;
  simSlot?: number;
  pairingSecret?: string;
}

export interface HeartbeatParams {
  deviceId: string;
  batteryLevel?: number;
  isCharging?: boolean;
  simCarrier?: string;
  simSlot?: number;
  ipAddress?: string;
}

export class DeviceService {
  /**
   * Registers or pairs a new Android device gateway.
   * Generates a device token and HMAC signing secret.
   */
  static async registerDevice(params: RegisterDeviceParams): Promise<{
    device: AndroidDevice;
    token: string;
    signingSecret: string;
  }> {
    const { deviceId, name, model, androidVersion, simCarrier, simSlot } = params;

    const device = await prisma.androidDevice.upsert({
      where: { deviceId },
      update: {
        name,
        model,
        androidVersion,
        simCarrier,
        simSlot: simSlot ?? 0,
        status: DeviceStatus.ONLINE,
        lastHeartbeat: new Date(),
      },
      create: {
        deviceId,
        name,
        model,
        androidVersion,
        simCarrier,
        simSlot: simSlot ?? 0,
        status: DeviceStatus.ONLINE,
        lastHeartbeat: new Date(),
      },
    });

    // Invalidate prior credentials for this device
    await prisma.deviceCredential.updateMany({
      where: { deviceId: device.id, isRevoked: false },
      data: { isRevoked: true },
    });

    // Generate credentials
    const rawToken = `dmy_dev_tok_${CryptoService.generateSecureToken(32)}`;
    const tokenHash = await CryptoService.hashSensitive(rawToken);
    const signingSecret = CryptoService.generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30-day token

    await prisma.deviceCredential.create({
      data: {
        deviceId: device.id,
        tokenHash,
        signingSecret,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'DEVICE',
        actorId: device.id,
        action: 'DEVICE_REGISTERED_AND_PAIRED',
        target: device.name,
      },
    });

    logger.info({ deviceId: device.deviceId, name: device.name }, 'Android device registered and paired successfully');

    return {
      device,
      token: rawToken,
      signingSecret,
    };
  }

  /**
   * Processes keepalive heartbeat every 30 seconds.
   */
  static async recordHeartbeat(params: HeartbeatParams): Promise<{
    status: DeviceStatusType;
    isPaused: boolean;
    isDisabled: boolean;
    pendingJobsCount: number;
  }> {
    const { deviceId, batteryLevel, isCharging, simCarrier, simSlot, ipAddress } = params;

    const device = await prisma.androidDevice.findFirst({
      where: {
        OR: [{ id: deviceId }, { deviceId }],
      },
    });

    if (!device) {
      throw new Error('DEVICE_NOT_FOUND');
    }

    const isPaused = device.status === DeviceStatus.PAUSED;
    const isDisabled = device.status === DeviceStatus.DISABLED;

    if (!isDisabled && !isPaused) {
      await prisma.androidDevice.update({
        where: { id: device.id },
        data: {
          status: DeviceStatus.ONLINE,
          batteryLevel,
          isCharging,
          simCarrier: simCarrier ?? device.simCarrier,
          simSlot: simSlot ?? device.simSlot,
          lastHeartbeat: new Date(),
          ipAddress,
        },
      });
    } else {
      await prisma.androidDevice.update({
        where: { id: device.id },
        data: {
          batteryLevel,
          isCharging,
          lastHeartbeat: new Date(),
          ipAddress,
        },
      });
    }

    const pendingJobsCount = await prisma.sMSJob.count({
      where: { status: JobStatus.QUEUED },
    });

    return {
      status: device.status as DeviceStatusType,
      isPaused,
      isDisabled,
      pendingJobsCount,
    };
  }

  /**
   * Polls jobs assigned to this device.
   */
  static async pollJobs(deviceId: string, limit = 5): Promise<SMSJob[]> {
    const device = await prisma.androidDevice.findFirst({
      where: {
        OR: [{ id: deviceId }, { deviceId }],
      },
    });

    if (!device || device.status === DeviceStatus.DISABLED || device.status === DeviceStatus.PAUSED) {
      return [];
    }

    // Refresh heartbeat
    await prisma.androidDevice.update({
      where: { id: device.id },
      data: { status: DeviceStatus.ONLINE, lastHeartbeat: new Date() },
    });

    return QueueService.assignJobsToDevice(device.id, limit);
  }

  /**
   * Retrieves dashboard status for the device.
   */
  static async getDeviceStatus(deviceId: string) {
    const device = await prisma.androidDevice.findFirst({
      where: {
        OR: [{ id: deviceId }, { deviceId }],
      },
    });

    if (!device) return null;

    // Today's boundaries
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [submittedToday, failedToday, pendingQueue] = await Promise.all([
      prisma.sMSJob.count({
        where: {
          deviceId: device.id,
          status: JobStatus.SUBMITTED,
          submittedAt: { gte: startOfDay },
        },
      }),
      prisma.sMSJob.count({
        where: {
          deviceId: device.id,
          status: JobStatus.FAILED,
          failedAt: { gte: startOfDay },
        },
      }),
      prisma.sMSJob.count({
        where: { status: JobStatus.QUEUED },
      }),
    ]);

    return {
      device,
      metrics: {
        submittedToday,
        failedToday,
        pendingQueue,
      },
    };
  }
}
