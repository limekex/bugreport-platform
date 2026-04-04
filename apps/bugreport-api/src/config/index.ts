import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: parseInt(optionalEnv('PORT', '3001'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),

  cors: {
    allowedOrigins: optionalEnv('ALLOWED_ORIGINS', 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  github: {
    owner: optionalEnv('GITHUB_OWNER', ''),
    repo: optionalEnv('GITHUB_REPO', ''),
    token: optionalEnv('GITHUB_TOKEN', ''),
    defaultLabels: optionalEnv('GITHUB_DEFAULT_LABELS', 'bug,stage,needs-triage')
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean),
  },

  admin: {
    /** API key required for admin endpoints. When empty, admin routes are disabled. */
    apiKey: optionalEnv('ADMIN_API_KEY', ''),
  },

  storage: {
    provider: optionalEnv('STORAGE_PROVIDER', 'local') as 'local' | 's3' | 'r2',
    bucket: optionalEnv('STORAGE_BUCKET', ''),
    region: optionalEnv('STORAGE_REGION', ''),
    endpoint: optionalEnv('STORAGE_ENDPOINT', ''),
    accessKey: optionalEnv('STORAGE_ACCESS_KEY', ''),
    secretKey: optionalEnv('STORAGE_SECRET_KEY', ''),
    publicUrlBase: optionalEnv('STORAGE_PUBLIC_URL_BASE', ''),
    signedUrlExpires: parseInt(optionalEnv('STORAGE_SIGNED_URL_EXPIRES', '604800'), 10),
  },

  upload: {
    maxMb: parseInt(optionalEnv('MAX_UPLOAD_MB', '5'), 10),
  },

  rateLimit: {
    perUserPerHour: parseInt(optionalEnv('RATE_LIMIT_PER_USER_PER_HOUR', '20'), 10),
    perIpPerHour: parseInt(optionalEnv('RATE_LIMIT_PER_IP_PER_HOUR', '50'), 10),
  },

  redis: {
    /** Redis connection URL. When set, per-tester rate limiting uses Redis instead of in-memory. */
    url: optionalEnv('REDIS_URL', ''),
  },
} as const;

export type AppConfig = typeof config;
