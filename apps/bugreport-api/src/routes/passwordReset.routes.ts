/**
 * Password Reset Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createResetToken, getTesterByResetToken, resetPassword, getTesterByEmail } from '../store/testerStore';
import { logger } from '../lib/logger';

const router = Router();

const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(8).max(100),
});

/**
 * POST /api/password/forgot
 * Request a password reset token
 */
router.post('/forgot', async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const tester = getTesterByEmail(email);
    
    // For security, always return success even if email doesn't exist
    if (!tester) {
      logger.info({ email }, 'Password reset requested for non-existent email');
      res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent',
      });
      return;
    }

    const resetToken = createResetToken(email);

    if (!resetToken) {
      res.status(500).json({
        success: false,
        error: 'Failed to create reset token',
      });
      return;
    }

    logger.info({ testerId: tester.id, email }, 'Password reset token created');

    // In production, send an email with the reset link
    // For now, we'll log it (simulated email)
    logger.info(
      { resetToken, email },
      `[SIMULATED EMAIL] Password reset link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent',
      // In dev/staging, include token for testing (remove in production!)
      ...(process.env.NODE_ENV !== 'production' && { token: resetToken }),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format',
        details: err.errors,
      });
      return;
    }

    logger.error({ err }, 'Forgot password request failed');
    res.status(500).json({
      success: false,
      error: 'Failed to process request',
    });
  }
});

/**
 * POST /api/password/reset
 * Reset password using token
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const tester = getTesterByResetToken(token);

    if (!tester) {
      res.status(404).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
      return;
    }

    const success = await resetPassword(token, password);

    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Failed to reset password',
      });
      return;
    }

    logger.info({ testerId: tester.id, email: tester.email }, 'Password reset successfully');

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: err.errors,
      });
      return;
    }

    logger.error({ err }, 'Password reset failed');
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
    });
  }
});

export default router;
