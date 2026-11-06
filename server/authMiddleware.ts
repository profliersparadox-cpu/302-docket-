import { Request, Response, NextFunction } from 'express';
import { dbService } from './db.ts';
import { AdminUser } from '../src/types.ts';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
    }
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.archive_session || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Investigator authorization required: No active session.' });
  }

  const admin = dbService.getSessionAdmin(token);
  if (!admin) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.admin = admin;
  next();
}

export function optionalAdminAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.archive_session || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const admin = dbService.getSessionAdmin(token);
    if (admin) {
      req.admin = admin;
    }
  }
  next();
}
