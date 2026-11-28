import { Router, Request, Response } from 'express';
import { dbService } from '../db.ts';
import { requireAdminAuth } from '../authMiddleware.ts';

const router = Router();

// GET /api/settings
router.get('/settings', (_req: Request, res: Response) => {
  const settings = dbService.getSettings();
  return res.json(settings);
});

// PUT /api/settings/customize (Self-service site branding & theme customization)
router.put('/settings/customize', (req: Request, res: Response) => {
  const current = dbService.getSettings();
  const body = req.body || {};
  const updated = {
    ...current,
    ...(typeof body.archiveTitle === 'string' ? { archiveTitle: body.archiveTitle } : {}),
    ...(typeof body.tagline === 'string' ? { tagline: body.tagline } : {}),
    ...(typeof body.disclaimer === 'string' ? { disclaimer: body.disclaimer } : {}),
    ...(typeof body.introHeading === 'string' ? { introHeading: body.introHeading } : {}),
    ...(typeof body.introBody === 'string' ? { introBody: body.introBody } : {}),
    customization: {
      ...(current.customization || {}),
      ...(body.customization || body),
    },
  };
  dbService.updateSettings(updated);
  return res.json(updated);
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
