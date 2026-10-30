import { Request, Response } from 'express';
import { z } from 'zod';
import { DeviceService } from '../services/device.service.js';
import { QueueService } from '../services/queue.service.js';
import { ErrorCode } from '../constants/status.js';
import type { AuthenticatedDeviceRequest } from '../middlewares/deviceAuth.middleware.js';

const registerDeviceSchema = z.object({
  deviceId: z.string().min(4),
  name: z.string().min(2),
  model: z.string().optional(),
  androidVersion: z.string().optional(),
  simCarrier: z.string().optional(),
  simSlot: z.number().int().optional(),
});

const heartbeatSchema = z.object({
  batteryLevel: z.number().int().min(0).max(100).optional(),
  isCharging: z.boolean().optional(),
  simCarrier: z.string().optional(),
  simSlot: z.number().int().optional(),
});

const ackJobSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(['SENDING', 'SUBMITTED', 'FAILED']),
  rawResponse: z.string().optional(),
  failureReason: z.string().optional(),
  isUncertainOutcome: z.boolean().optional(),
});

export class DeviceController {
  /**
   * POST /api/v1/device/register
   * Pairing handshake called by the Android gateway.
   */
  static async register(req: Request, res: Response): Promise<void> {
    const parseResult = registerDeviceSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCode.VALIDATION_ERROR, message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const result = await DeviceService.registerDevice(parseResult.data);

    res.status(200).json({
      success: true,
      device: {
        id: result.device.id,
        deviceId: result.device.deviceId,
        name: result.device.name,
      },
      token: result.token,
      signingSecret: result.signingSecret,
    });
  }

  /**
   * POST /api/v1/device/heartbeat
   * Called every 30 seconds by the Android gateway foreground service.
   */
  static async heartbeat(req: AuthenticatedDeviceRequest, res: Response): Promise<void> {
    const parseResult = heartbeatSchema.safeParse(req.body);
    const body = parseResult.success ? parseResult.data : {};
    const device = req.device!;

    const result = await DeviceService.recordHeartbeat({
      deviceId: device.id,
      ...body,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  }

  /**
   * POST /api/v1/device/poll-jobs
   * Device polls for pending SMS dispatch jobs.
   */
  static async pollJobs(req: AuthenticatedDeviceRequest, res: Response): Promise<void> {
    const device = req.device!;
    const jobs = await DeviceService.pollJobs(device.id, 5);

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs: jobs.map((j) => ({
        id: j.id,
        recipientNumber: j.recipientNumber,
        messageBody: j.messageBody,
        createdAt: j.createdAt,
      })),
    });
  }

  /**
   * POST /api/v1/device/ack-job
   * Device reports receipt / radio status (SENDING, SUBMITTED, FAILED).
   */
  static async ackJob(req: AuthenticatedDeviceRequest, res: Response): Promise<void> {
    const parseResult = ackJobSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCode.VALIDATION_ERROR, message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const { jobId, status, rawResponse, failureReason, isUncertainOutcome } = parseResult.data;
    const device = req.device!;

    if (status === 'SENDING') {
      const ok = await QueueService.acknowledgeJob(jobId, device.id);
      res.status(200).json({ success: ok, status: 'SENDING' });
      return;
    }

    const updatedJob = await QueueService.reportOutcome({
      jobId,
      deviceId: device.id,
      outcome: status,
      rawResponse,
      failureReason,
      isUncertainOutcome,
    });

    if (!updatedJob) {
      res.status(400).json({ success: false, error: { code: ErrorCode.NOT_FOUND, message: 'Job not found or already terminal' } });
      return;
    }

    res.status(200).json({
      success: true,
      jobId: updatedJob.id,
      status: updatedJob.status,
    });
  }

  /**
   * GET /api/v1/device/status
   */
  static async getStatus(req: AuthenticatedDeviceRequest, res: Response): Promise<void> {
    const device = req.device!;
    const status = await DeviceService.getDeviceStatus(device.id);

    if (!status) {
      res.status(404).json({ success: false, error: { code: ErrorCode.NOT_FOUND, message: 'Device not found' } });
      return;
    }

    res.status(200).json({
      success: true,
      ...status,
    });
  }
}
