import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
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

  // Multer errors — invalid file type or file too large
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // File filter rejections from multer (thrown as plain Error with a descriptive message)
  if (err instanceof Error && err.message.startsWith('Unsupported file type:')) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err instanceof Error) {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
    return;
  }

  logger.error({ err }, 'Unknown error');
  res.status(500).json({ success: false, error: 'Internal server error' });
}
