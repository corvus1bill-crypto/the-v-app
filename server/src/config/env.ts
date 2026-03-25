import 'dotenv/config';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test') {
  process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/thev_test';
  process.env.JWT_SECRET ||= 'test-jwt-secret-min-16-chars';
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  TRUST_PROXY: z.coerce.number().default(0),
  UPLOAD_DIR: z.string().default('./uploads'),
  PUBLIC_BASE_URL: z.string().optional(),
  FORCE_HTTPS: z.enum(['true', 'false']).optional(),
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}

export const env = loadEnv();
