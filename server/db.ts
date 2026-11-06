import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { CaseFile, ArchiveSettings, MediaItem, AdminUser, ArchiveStats } from '../src/types.ts';
import { initialCases } from './seedData.ts';

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'archive.sqlite');
const db = new DatabaseSync(DB_PATH);

// Run initial schema migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    case_number TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    year INTEGER NOT NULL,
    status TEXT NOT NULL,
    is_published INTEGER NOT NULL DEFAULT 1,
    is_featured INTEGER NOT NULL DEFAULT 0,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    ip TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at INTEGER NOT NULL
  );
`);

// Seed default settings or update if legacy
const defaultSettings: ArchiveSettings = {
  archiveTitle: 'THE 302 DOCKET',
  tagline: 'Every case leaves a paper trail.',
  disclaimer:
    'The 302 Docket is an independent cyber-investigative archive inspired by 1990s law enforcement terminals, Form FD-302 casework, and public judicial records. Not affiliated with the FBI, the Department of Justice, or any law enforcement agency.',
  introHeading: 'SYSTEM DOCKET TERMINAL — FORM FD-302 INVESTIGATIVE SERIES',
  introBody:
    'Welcome to THE 302 DOCKET terminal. Every interview leaves a record. Every case leaves a paper trail. Access classified dossiers, inspect logged physical exhibits, analyze suspect network diagrams, and trace legal precedents across landmark criminal investigations.',
};

const existingSettings = db.prepare('SELECT value FROM settings WHERE key = ?').get('archive_settings') as { value: string } | undefined;
if (!existingSettings) {
  db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)').run(
    'archive_settings',
    JSON.stringify(defaultSettings),
    new Date().toISOString()
  );
} else {
  // Ensure branding is updated to THE 302 DOCKET
  const parsed = JSON.parse(existingSettings.value);
  if (parsed.archiveTitle !== 'THE 302 DOCKET') {
    db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE key = ?').run(
      JSON.stringify({ ...parsed, ...defaultSettings }),
      new Date().toISOString(),
      'archive_settings'
    );
  }
}

// Seed default admin if none exists
const existingAdmin = db.prepare('SELECT id FROM admins LIMIT 1').get() as { id: string } | undefined;
if (!existingAdmin) {
  const defaultUsername = process.env.ADMIN_INITIAL_USER || 'lead_investigator';
  const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Archive302@Bureau!Case';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(defaultPassword, salt);
  const adminId = 'admin-' + Math.random().toString(36).substring(2, 10);

  db.prepare('INSERT INTO admins (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
    adminId,
    defaultUsername,
    passwordHash,
    new Date().toISOString()
  );
  console.log(`[Database] Initial admin created: username="${defaultUsername}"`);
}

// Seed or update required starter cases
const upsertCase = db.prepare(`
  INSERT OR REPLACE INTO cases (id, slug, case_number, title, subtitle, category, location, year, status, is_published, is_featured, data, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const c of initialCases) {
  upsertCase.run(
    c.id,
    c.slug,
    c.caseNumber,
    c.title,
    c.subtitle || '',
    c.category,
    c.location,
    c.year,
    c.status,
    c.isPublished ? 1 : 0,
    c.isFeatured ? 1 : 0,
    JSON.stringify(c),
    c.createdAt,
    c.updatedAt
  );
}
console.log(`[Database] Seeded/updated ${initialCases.length} starter cases.`);

