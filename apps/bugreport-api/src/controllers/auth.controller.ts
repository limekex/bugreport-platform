/**
 * Auth Controller
 * 
 * Handles tester authentication endpoints:
 * - POST /api/auth/register - Create new tester account
 * - POST /api/auth/login - Authenticate and get JWT token
 * - GET /api/auth/verify - Verify JWT token validity
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createTester,
  authenticateTester,
  updateTesterLastLogin,
  getTesterById,
} from '../store/testerStore.js';
import { generateTesterToken, verifyTesterToken } from '../services/auth.service.js';
import { logger } from '../lib/logger.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ── Controllers ───────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);

    const tester = createTester({
      email: body.email,
      name: body.name,
      password: body.password,
    });

    const token = generateTesterToken({
      testerId: tester.id,
      email: tester.email,
      name: tester.name,
    });

    logger.info({ testerId: tester.id, email: tester.email }, 'Tester registered');

    res.status(201).json({
      success: true,
      token,
      tester: {
        id: tester.id,
        email: tester.email,
        name: tester.name,
      },
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

    if (err instanceof Error && err.message === 'Email already exists') {
      res.status(409).json({
        success: false,
        error: 'Email already exists',
      });
      return;
    }

    logger.error({ err }, 'Registration error');
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);

    const tester = authenticateTester(body.email, body.password);

    if (!tester) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Update last login time
    updateTesterLastLogin(tester.id);

    const token = generateTesterToken({
      testerId: tester.id,
      email: tester.email,
      name: tester.name,
    });

    logger.info({ testerId: tester.id, email: tester.email }, 'Tester logged in');

    res.status(200).json({
      success: true,
      token,
      tester: {
        id: tester.id,
        email: tester.email,
        name: tester.name,
      },
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

    logger.error({ err }, 'Login error');
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
}

export async function verify(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyTesterToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Verify tester still exists and is active
    const tester = getTesterById(payload.testerId);

    if (!tester || !tester.isActive) {
      res.status(401).json({
        success: false,
        error: 'Tester account not found or inactive',
      });
      return;
    }

    res.status(200).json({
      success: true,
      tester: {
        id: tester.id,
        email: tester.email,
        name: tester.name,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Token verification error');
    res.status(500).json({
      success: false,
      error: 'Verification failed',
    });
  }
}
