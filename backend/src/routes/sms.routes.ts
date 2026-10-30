import { Router } from 'express';
import { SmsController } from '../controllers/sms.controller.js';
import { apiKeyAuth } from '../middlewares/apiKeyAuth.middleware.js';

export const smsRouter = Router();

// SMS Management APIs
smsRouter.post('/api/v1/sms/test', apiKeyAuth, SmsController.sendTestSms);
smsRouter.get('/api/v1/sms/status', apiKeyAuth, SmsController.getJobStatus);
smsRouter.get('/api/v1/sms/history', apiKeyAuth, SmsController.getHistory);
