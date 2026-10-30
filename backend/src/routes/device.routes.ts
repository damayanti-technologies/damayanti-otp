import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller.js';
import { deviceAuth } from '../middlewares/deviceAuth.middleware.js';

export const deviceRouter = Router();

// Device Registration / Pairing (Public with pairing secret or initial registration)
deviceRouter.post('/api/v1/device/register', DeviceController.register);

// Authenticated Device APIs (Require X-Device-Id + X-Device-Token + HMAC Signature)
deviceRouter.post('/api/v1/device/heartbeat', deviceAuth, DeviceController.heartbeat);
deviceRouter.post('/api/v1/device/poll-jobs', deviceAuth, DeviceController.pollJobs);
deviceRouter.post('/api/v1/device/ack-job', deviceAuth, DeviceController.ackJob);
deviceRouter.get('/api/v1/device/status', deviceAuth, DeviceController.getStatus);
