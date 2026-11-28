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
    uploaded_at TEXT NOT NULL,
    case_slug TEXT,
    case_number TEXT,
    title TEXT,
    transcript TEXT,
    description TEXT
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

// Safe schema column migrations for media
try { db.exec('ALTER TABLE media ADD COLUMN case_slug TEXT;'); } catch (_) {}
try { db.exec('ALTER TABLE media ADD COLUMN case_number TEXT;'); } catch (_) {}
try { db.exec('ALTER TABLE media ADD COLUMN title TEXT;'); } catch (_) {}
try { db.exec('ALTER TABLE media ADD COLUMN transcript TEXT;'); } catch (_) {}
try { db.exec('ALTER TABLE media ADD COLUMN description TEXT;'); } catch (_) {}

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
  // Only migrate legacy placeholder title if needed; preserve user customizations
  const parsed = JSON.parse(existingSettings.value);
  if (!parsed.archiveTitle || parsed.archiveTitle === 'THE ARCHIVE') {
    db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE key = ?').run(
      JSON.stringify({ ...defaultSettings, ...parsed, archiveTitle: 'THE 302 DOCKET' }),
      new Date().toISOString(),
      'archive_settings'
    );
  }
}

// Ensure canonical admin user babyyoda exists with password '040826'
const salt = bcrypt.genSaltSync(10);
const passwordHash = bcrypt.hashSync('040826', salt);
const babyYodaAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get('babyyoda') as { id: string } | undefined;
if (!babyYodaAdmin) {
  const existingAdmin = db.prepare('SELECT id FROM admins LIMIT 1').get() as { id: string } | undefined;
  if (existingAdmin) {
    db.prepare('UPDATE admins SET username = ?, password_hash = ? WHERE id = ?').run(
      'babyyoda',
      passwordHash,
      existingAdmin.id
    );
  } else {
    db.prepare('INSERT INTO admins (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      'admin-babyyoda',
      'babyyoda',
      passwordHash,
      new Date().toISOString()
    );
  }
  console.log('[Database] Investigator admin configured: username="babyyoda"');
} else {
  db.prepare('UPDATE admins SET password_hash = ? WHERE username = ?').run(
    passwordHash,
    'babyyoda'
  );
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

// Seed curated case media attachments present in public/assets/aistudio
const jonBenetPdfDiskPath = path.resolve(
  process.cwd(),
  'public',
  'assets',
  'aistudio',
  'JonBenet_Ramsey_Audio_Media_Dossier_c0db7b11.pdf'
);
const jonBenetPdfSize = fs.existsSync(jonBenetPdfDiskPath)
  ? fs.statSync(jonBenetPdfDiskPath).size
  : 34816;

const jonBenetMediaTranscript = `THE 302 DOCKET · JONBENÉT RAMSEY AUDIO & ARCHIVAL MEDIA DOSSIER
Case Reference: Boulder, Colorado · December 1996 | Status: Unsolved homicide investigation

01 / AUDIO
- AUD-001: 911 call recording and transcript (Dec 26, 1996) — Independent archive (https://www.jonbenetramsey.com/evidence/)

02 / VIDEO & PUBLIC BRIEFINGS
- VID-001: January 3, 1997 media update — Boulder Public Library (Carnegie Library for Local History)
- VID-002: January 7, 1997 media update — Boulder Public Library
- VID-003: January 1997 community/media roundtable — Boulder Public Library
- VID-004: February 13, 1997 media update — Boulder Public Library
- VID-005: March 6, 1997 media update — Boulder Public Library

03 / OFFICIAL INVESTIGATION UPDATES
- DOC-001: City of Boulder Homicide Investigation Page & Combined Police Press Releases PDF (https://bouldercolorado.gov/jonbenet-ramsey-homicide)

04 / CASE RECORDS & PHOTOGRAPHIC REFERENCE
- DOC-002: Colorado Bureau of Investigation — Cold Case Files Entry #275 (https://apps.colorado.gov/apps/coldcase/casedetail.html?id=275)
- DOC-003: Publicly Collected Reports and Warrants Index (https://www.jonbenetramsey.com/casefiles/)`;

db.prepare(`
  INSERT OR IGNORE INTO media (
    id, filename, original_name, mime_type, size, url, uploaded_at,
    case_slug, case_number, title, transcript, description
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'media-jonbenet-audio-media-dossier-pdf',
  'JonBenet_Ramsey_Audio_Media_Dossier_c0db7b11.pdf',
  'JonBenet_Ramsey_Audio_Media_Dossier_c0db7b11.pdf',
  'application/pdf',
  jonBenetPdfSize,
  '/assets/aistudio/JonBenet_Ramsey_Audio_Media_Dossier_c0db7b11.pdf',
  '2026-11-25T18:13:57.000Z',
  'jonbenet-ramsey-boulder',
  'CASE 001',
  'JonBenét Ramsey — Audio & Archival Media Dossier (AUD-001 to DOC-003)',
  jonBenetMediaTranscript,
  'Curated index of publicly accessible 911 audio, digitized Boulder Public Library media briefings (Jan–Mar 1997), City of Boulder press releases, CBI cold-case listing, and collected case files.'
);

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
  getAllMedia(caseSlug?: string): MediaItem[] {
    let query = 'SELECT * FROM media';
    const params: any[] = [];
    if (caseSlug && caseSlug !== 'all') {
      query += ' WHERE case_slug = ?';
      params.push(caseSlug);
    }
    query += ' ORDER BY uploaded_at DESC';
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      originalName: r.original_name,
      mimeType: r.mime_type,
      size: r.size,
      url: r.url,
      uploadedAt: r.uploaded_at,
      caseSlug: r.case_slug || undefined,
      caseNumber: r.case_number || undefined,
      title: r.title || undefined,
      transcript: r.transcript || undefined,
      description: r.description || undefined,
    }));
  },

  saveMedia(item: MediaItem): MediaItem {
    db.prepare(`
      INSERT INTO media (id, filename, original_name, mime_type, size, url, uploaded_at, case_slug, case_number, title, transcript, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.filename,
      item.originalName,
      item.mimeType,
      item.size,
      item.url,
      item.uploadedAt,
      item.caseSlug || null,
      item.caseNumber || null,
      item.title || null,
      item.transcript || null,
      item.description || null
    );
    return item;
  },

  updateMedia(id: string, updates: Partial<MediaItem>): MediaItem | null {
    const existing = db.prepare('SELECT * FROM media WHERE id = ?').get(id) as any;
    if (!existing) return null;

    const filename = updates.filename !== undefined ? updates.filename : existing.filename;
    const originalName = updates.originalName !== undefined ? updates.originalName : existing.original_name;
    const mimeType = updates.mimeType !== undefined ? updates.mimeType : existing.mime_type;
    const size = updates.size !== undefined ? updates.size : existing.size;
    const url = updates.url !== undefined ? updates.url : existing.url;
    const caseSlug = updates.caseSlug !== undefined ? updates.caseSlug : existing.case_slug;
    const caseNumber = updates.caseNumber !== undefined ? updates.caseNumber : existing.case_number;
    const title = updates.title !== undefined ? updates.title : existing.title;
    const transcript = updates.transcript !== undefined ? updates.transcript : existing.transcript;
    const description = updates.description !== undefined ? updates.description : existing.description;

    db.prepare(`
      UPDATE media
      SET filename = ?, original_name = ?, mime_type = ?, size = ?, url = ?, case_slug = ?, case_number = ?, title = ?, transcript = ?, description = ?
      WHERE id = ?
    `).run(
      filename,
      originalName,
      mimeType,
      size,
      url,
      caseSlug || null,
      caseNumber || null,
      title || null,
      transcript || null,
      description || null,
      id
    );

    return {
      id: existing.id,
      filename,
      originalName,
      mimeType,
      size,
      url,
      uploadedAt: existing.uploaded_at,
      caseSlug: caseSlug || undefined,
      caseNumber: caseNumber || undefined,
      title: title || undefined,
      transcript: transcript || undefined,
      description: description || undefined,
    };
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
