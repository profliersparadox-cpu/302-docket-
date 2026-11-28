import { Router, Request, Response } from 'express';
import { dbService } from '../db.ts';
import { requireAdminAuth, optionalAdminAuth } from '../authMiddleware.ts';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const router = Router();
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const PUBLIC_ASSETS_DIR = path.resolve(process.cwd(), 'public', 'assets');

interface ParsedGitHubRepo {
  owner: string;
  repo: string;
}

function parseGitHubRepoUrl(rawUrl: string): ParsedGitHubRepo | null {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return null;

  // Support explicit owner/repo shorthand or full https://github.com/owner/repo URL
  let owner = '';
  let repo = '';

  if (/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(trimmed)) {
    const parts = trimmed.split('/');
    owner = parts[0];
    repo = parts[1].replace(/\.git$/i, '');
  } else {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'github.com') {
        return null;
      }
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length < 2) return null;
      owner = segments[0];
      repo = segments[1].replace(/\.git$/i, '');
    } catch {
      return null;
    }
  }

  const validSegment = /^[a-zA-Z0-9._-]+$/;
  if (!validSegment.test(owner) || !validSegment.test(repo)) return null;
  if (owner === '..' || repo === '..' || owner === '.' || repo === '.') return null;

  return { owner, repo };
}

function sanitizeRepoPath(rawPath: string | undefined, fallback: string): string {
  const candidate = (rawPath || fallback).trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!candidate) return fallback;
  const parts = candidate.split('/').filter(Boolean);
  if (parts.some((p) => p === '..' || p === '.')) {
    return fallback;
  }
  return parts.join('/');
}

function sanitizeBranch(rawBranch: string | undefined): string {
  const b = (rawBranch || 'main').trim();
  if (!/^[a-zA-Z0-9._\/-]+$/.test(b) || b.includes('..')) {
    return 'main';
  }
  return b;
}

interface RepoFileEntry {
  repoPath: string;
  base64Content: string;
  isBinary: boolean;
}

function collectMediaBackupFiles(): RepoFileEntry[] {
  const entries: RepoFileEntry[] = [];
  const seenPaths = new Set<string>();
  const MAX_SINGLE_FILE_BYTES = 18 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 45 * 1024 * 1024;
  let totalBytes = 0;

  if (fs.existsSync(UPLOADS_DIR)) {
    const dirFiles = fs.readdirSync(UPLOADS_DIR);
    for (const entryName of dirFiles) {
      const safeName = path.basename(entryName);
      const resolved = path.resolve(UPLOADS_DIR, safeName);
      if (!resolved.startsWith(UPLOADS_DIR + path.sep)) continue;

      try {
        const stat = fs.statSync(resolved);
        if (!stat.isFile() || stat.size === 0 || stat.size > MAX_SINGLE_FILE_BYTES) continue;
        if (totalBytes + stat.size > MAX_TOTAL_BYTES) break;

        const buf = fs.readFileSync(resolved);
        const repoPath = `uploads/${safeName}`;
        if (!seenPaths.has(repoPath)) {
          seenPaths.add(repoPath);
          entries.push({
            repoPath,
            base64Content: buf.toString('base64'),
            isBinary: true,
          });
          totalBytes += stat.size;
        }
      } catch {
        // Ignore unreadable transient files
      }
    }
  }

  // Also include curated local PDF/media attachments under /public/assets/aistudio if present
  const aiStudioAssetsDir = path.resolve(PUBLIC_ASSETS_DIR, 'aistudio');
  if (aiStudioAssetsDir.startsWith(PUBLIC_ASSETS_DIR + path.sep) && fs.existsSync(aiStudioAssetsDir)) {
    const assetFiles = fs.readdirSync(aiStudioAssetsDir);
    for (const entryName of assetFiles) {
      const safeName = path.basename(entryName);
      const resolved = path.resolve(aiStudioAssetsDir, safeName);
      if (!resolved.startsWith(aiStudioAssetsDir + path.sep)) continue;

      try {
        const stat = fs.statSync(resolved);
        if (!stat.isFile() || stat.size === 0 || stat.size > MAX_SINGLE_FILE_BYTES) continue;
        if (totalBytes + stat.size > MAX_TOTAL_BYTES) break;

        const buf = fs.readFileSync(resolved);
        const repoPath = `public/assets/aistudio/${safeName}`;
        if (!seenPaths.has(repoPath)) {
          seenPaths.add(repoPath);
          entries.push({
            repoPath,
            base64Content: buf.toString('base64'),
            isBinary: true,
          });
          totalBytes += stat.size;
        }
      } catch {
        // Ignore unreadable asset
      }
    }
  }

  return entries;
}

async function githubRequest(url: string, accessToken: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'The-302-Docket-Sync-Agent',
      ...(init.headers || {}),
    },
  });
}

