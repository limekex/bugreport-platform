/**
 * Tester Admin Controller
 * 
 * Admin-only endpoints for managing tester accounts.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getAllTesters,
  createTester,
  updateTesterStatus as updateStatus,
  deleteTester,
} from '../store/testerStore';
import { logger } from '../lib/logger';

// ── Validation schemas ────────────────────────────────────────────────────────

const createTesterSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

// ── Controllers ───────────────────────────────────────────────────────────────

export async function listTesters(req: Request, res: Response): Promise<void> {
  try {
    const testers = getAllTesters();
    
    res.status(200).json({
      success: true,
      testers,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to list testers');
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve testers',
    });
  }
}

export async function createTesterAdmin(req: Request, res: Response): Promise<void> {
  try {
    const body = createTesterSchema.parse(req.body);

    const tester = await createTester({
      email: body.email,
      name: body.name,
      password: body.password,
    });

    logger.info({ testerId: tester.id, email: tester.email }, 'Tester created by admin');

    res.status(201).json({
      success: true,
      tester,
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

    logger.error({ err }, 'Failed to create tester');
    res.status(500).json({
      success: false,
      error: 'Failed to create tester',
    });
  }
}

export async function updateTesterStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const body = updateStatusSchema.parse(req.body);

    const tester = updateStatus(id, body.isActive);

    if (!tester) {
      res.status(404).json({
        success: false,
        error: 'Tester not found',
      });
      return;
    }

    logger.info({ testerId: id, isActive: body.isActive }, 'Tester status updated');

    res.status(200).json({
      success: true,
      tester,
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

    logger.error({ err }, 'Failed to update tester status');
    res.status(500).json({
      success: false,
      error: 'Failed to update tester',
    });
  }
}

export async function deleteTesterAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const deleted = deleteTester(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Tester not found',
      });
      return;
    }

    logger.info({ testerId: id }, 'Tester deleted by admin');

    res.status(200).json({
      success: true,
      message: 'Tester deleted',
    });
  } catch (err) {
    logger.error({ err }, 'Failed to delete tester');
    res.status(500).json({
      success: false,
      error: 'Failed to delete tester',
    });
  }
}
