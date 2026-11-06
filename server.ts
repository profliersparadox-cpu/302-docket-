import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './server/routes/authRoutes.ts';
import caseRoutes from './server/routes/caseRoutes.ts';
import mediaRoutes from './server/routes/mediaRoutes.ts';
import settingsRoutes from './server/routes/settingsRoutes.ts';
import backupRoutes from './server/routes/backupRoutes.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Static uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', caseRoutes);
app.use('/api', mediaRoutes);
app.use('/api', settingsRoutes);
app.use('/api', backupRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'active', archive: 'THE 302 ARCHIVE', timestamp: new Date().toISOString() });
});

// Vite Middleware in dev or static files in production
if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distDir = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[THE 302 ARCHIVE] Server online at http://0.0.0.0:${PORT}`);
});
