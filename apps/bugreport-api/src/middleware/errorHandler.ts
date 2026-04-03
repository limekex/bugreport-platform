import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof Error) {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
      success: false,
      error: err.message ?? 'Internal server error',
    });
    return;
  }

  logger.error({ err }, 'Unknown error');
  res.status(500).json({ success: false, error: 'Internal server error' });
}
