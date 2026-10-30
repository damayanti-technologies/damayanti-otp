import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { apiKeyAuth } from '../middlewares/apiKeyAuth.middleware.js';
import { otpRequestRateLimiter } from '../middlewares/rateLimiter.middleware.js';

export const authRouter = Router();

// Website / Application APIs (Requires X-Api-Key)
authRouter.post('/api/v1/auth/request-otp', apiKeyAuth, otpRequestRateLimiter, AuthController.requestOtp);
authRouter.post('/api/v1/auth/verify-otp', apiKeyAuth, AuthController.verifyOtp);
authRouter.post('/api/v1/auth/resend-otp', apiKeyAuth, otpRequestRateLimiter, AuthController.resendOtp);
authRouter.post('/api/v1/auth/logout', AuthController.logout);
authRouter.get('/api/v1/auth/session', AuthController.getSession);