async function commitViaContentsApi(
  owner: string,
  repo: string,
  branch: string,
  accessToken: string,
  files: RepoFileEntry[],
  commitMessage: string
) {
  let lastCommitSha = '';
  let lastCommitUrl = `https://github.com/${owner}/${repo}/tree/${encodeURIComponent(branch)}`;
  let committedCount = 0;

  for (const file of files) {
    const encodedPath = file.repoPath.split('/').map(encodeURIComponent).join('/');
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
    let existingSha: string | undefined;

    try {
      const checkRes = await githubRequest(`${apiUrl}?ref=${encodeURIComponent(branch)}`, accessToken);
      if (checkRes.ok) {
        const checkData = (await checkRes.json()) as { sha?: string };
        existingSha = checkData.sha;
      }
    } catch {
      // Ignore check errors for new paths
    }

    const bodyPayload: Record<string, string> = {
      message: `${commitMessage} [${path.basename(file.repoPath)}]`,
      content: file.base64Content,
      branch,
    };
    if (existingSha) bodyPayload.sha = existingSha;

    const putRes = await githubRequest(apiUrl, accessToken, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });

    const putData = (await putRes.json()) as any;
    if (!putRes.ok) {
      throw Object.assign(new Error(putData.message || `GitHub HTTP ${putRes.status}`), {
        status: putRes.status,
        details: putData,
      });
    }

    committedCount++;
    lastCommitSha = putData.commit?.sha || lastCommitSha;
    lastCommitUrl = putData.commit?.html_url || lastCommitUrl;
  }

  return {
    commitSha: lastCommitSha,
    commitUrl: lastCommitUrl,
    committedCount,
  };
}

