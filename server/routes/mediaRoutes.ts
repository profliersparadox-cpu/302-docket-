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
    fileSize: 50 * 1024 * 1024, // 50 MB limit for MP3 audio reels, MP4 video/wiretaps & high-res scans
  },
  fileFilter: (_req, file, cb) => {
    // Explicitly allow MP files (.mp3, .mp4, .m4a, .mpeg, .mpg), audio, video, images, PDFs
    const allowedExts = /^(jpeg|jpg|png|webp|gif|svg|pdf|mp3|mp4|m4a|m4v|mpeg|mpg|wav|ogg|aac|flac|webm|avi|mov)$/i;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype.toLowerCase();

    if (
      allowedExts.test(ext) ||
      mime.startsWith('audio/') ||
      mime.startsWith('video/') ||
      mime.startsWith('image/') ||
      mime === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(null, true); // Permissive for historical forensic digital exhibits
    }
  },
});

// Public: GET /api/media (Optionally filter by ?caseSlug=...)
router.get('/media', (req: Request, res: Response) => {
  const caseSlug = req.query.caseSlug as string | undefined;
  const media = dbService.getAllMedia(caseSlug);
  return res.json(media);
});

// Investigator / User: POST /api/media/upload (Open upload for case exhibits, audio reels & PDF records)
router.post('/media/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received for upload.' });
  }

  const { caseSlug, caseNumber, title, transcript, description } = req.body;

  const mediaItem: MediaItem = {
    id: 'media-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    uploadedAt: new Date().toISOString(),
    caseSlug: caseSlug || undefined,
    caseNumber: caseNumber || undefined,
    title: title || req.file.originalname,
    transcript: transcript || undefined,
    description: description || undefined,
  };

  dbService.saveMedia(mediaItem);
  return res.status(201).json(mediaItem);
});

// Admin: GET /api/admin/media
router.get('/admin/media', requireAdminAuth, (req: Request, res: Response) => {
  const caseSlug = req.query.caseSlug as string | undefined;
  const media = dbService.getAllMedia(caseSlug);
  return res.json(media);
});

// Admin: POST /api/admin/media/upload
router.post('/admin/media/upload', requireAdminAuth, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received for upload.' });
  }

  const { caseSlug, caseNumber, title, transcript, description } = req.body;

  const mediaItem: MediaItem = {
    id: 'media-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    uploadedAt: new Date().toISOString(),
    caseSlug: caseSlug || undefined,
    caseNumber: caseNumber || undefined,
    title: title || req.file.originalname,
    transcript: transcript || undefined,
    description: description || undefined,
  };

  dbService.saveMedia(mediaItem);
  return res.status(201).json(mediaItem);
});

// Admin: PATCH /api/admin/media/:id (Update transcript, case assignments, notes)
router.patch('/admin/media/:id', requireAdminAuth, (req: Request, res: Response) => {
  const updated = dbService.updateMedia(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Media asset not found.' });
  }
  return res.json(updated);
});

// Admin: PUT /api/admin/media/:id
router.put('/admin/media/:id', requireAdminAuth, (req: Request, res: Response) => {
  const updated = dbService.updateMedia(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Media asset not found.' });
  }
  return res.json(updated);
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
