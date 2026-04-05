/**
 * Admin Tester Management Routes
 * 
 * CRUD endpoints for managing tester accounts (admin-only).
 */

import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth';
import * as testerController from '../controllers/testerAdmin.controller';

const router = Router();

// All routes require admin authentication
router.use(adminAuth);

router.get('/', testerController.listTesters);
router.post('/', testerController.createTesterAdmin);
router.patch('/:id/status', testerController.updateTesterStatus);
router.delete('/:id', testerController.deleteTesterAdmin);

export default router;