async function performGitHubSync(options: {
  repoUrl: string;
  accessToken: string;
  filePath?: string;
  branch?: string;
  commitMessage?: string;
  includeMediaFiles?: boolean;
  boardLayouts?: Record<string, unknown>;
  isAdmin: boolean;
  actorName: string;
}) {
  const parsed = parseGitHubRepoUrl(options.repoUrl);
  if (!parsed) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Valid GitHub repository URL is required (e.g., https://github.com/username/repo).',
      },
    };
  }

  const cleanToken = (options.accessToken || '').trim();
  if (!cleanToken) {
    return {
      status: 400,
      body: { success: false, error: 'GitHub Personal Access Token is required.' },
    };
  }

  const branch = sanitizeBranch(options.branch);
  const jsonFilePath = sanitizeRepoPath(options.filePath, 'data/302_docket_backup.json');
  const includeMedia = options.includeMediaFiles !== false;

  const cases = dbService.getAllCases(options.isAdmin);
  const media = dbService.getAllMedia();
  const rawSettings = dbService.getSettings() as any;
  const safeSettings = options.isAdmin
    ? rawSettings
    : {
        archiveTitle: rawSettings.archiveTitle,
        tagline: rawSettings.tagline,
        disclaimer: rawSettings.disclaimer,
        introHeading: rawSettings.introHeading,
        introBody: rawSettings.introBody,
      };
  const stats = dbService.getArchiveStats();

  const photoEntries = includeMedia ? collectMediaBackupFiles() : [];

  const backupPayload = {
    system: 'THE 302 DOCKET // GITHUB BACKUP SUBSYSTEM',
    version: '1.1',
    syncedAt: new Date().toISOString(),
    syncedBy: options.actorName,
    statistics: {
      totalCases: cases.length,
      totalMedia: media.length,
      backedUpMediaFiles: photoEntries.length,
    },
    cases,
    media,
    boardLayouts: options.boardLayouts || {},
    settings: safeSettings,
    stats,
  };

  const jsonContent = JSON.stringify(backupPayload, null, 2);
  const filesToCommit: RepoFileEntry[] = [
    {
      repoPath: jsonFilePath,
      base64Content: Buffer.from(jsonContent, 'utf8').toString('base64'),
      isBinary: false,
    },
    ...photoEntries,
  ];

  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const finalCommitMsg =
    options.commitMessage?.trim() ||
    `302 Docket Backup: ${cases.length} cases, ${photoEntries.length} media files [${nowStr}]`;

  const { owner, repo } = parsed;
  let commitSha = '';
  let commitUrl = `https://github.com/${owner}/${repo}/tree/${encodeURIComponent(branch)}`;

  try {
    // Attempt atomic single-commit Git Trees API first (if branch already exists)
    const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`;
    const refRes = await githubRequest(refUrl, cleanToken);

    if (refRes.ok) {
      const refData = (await refRes.json()) as { object?: { sha: string } };
      const headSha = refData.object?.sha;

      if (!headSha) {
        throw new Error('Could not resolve head commit SHA for branch.');
      }

      const baseCommitRes = await githubRequest(
        `https://api.github.com/repos/${owner}/${repo}/git/commits/${headSha}`,
        cleanToken
      );
      if (!baseCommitRes.ok) {
        const errData = (await baseCommitRes.json()) as any;
        throw Object.assign(new Error(errData.message || 'Failed to read base commit.'), {
          status: baseCommitRes.status,
          details: errData,
        });
      }
      const baseCommit = (await baseCommitRes.json()) as { tree: { sha: string } };

      const treeNodes: Array<{ path: string; mode: string; type: string; sha: string }> = [];

      for (const entry of filesToCommit) {
        const blobRes = await githubRequest(
          `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
          cleanToken,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: entry.base64Content,
              encoding: 'base64',
            }),
          }
        );

        const blobData = (await blobRes.json()) as any;
        if (!blobRes.ok || !blobData.sha) {
          throw Object.assign(new Error(blobData.message || `Failed to upload ${entry.repoPath}`), {
            status: blobRes.status,
            details: blobData,
          });
        }

        treeNodes.push({
          path: entry.repoPath,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        });
      }

      const treeRes = await githubRequest(
        `https://api.github.com/repos/${owner}/${repo}/git/trees`,
        cleanToken,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base_tree: baseCommit.tree.sha,
            tree: treeNodes,
          }),
        }
      );

      const treeData = (await treeRes.json()) as any;
      if (!treeRes.ok || !treeData.sha) {
        throw Object.assign(new Error(treeData.message || 'Failed to construct Git tree.'), {
          status: treeRes.status,
          details: treeData,
        });
      }

      const newCommitRes = await githubRequest(
        `https://api.github.com/repos/${owner}/${repo}/git/commits`,
        cleanToken,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: finalCommitMsg,
            tree: treeData.sha,
            parents: [headSha],
          }),
        }
      );

      const newCommitData = (await newCommitRes.json()) as any;
      if (!newCommitRes.ok || !newCommitData.sha) {
        throw Object.assign(new Error(newCommitData.message || 'Failed to create commit.'), {
          status: newCommitRes.status,
          details: newCommitData,
        });
      }

      const updateRefRes = await githubRequest(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
        cleanToken,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sha: newCommitData.sha }),
        }
      );

      const updateRefData = (await updateRefRes.json()) as any;
      if (!updateRefRes.ok) {
        throw Object.assign(new Error(updateRefData.message || 'Failed to advance branch ref.'), {
          status: updateRefRes.status,
          details: updateRefData,
        });
      }

      commitSha = newCommitData.sha;
      commitUrl = `https://github.com/${owner}/${repo}/commit/${commitSha}`;
    } else if (refRes.status === 404 || refRes.status === 409) {
      // Empty repo or new branch: fall back to Contents API (creates branch on first file PUT)
      const contentsResult = await commitViaContentsApi(
        owner,
        repo,
        branch,
        cleanToken,
        filesToCommit,
        finalCommitMsg
      );
      commitSha = contentsResult.commitSha;
      commitUrl = contentsResult.commitUrl;
    } else {
      const errData = (await refRes.json()) as any;
      throw Object.assign(new Error(errData.message || `GitHub HTTP ${refRes.status}`), {
        status: refRes.status,
        details: errData,
      });
    }

    if (options.isAdmin) {
      const maskedToken =
        cleanToken.substring(0, 4) +
        '****' +
        cleanToken.substring(Math.max(0, cleanToken.length - 4));
      rawSettings.syncConfig = {
        repoUrl: `https://github.com/${owner}/${repo}`,
        filePath: jsonFilePath,
        branch,
        hasToken: true,
        maskedToken,
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        lastSyncLog: `Commit ${commitSha.substring(0, 7) || 'OK'}: Backed up ${cases.length} cases & ${photoEntries.length} media files (${branch})`,
        commitUrl,
      };
      dbService.updateSettings(rawSettings);
    }

    return {
      status: 200,
      body: {
        success: true,
        message: `Backed up ${cases.length} case(s) and ${photoEntries.length} photo/media file(s) to ${owner}/${repo} (${branch}).`,
        commitSha,
        commitUrl,
        filesCommitted: filesToCommit.length,
        photosBackedUp: photoEntries.length,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    const statusCode = typeof err.status === 'number' && err.status >= 400 ? err.status : 500;
    const errorMessage = err.message || 'GitHub synchronization failed.';

    if (options.isAdmin) {
      rawSettings.syncConfig = {
        ...rawSettings.syncConfig,
        repoUrl: `https://github.com/${owner}/${repo}`,
        filePath: jsonFilePath,
        branch,
        hasToken: true,
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'FAILED',
        lastSyncLog: errorMessage,
      };
      dbService.updateSettings(rawSettings);
    }

    return {
      status: statusCode,
      body: {
        success: false,
        error: errorMessage,
        details: err.details,
      },
    };
  }
}

