import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from backend folder or root folder
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  SERVER_BASE_URL: z.string().default('http://localhost:4000'),

  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:4000,https://arrout.damayanticrest.online')
    .transform((val) => val.split(',').map((origin) => origin.trim()).filter(Boolean)),

  DATABASE_URL: z.string().default('file:./dev.db'),

  JWT_SECRET: z.string().min(16).default('development_jwt_secret_must_be_changed_in_prod'),
  DEVICE_HMAC_SECRET: z.string().min(16).default('development_device_hmac_secret_must_be_changed'),
  SESSION_SECRET: z.string().min(16).default('development_session_secret_must_be_changed'),

  OTP_EXPIRY_SECONDS: z.coerce.number().default(300), // 5 minutes
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60), // 60s
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  COMPLIANCE_MODE: z.enum(['DEVELOPMENT_MOCK', 'DEVELOPMENT_RESTRICTED', 'PRODUCTION_DLT']).default('DEVELOPMENT_MOCK'),
  WHITELISTED_TEST_NUMBERS: z
    .string()
    .default('+919876543210,+919999999999')
    .transform((val) => val.split(',').map((num) => num.trim()).filter(Boolean)),

  DEVICE_HEARTBEAT_TIMEOUT_SECONDS: z.coerce.number().default(60),
  DEVICE_POLL_TIMEOUT_MS: z.coerce.number().default(25000),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // eslint-disable-next-line no-console
  console.error('❌ FATAL: Invalid environment variable configuration:');
  // eslint-disable-next-line no-console
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env: EnvConfig = parsedEnv.data;
