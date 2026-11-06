import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { dbService } from '../db.ts';
import { requireAdminAuth } from '../authMiddleware.ts';
import { MediaItem } from '../../src/types.ts';

const router = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit
  },
});

// Admin: GET /api/admin/media
router.get('/admin/media', requireAdminAuth, (_req: Request, res: Response) => {
  const media = dbService.getAllMedia();
  return res.json(media);
});

// Admin: POST /api/admin/media/upload
router.post('/admin/media/upload', requireAdminAuth, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received for upload.' });
  }

  const mediaItem: MediaItem = {
    id: 'media-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    uploadedAt: new Date().toISOString(),
  };

  dbService.saveMedia(mediaItem);
  return res.status(201).json(mediaItem);
});

// Admin: DELETE /api/admin/media/:id
router.delete('/admin/media/:id', requireAdminAuth, (req: Request, res: Response) => {
  const result = dbService.deleteMedia(req.params.id);
  if (!result.success) {
    return res.status(404).json({ error: 'Media asset not found.' });
  }

  if (result.filename) {
    const filePath = path.join(UPLOADS_DIR, result.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to unlink file on disk:', err);
      }
    }
  }

  return res.json({ message: 'Media record and asset deleted.' });
});

export default router;