// GET /api/admin/backup/export - Download full database snapshot
router.get('/admin/backup/export', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const cases = dbService.getAllCases(true);
    const media = dbService.getAllMedia();
    const settings = dbService.getSettings();
    const stats = dbService.getArchiveStats();

    const backupPayload = {
      version: '302_DOCKET_BACKUP_v1.1',
      timestamp: new Date().toISOString(),
      metadata: {
        totalCases: cases.length,
        totalMedia: media.length,
      },
      cases,
      media,
      settings,
      stats,
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const hash = crypto.createHash('sha256').update(jsonString).digest('hex');

    const filename = `302_docket_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Backup-Checksum', hash);

    return res.send(jsonString);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate backup: ' + err.message });
  }
});

// POST /api/admin/backup/import - Restore database from JSON snapshot
router.post('/admin/backup/import', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { backupData } = req.body;
    if (!backupData || !Array.isArray(backupData.cases)) {
      return res.status(400).json({ error: 'Invalid backup format: cases array is required.' });
    }

    let restoredCount = 0;
    for (const c of backupData.cases) {
      if (c.id && c.title && c.caseNumber) {
        dbService.saveCase(c);
        restoredCount++;
      }
    }

    if (backupData.settings) {
      dbService.updateSettings(backupData.settings);
    }

    return res.json({
      success: true,
      message: `Successfully restored ${restoredCount} case docket(s) into database.`,
      restoredCases: restoredCount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to restore backup: ' + err.message });
  }
});

// GET /api/admin/backup/config - Retrieve saved repository sync config
router.get('/admin/backup/config', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const raw = dbService.getSettings() as any;
    const syncConfig = raw.syncConfig || {
      repoUrl: 'https://github.com/profliersparadox-cpu/302-docket-',
      filePath: 'data/302_docket_backup.json',
      branch: 'main',
      hasToken: Boolean(process.env.GITHUB_BACKUP_TOKEN),
      lastSyncAt: null,
      lastSyncStatus: null,
      lastSyncLog: null,
    };

    return res.json(syncConfig);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Public / Website UI metadata for default repo target (never leaks tokens or secrets)
router.get('/backup/github/defaults', (_req: Request, res: Response) => {
  try {
    const raw = dbService.getSettings() as any;
    const sc = raw?.syncConfig;
    const mediaCount = dbService.getAllMedia().length;
    const uploadFilesCount = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR).length : 0;

    return res.json({
      repoUrl: sc?.repoUrl || 'https://github.com/profliersparadox-cpu/302-docket-',
      filePath: sc?.filePath || 'data/302_docket_backup.json',
      branch: sc?.branch || 'main',
      lastSyncAt: sc?.lastSyncAt || null,
      lastSyncStatus: sc?.lastSyncStatus || null,
      mediaCount,
      uploadFilesCount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Website / Investigator GitHub Sync using user's PAT entered directly on the website
router.post('/backup/github', optionalAdminAuth, async (req: Request, res: Response) => {
  const {
    repoUrl,
    accessToken: providedToken,
    filePath,
    branch,
    commitMessage,
    includeMediaFiles,
    boardLayouts,
  } = req.body || {};

  const token = (providedToken || (req.admin ? process.env.GITHUB_BACKUP_TOKEN : '') || '').trim();
  const result = await performGitHubSync({
    repoUrl,
    accessToken: token,
    filePath,
    branch,
    commitMessage,
    includeMediaFiles,
    boardLayouts: boardLayouts && typeof boardLayouts === 'object' ? boardLayouts : undefined,
    isAdmin: Boolean(req.admin),
    actorName: req.admin?.username || 'website_investigator',
  });

  return res.status(result.status).json(result.body);
});

// POST /api/admin/backup/sync-repo - Admin sync direct backup using repo access token
router.post('/admin/backup/sync-repo', requireAdminAuth, async (req: Request, res: Response) => {
  const {
    repoUrl,
    accessToken: providedToken,
    filePath,
    branch,
    commitMessage,
    includeMediaFiles,
    boardLayouts,
  } = req.body || {};

  const token = (providedToken || process.env.GITHUB_BACKUP_TOKEN || '').trim();
  const result = await performGitHubSync({
    repoUrl,
    accessToken: token,
    filePath,
    branch,
    commitMessage,
    includeMediaFiles,
    boardLayouts: boardLayouts && typeof boardLayouts === 'object' ? boardLayouts : undefined,
    isAdmin: true,
    actorName: req.admin?.username || 'lead_investigator',
  });

  return res.status(result.status).json(result.body);
});

export default router;
