/**
 * Email Verification Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { verifyEmail, getTesterByVerificationToken } from '../store/testerStore';
import { logger } from '../lib/logger';

const router = Router();

const verifyEmailSchema = z.object({
  token: z.string().uuid(),
});

router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);

    const tester = getTesterByVerificationToken(token);
    
    if (!tester) {
      res.status(404).json({
        success: false,
        error: 'Invalid or expired verification token',
      });
      return;
    }

    if (tester.emailVerified) {
      res.status(200).json({
        success: true,
        message: 'Email already verified',
      });
      return;
    }

    const verified = verifyEmail(token);

    if (!verified) {
      res.status(400).json({
        success: false,
        error: 'Failed to verify email',
      });
      return;
    }

    logger.info({ testerId: tester.id, email: tester.email }, 'Email verified');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid token format',
        details: err.errors,
      });
      return;
    }

    logger.error({ err }, 'Email verification failed');
    res.status(500).json({
      success: false,
      error: 'Verification failed',
    });
  }
});

export default router;
