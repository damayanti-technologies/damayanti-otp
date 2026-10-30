import { Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { JobStatus, DeviceStatus } from '../constants/status.js';
import { z } from 'zod';

const disableDeviceSchema = z.object({
  deviceId: z.string().min(1),
});

export class AdminController {
  /**
   * GET /api/v1/admin/dashboard
   */
  static async getDashboard(req: Request, res: Response): Promise<void> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalOtpRequests,
      queuedJobs,
      messagesSubmitted,
      failedMessages,
      activeDevices,
      messagesSentToday,
      activeDeviceList,
    ] = await Promise.all([
      prisma.oTPRequest.count(),
      prisma.sMSJob.count({ where: { status: JobStatus.QUEUED } }),
      prisma.sMSJob.count({ where: { status: JobStatus.SUBMITTED } }),
      prisma.sMSJob.count({ where: { status: JobStatus.FAILED } }),
      prisma.androidDevice.count({ where: { status: DeviceStatus.ONLINE } }),
      prisma.sMSJob.count({
        where: {
          status: JobStatus.SUBMITTED,
          submittedAt: { gte: startOfDay },
        },
      }),
      prisma.androidDevice.findMany({
        where: { status: DeviceStatus.ONLINE },
        select: { id: true, deviceId: true, name: true, lastHeartbeat: true, batteryLevel: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        totalOtpRequests,
        queuedJobs,
        messagesSubmitted,
        failedMessages,
        activeDevices,
        messagesSentToday,
      },
      gateway: {
        isOnline: activeDevices > 0,
        activeDeviceCount: activeDevices,
        devices: activeDeviceList,
      },
    });
  }

  /**
   * GET /api/v1/admin/messages
   */
  static async getMessages(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '25', 10)));
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.sMSJob.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          application: { select: { appId: true, name: true } },
          device: { select: { name: true, model: true } },
        },
      }),
      prisma.sMSJob.count(),
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      messages: jobs,
    });
  }

  /**
   * GET /api/v1/admin/devices
   */
  static async getDevices(req: Request, res: Response): Promise<void> {
    const devices = await prisma.androidDevice.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { smsJobs: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      devices,
    });
  }

  /**
   * GET /api/v1/admin/statistics
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    // 7-day daily histogram
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentOtps, recentJobs] = await Promise.all([
      prisma.oTPRequest.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, isVerified: true },
      }),
      prisma.sMSJob.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, status: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      counts: {
        totalOtpsLast7Days: recentOtps.length,
        totalJobsLast7Days: recentJobs.length,
      },
      data: {
        otps: recentOtps,
        jobs: recentJobs,
      },
    });
  }

  /**
   * POST /api/v1/admin/device/disable
   */
  static async disableDevice(req: Request, res: Response): Promise<void> {
    const parseResult = disableDeviceSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Invalid deviceId' });
      return;
    }

    const { deviceId } = parseResult.data;
    const device = await prisma.androidDevice.findFirst({
      where: { OR: [{ id: deviceId }, { deviceId }] },
    });

    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    await prisma.androidDevice.update({
      where: { id: device.id },
      data: { status: DeviceStatus.DISABLED },
    });

    res.status(200).json({
      success: true,
      message: `Device ${device.name} (${device.deviceId}) disabled successfully`,
    });
  }
}
