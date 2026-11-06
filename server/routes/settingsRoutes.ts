import { Router, Request, Response } from 'express';
import { dbService } from '../db.ts';
import { requireAdminAuth } from '../authMiddleware.ts';

const router = Router();

// GET /api/settings
router.get('/settings', (_req: Request, res: Response) => {
  const settings = dbService.getSettings();
  return res.json(settings);
});

// Admin: PUT /api/admin/settings
router.put('/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
  const current = dbService.getSettings();
  const updated = {
    ...current,
    ...req.body,
  };
  dbService.updateSettings(updated);
  return res.json(updated);
});

export default router;
