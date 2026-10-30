import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { adminAuth } from '../middlewares/adminAuth.middleware.js';

export const adminRouter = Router();

// Administrative APIs (Protected by adminAuth)
adminRouter.get('/api/v1/admin/dashboard', adminAuth, AdminController.getDashboard);
adminRouter.get('/api/v1/admin/messages', adminAuth, AdminController.getMessages);
adminRouter.get('/api/v1/admin/devices', adminAuth, AdminController.getDevices);
adminRouter.get('/api/v1/admin/statistics', adminAuth, AdminController.getStatistics);
adminRouter.post('/api/v1/admin/device/disable', adminAuth, AdminController.disableDevice);
