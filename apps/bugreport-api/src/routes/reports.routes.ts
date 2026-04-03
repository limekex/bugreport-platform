import { Router } from 'express';
import { upload } from '../middleware/upload';
import { testerRateLimiter } from '../middleware/rateLimiter';
import { submitBugReport } from '../controllers/bugReport.controller';

const router = Router();

/**
 * POST /api/reports/bug
 *
 * Middleware order:
 *  1. multer — parses multipart/form-data, stores optional screenshot in tmp/
 *  2. testerRateLimiter — per-tester sliding-window limit (falls through if no testerId)
 *  3. submitBugReport — validates, creates GitHub issue, returns response
 */
router.post('/bug', upload.single('screenshot'), testerRateLimiter, submitBugReport);

export { router as reportsRouter };
