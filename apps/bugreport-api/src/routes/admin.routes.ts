import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminAuth } from '../middleware/adminAuth';
import {
  getAllMappings,
  getMappingById,
  createMapping,
  updateMapping,
  deleteMapping,
} from '../store/domainMappingStore';

const router = Router();

// All admin routes require the API key
router.use(adminAuth);

// ── Validation schemas ───────────────────────────────────────────────────────

const createSchema = z.object({
  origin: z.string().url(),
  githubOwner: z.string().min(1).max(100),
  githubRepo: z.string().min(1).max(100),
  githubToken: z.string().min(1).max(500),
  defaultLabels: z.array(z.string().max(50)).default(['bug', 'stage', 'needs-triage']),
});

const updateSchema = z.object({
  origin: z.string().url().optional(),
  githubOwner: z.string().min(1).max(100).optional(),
  githubRepo: z.string().min(1).max(100).optional(),
  githubToken: z.string().min(1).max(500).optional(),
  defaultLabels: z.array(z.string().max(50)).optional(),
});

// ── Handlers ─────────────────────────────────────────────────────────────────

/** GET /api/admin/domains — list all domain mappings */
router.get('/', (_req: Request, res: Response) => {
  const mappings = getAllMappings();

  // Mask tokens in list responses so they are not fully exposed
  const safe = mappings.map((m) => ({
    ...m,
    githubToken: maskToken(m.githubToken),
  }));

  res.json({ success: true, data: safe });
});

/** GET /api/admin/domains/:id — get a single mapping */
router.get('/:id', (req: Request, res: Response) => {
  const mapping = getMappingById(req.params.id);
  if (!mapping) {
    res.status(404).json({ success: false, error: 'Domain mapping not found' });
    return;
  }
  res.json({ success: true, data: { ...mapping, githubToken: maskToken(mapping.githubToken) } });
});

/** POST /api/admin/domains — create a new mapping */
router.post('/', (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const mapping = createMapping(parsed.data);
  res.status(201).json({ success: true, data: { ...mapping, githubToken: maskToken(mapping.githubToken) } });
});

/** PUT /api/admin/domains/:id — update an existing mapping */
router.put('/:id', (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const updated = updateMapping(req.params.id, parsed.data);
  if (!updated) {
    res.status(404).json({ success: false, error: 'Domain mapping not found' });
    return;
  }
  res.json({ success: true, data: { ...updated, githubToken: maskToken(updated.githubToken) } });
});

/** DELETE /api/admin/domains/:id — delete a mapping */
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteMapping(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Domain mapping not found' });
    return;
  }
  res.status(200).json({ success: true, message: 'Domain mapping deleted' });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function maskToken(token: string): string {
  if (token.length <= 8) return '****';
  return token.slice(0, 4) + '****' + token.slice(-4);
}

export { router as adminRouter };