export const dbService = {
  // Cases
  getAllCases(includeUnpublished = false): CaseFile[] {
    const query = includeUnpublished
      ? 'SELECT data FROM cases ORDER BY is_featured DESC, case_number ASC, year DESC'
      : 'SELECT data FROM cases WHERE is_published = 1 ORDER BY is_featured DESC, case_number ASC, year DESC';
    const rows = db.prepare(query).all() as { data: string }[];
    return rows.map((r) => JSON.parse(r.data));
  },

  getCaseBySlug(slug: string, includeUnpublished = false): CaseFile | null {
    const query = includeUnpublished
      ? 'SELECT data FROM cases WHERE slug = ?'
      : 'SELECT data FROM cases WHERE slug = ? AND is_published = 1';
    const row = db.prepare(query).get(slug) as { data: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.data);
  },

  getCaseById(id: string): CaseFile | null {
    const row = db.prepare('SELECT data FROM cases WHERE id = ?').get(id) as { data: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.data);
  },

  saveCase(caseData: CaseFile): CaseFile {
    const now = new Date().toISOString();
    const updated = {
      ...caseData,
      updatedAt: now,
      createdAt: caseData.createdAt || now,
    };

    const existing = db.prepare('SELECT id FROM cases WHERE id = ?').get(caseData.id) as { id: string } | undefined;
    if (existing) {
      db.prepare(`
        UPDATE cases SET
          slug = ?,
          case_number = ?,
          title = ?,
          subtitle = ?,
          category = ?,
          location = ?,
          year = ?,
          status = ?,
          is_published = ?,
          is_featured = ?,
          data = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        updated.slug,
        updated.caseNumber,
        updated.title,
        updated.subtitle || '',
        updated.category,
        updated.location,
        updated.year,
        updated.status,
        updated.isPublished ? 1 : 0,
        updated.isFeatured ? 1 : 0,
        JSON.stringify(updated),
        now,
        updated.id
      );
    } else {
      db.prepare(`
        INSERT INTO cases (id, slug, case_number, title, subtitle, category, location, year, status, is_published, is_featured, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        updated.id,
        updated.slug,
        updated.caseNumber,
        updated.title,
        updated.subtitle || '',
        updated.category,
        updated.location,
        updated.year,
        updated.status,
        updated.isPublished ? 1 : 0,
        updated.isFeatured ? 1 : 0,
        JSON.stringify(updated),
        updated.createdAt,
        now
      );
    }
    return updated;
  },

  deleteCase(id: string): boolean {
    const res = db.prepare('DELETE FROM cases WHERE id = ?').run(id);
    return res.changes > 0;
  },

  // Archive Stats
  getArchiveStats(): ArchiveStats {
    const cases = this.getAllCases(false);
    const totalCases = cases.length;
    const activeDossiers = cases.filter((c) => c.status === 'Active Investigation' || c.status === 'Trial / Pending Appeal').length;
    const exhibitsLogged = cases.reduce((acc, c) => acc + (c.evidence ? c.evidence.length : 0), 0);
    
    // Decades
    const years = cases.map((c) => c.year);
    const minYear = years.length ? Math.min(...years) : 1930;
    const maxYear = years.length ? Math.max(...years) : 2026;
    const decadesCovered = Math.max(1, Math.ceil((maxYear - minYear) / 10));

    // Unique jurisdictions
    const jurisdictions = new Set(cases.map((c) => c.overview?.jurisdiction || c.location));
    const jurisdictionsCount = jurisdictions.size;

    // Categories breakdown
    const categoriesBreakdown: Record<string, number> = {};
    for (const c of cases) {
      categoriesBreakdown[c.category] = (categoriesBreakdown[c.category] || 0) + 1;
    }

    return {
      totalCases,
      activeDossiers,
      exhibitsLogged,
      decadesCovered,
      jurisdictionsCount,
      categoriesBreakdown,
    };
  },

  // Settings
  getSettings(): ArchiveSettings {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('archive_settings') as { value: string } | undefined;
    if (!row) {
      return {
        archiveTitle: 'THE 302 ARCHIVE',
        tagline: 'Every interview leaves a record.',
        disclaimer: 'Independent investigative archive.',
        introHeading: 'FD-302',
        introBody: 'Investigative documentation.',
      };
    }
    return JSON.parse(row.value);
  },

  updateSettings(settings: ArchiveSettings): ArchiveSettings {
    const now = new Date().toISOString();
    db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)').run(
      'archive_settings',
      JSON.stringify(settings),
      now
    );
    return settings;
  },

  // Media
  getAllMedia(): MediaItem[] {
    const rows = db.prepare('SELECT * FROM media ORDER BY uploaded_at DESC').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      originalName: r.original_name,
      mimeType: r.mime_type,
      size: r.size,
      url: r.url,
      uploadedAt: r.uploaded_at,
    }));
  },

  saveMedia(item: MediaItem): MediaItem {
    db.prepare(`
      INSERT INTO media (id, filename, original_name, mime_type, size, url, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.filename,
      item.originalName,
      item.mimeType,
      item.size,
      item.url,
      item.uploadedAt
    );
    return item;
  },

  deleteMedia(id: string): { success: boolean; filename?: string } {
    const row = db.prepare('SELECT filename FROM media WHERE id = ?').get(id) as { filename: string } | undefined;
    if (!row) return { success: false };
    db.prepare('DELETE FROM media WHERE id = ?').run(id);
    return { success: true, filename: row.filename };
  },

  // Admin and Auth
  getAdminByUsername(username: string): (AdminUser & { passwordHash: string }) | null {
    const row = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
    };
  },

  getAdminById(id: string): AdminUser | null {
    const row = db.prepare('SELECT id, username, created_at, last_login_at FROM admins WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
    };
  },

  updateAdminPassword(id: string, newPasswordHash: string): boolean {
    const res = db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newPasswordHash, id);
    return res.changes > 0;
  },

  recordAdminLogin(id: string): void {
    const now = new Date().toISOString();
    db.prepare('UPDATE admins SET last_login_at = ? WHERE id = ?').run(now, id);
  },

  createSession(adminId: string, ttlMs = 24 * 60 * 60 * 1000): string {
    const token = 'sess_' + Math.random().toString(36).substring(2) + '_' + Date.now().toString(36);
    const expiresAt = Date.now() + ttlMs;
    const now = new Date().toISOString();
    db.prepare('INSERT INTO sessions (token, admin_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
      token,
      adminId,
      expiresAt,
      now
    );
    return token;
  },

  getSessionAdmin(token: string): AdminUser | null {
    const row = db.prepare('SELECT admin_id, expires_at FROM sessions WHERE token = ?').get(token) as any;
    if (!row) return null;
    if (Date.now() > row.expires_at) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return null;
    }
    return this.getAdminById(row.admin_id);
  },

  deleteSession(token: string): void {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  },

  // Login Rate Limiting (5 failed attempts per 15 min per IP)
  checkRateLimit(ip: string): { allowed: boolean; waitMinutes?: number } {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const row = db.prepare('SELECT attempts, last_attempt_at FROM login_attempts WHERE ip = ?').get(ip) as any;
    if (!row) return { allowed: true };

    if (now - row.last_attempt_at > windowMs) {
      // Window expired, reset
      db.prepare('DELETE FROM login_attempts WHERE ip = ?').run(ip);
      return { allowed: true };
    }

    if (row.attempts >= 5) {
      const waitRemaining = Math.ceil((windowMs - (now - row.last_attempt_at)) / 60000);
      return { allowed: false, waitMinutes: waitRemaining };
    }

    return { allowed: true };
  },

  recordFailedLogin(ip: string): void {
    const now = Date.now();
    const row = db.prepare('SELECT attempts FROM login_attempts WHERE ip = ?').get(ip) as any;
    if (!row) {
      db.prepare('INSERT INTO login_attempts (ip, attempts, last_attempt_at) VALUES (?, 1, ?)').run(ip, now);
    } else {
      db.prepare('UPDATE login_attempts SET attempts = attempts + 1, last_attempt_at = ? WHERE ip = ?').run(now, ip);
    }
  },

  resetLoginAttempts(ip: string): void {
    db.prepare('DELETE FROM login_attempts WHERE ip = ?').run(ip);
  },
};
