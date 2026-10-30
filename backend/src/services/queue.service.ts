import { prisma } from '../db/prisma.js';
import { JobStatus, JobStatusType } from '../constants/status.js';
import { logger } from '../utils/logger.js';
import type { SMSJob } from '@prisma/client';

export interface EnqueueJobParams {
  applicationId: string;
  recipientNumber: string;
  messageBody: string;
  otpRequestId?: string;
}

export interface ReportOutcomeParams {
  jobId: string;
  deviceId: string;
  outcome: 'SUBMITTED' | 'FAILED';
  rawResponse?: string;
  failureReason?: string;
  isUncertainOutcome?: boolean;
}

export class QueueService {
  /**
   * Enqueues a new SMS dispatch job.
   */
  static async enqueueJob(params: EnqueueJobParams): Promise<SMSJob> {
    const job = await prisma.sMSJob.create({
      data: {
        applicationId: params.applicationId,
        recipientNumber: params.recipientNumber,
        messageBody: params.messageBody,
        otpRequestId: params.otpRequestId,
        status: JobStatus.QUEUED,
        retryCount: 0,
        maxRetries: 3,
      },
    });

    await prisma.sMSLog.create({
      data: {
        smsJobId: job.id,
        status: JobStatus.QUEUED,
        rawResponse: 'Job successfully created in queue',
      },
    });

    return job;
  }

