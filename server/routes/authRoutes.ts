import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbService } from '../db.ts';
import { requireAdminAuth } from '../authMiddleware.ts';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
  const rateLimit = dbService.checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Security threshold exceeded. Too many failed attempts. Try again in ${rateLimit.waitMinutes} minutes.`,
    });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and clearance password are required.' });
  }

  const admin = dbService.getAdminByUsername(username.trim());
  if (!admin) {
    dbService.recordFailedLogin(ip);
    return res.status(401).json({ error: 'Invalid investigator credentials.' });
  }

  const valid = bcrypt.compareSync(password, admin.passwordHash);
  if (!valid) {
    dbService.recordFailedLogin(ip);
    return res.status(401).json({ error: 'Invalid investigator credentials.' });
  }

  // Reset failed attempts on success
  dbService.resetLoginAttempts(ip);
  dbService.recordAdminLogin(admin.id);

  const token = dbService.createSession(admin.id);

  // Set HTTP-only cookie
  res.cookie('archive_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  return res.json({
    message: 'Investigator authorization granted.',
    token,
    user: {
      id: admin.id,
      username: admin.username,
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  const token = req.cookies?.archive_session || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    dbService.deleteSession(token);
  }
  res.clearCookie('archive_session');
  return res.json({ message: 'Session terminated. Clearance revoked.' });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  const token = req.cookies?.archive_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  const admin = dbService.getSessionAdmin(token);
  if (!admin) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    user: admin,
  });
});

// POST /api/auth/change-password
router.post('/change-password', requireAdminAuth, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  const admin = dbService.getAdminByUsername(req.admin!.username);
  if (!admin) {
    return res.status(404).json({ error: 'Admin record not found.' });
  }

  const matches = bcrypt.compareSync(currentPassword, admin.passwordHash);
  if (!matches) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  dbService.updateAdminPassword(admin.id, newHash);

  return res.json({ message: 'Security clearance password successfully updated.' });
});

export default router;
