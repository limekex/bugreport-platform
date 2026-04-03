import { Router } from 'express';
import { upload } from '../middleware/upload';
import { submitBugReport } from '../controllers/bugReport.controller';

const router = Router();

/**
 * POST /api/reports/bug
 *
 * Accepts multipart/form-data. Text fields are validated against bugReportSchema.
 * An optional 'screenshot' file field may be included (PNG/JPEG/WebP/GIF).
 */
router.post('/bug', upload.single('screenshot'), submitBugReport);

export { router as reportsRouter };