  /**
   * Assigns the oldest pending QUEUED jobs to an authorized Android device.
   * Uses atomic transaction to prevent race conditions across parallel polls.
   */
  static async assignJobsToDevice(deviceIdOrHardwareId: string, limit = 5): Promise<SMSJob[]> {
    return prisma.$transaction(async (tx) => {
      // Resolve device by primary key or unique hardware deviceId
      const device = await tx.androidDevice.findFirst({
        where: {
          OR: [{ id: deviceIdOrHardwareId }, { deviceId: deviceIdOrHardwareId }],
        },
      });

      if (!device) {
        logger.warn({ deviceIdOrHardwareId }, 'Cannot assign jobs: Android device not registered');
        return [];
      }

      // Find oldest QUEUED jobs
      const pendingJobs = await tx.sMSJob.findMany({
        where: { status: JobStatus.QUEUED },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      if (pendingJobs.length === 0) {
        return [];
      }

      const assignedJobIds = pendingJobs.map((j) => j.id);
      const now = new Date();

      // Mark assigned to this device
      await tx.sMSJob.updateMany({
        where: { id: { in: assignedJobIds } },
        data: {
          status: JobStatus.ASSIGNED,
          deviceId: device.id,
          assignedAt: now,
        },
      });

      for (const jobId of assignedJobIds) {
        await tx.sMSLog.create({
          data: {
            smsJobId: jobId,
            status: JobStatus.ASSIGNED,
            rawResponse: `Job assigned to device ${device.name} (${device.id})`,
          },
        });
      }

      return tx.sMSJob.findMany({
        where: { id: { in: assignedJobIds } },
      });
    });
  }

  /**
   * Device acknowledges that it picked up the job and is initiating transmission via SmsManager.
   */
  static async acknowledgeJob(jobId: string, deviceIdOrHardwareId: string): Promise<boolean> {
    const device = await prisma.androidDevice.findFirst({
      where: {
        OR: [{ id: deviceIdOrHardwareId }, { deviceId: deviceIdOrHardwareId }],
      },
    });

    if (!device) return false;

    const job = await prisma.sMSJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.deviceId !== device.id) {
      return false;
    }

    if (job.status !== JobStatus.ASSIGNED && job.status !== JobStatus.QUEUED) {
      // Already processed or in-flight
      return false;
    }

    await prisma.sMSJob.update({
      where: { id: jobId },
      data: { status: JobStatus.SENDING },
    });

    await prisma.sMSLog.create({
      data: {
        smsJobId: jobId,
        status: JobStatus.SENDING,
        rawResponse: `Device acknowledged; transmitting to radio base station`,
      },
    });

    return true;
  }

  /**
   * Reconciles the outcome of an SMS transmission reported by the Android device.
   * Strictly distinguishes carrier SUBMISSION from delivery, and prevents duplicate re-transmissions.
   */
  static async reportOutcome(params: ReportOutcomeParams): Promise<SMSJob | null> {
    const { jobId, deviceId: deviceIdOrHardwareId, outcome, rawResponse, failureReason, isUncertainOutcome } = params;

    const device = await prisma.androidDevice.findFirst({
      where: {
        OR: [{ id: deviceIdOrHardwareId }, { deviceId: deviceIdOrHardwareId }],
      },
    });

    if (!device) return null;

    const job = await prisma.sMSJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.deviceId !== device.id) {
      logger.warn({ jobId, deviceId: device.id }, 'Report outcome rejected: Device mismatch or job not found');
      return null;
    }

    // Terminal statuses cannot be modified
    if (job.status === JobStatus.SUBMITTED) {
      logger.info({ jobId }, 'Job already reported as SUBMITTED; ignoring duplicate status update');
      return job;
    }

    const now = new Date();

    if (outcome === 'SUBMITTED') {
      const updated = await prisma.sMSJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.SUBMITTED,
          submittedAt: now,
          failureReason: null,
        },
      });

      await prisma.sMSLog.create({
        data: {
          smsJobId: jobId,
          status: JobStatus.SUBMITTED,
          rawResponse: rawResponse || 'Carrier radio accepted SMS for delivery',
        },
      });

      return updated;
    }

    // Handle failure
    if (isUncertainOutcome) {
      // Rule: Do not automatically retry a message if sending outcome is uncertain.
      // Reconcile status to prevent duplicate OTP messages.
      logger.warn({ jobId }, 'SMS outcome is uncertain (radio timeout). Holding job in FAILED status without auto-retry.');
      return prisma.sMSJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          failedAt: now,
          failureReason: 'UNCERTAIN_RADIO_OUTCOME - Held to prevent duplicate OTP transmission',
        },
      });
    }

    // If deterministic failure (e.g. SIM busy, no network) and retries remain
    if (job.retryCount < job.maxRetries) {
      const nextRetry = job.retryCount + 1;
      logger.info({ jobId, retryCount: nextRetry }, 'Re-queueing job for retry after recoverable radio error');

      return prisma.sMSJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.QUEUED,
          deviceId: null,
          retryCount: nextRetry,
          failureReason: failureReason || 'Transient radio error',
        },
      });
    }

    // Exceeded max retries -> FAILED
    const failedJob = await prisma.sMSJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        failedAt: now,
        failureReason: failureReason || 'Maximum carrier retries exhausted',
      },
    });

    await prisma.sMSLog.create({
      data: {
        smsJobId: jobId,
        status: JobStatus.FAILED,
        rawResponse: failureReason || 'Job failed permanently',
      },
    });

    return failedJob;
  }

  /**
   * Reconciles stale assigned jobs where the device disconnected mid-flight.
   * Jobs stuck in ASSIGNED or SENDING for more than 3 minutes are timed out.
   */
  static async reconcileStaleJobs(staleTimeoutMinutes = 3): Promise<number> {
    const cutoff = new Date(Date.now() - staleTimeoutMinutes * 60 * 1000);

    const staleJobs = await prisma.sMSJob.findMany({
      where: {
        status: { in: [JobStatus.ASSIGNED, JobStatus.SENDING] },
        updatedAt: { lt: cutoff },
      },
    });

    for (const job of staleJobs) {
      logger.warn({ jobId: job.id, currentStatus: job.status }, 'Reconciling stale job abandoned by disconnected device');
      await prisma.sMSJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.EXPIRED,
          failureReason: 'DEVICE_HEARTBEAT_TIMEOUT - Stale job reconciliation',
        },
      });
    }

    return staleJobs.length;
  }
}
