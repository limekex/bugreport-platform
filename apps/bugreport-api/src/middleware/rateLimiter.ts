import rateLimit from 'express-rate-limit';
import { config } from '../config';

/** Per-IP rate limiter applied globally */
export const ipRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.rateLimit.perIpPerHour,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.',
  },
});
