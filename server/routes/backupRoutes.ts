import { Router, Request, Response } from 'express';
import { dbService } from '../db.ts';
import { requireAdminAuth } from '../authMiddleware.ts';
import crypto from 'node:crypto';

const router = Router();

// GET /api/admin/backup/export - Download full database snapshot
router.get('/admin/backup/export', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const cases = dbService.getAllCases(true);
    const media = dbService.getAllMedia();
    const settings = dbService.getSettings();
    const stats = dbService.getArchiveStats();

    const backupPayload = {
      version: '302_DOCKET_BACKUP_v1.0',
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

// POST /api/admin/backup/sync-repo - Sync direct backup using repo access token
router.post('/admin/backup/sync-repo', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { repoUrl, accessToken: providedToken, filePath = 'data/302_docket_backup.json', branch = 'main', commitMessage } = req.body;
    const accessToken = (providedToken || process.env.GITHUB_BACKUP_TOKEN || '').trim();

    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required (e.g., https://github.com/owner/repo or GitHub API URL).' });
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Repository Access Token is required to authenticate sync.' });
    }

    // Prepare current full database dump
    const cases = dbService.getAllCases(true);
    const media = dbService.getAllMedia();
    const settings = dbService.getSettings();
    const stats = dbService.getArchiveStats();

    const backupPayload = {
      system: 'THE 302 DOCKET // REPO SYNC SUBSYSTEM',
      version: '1.0',
      syncedAt: new Date().toISOString(),
      syncedBy: req.admin?.username || 'lead_investigator',
      statistics: {
        totalCases: cases.length,
        totalMedia: media.length,
      },
      cases,
      media,
      settings,
      stats,
    };

    const jsonContent = JSON.stringify(backupPayload, null, 2);
    const base64Content = Buffer.from(jsonContent).toString('base64');

    // Parse repository owner and repo name from URL if standard github url
    let apiUrl = repoUrl.trim();
    const githubRegex = /github\.com\/([^\/]+)\/([^\/\.]+)/;
    const match = repoUrl.match(githubRegex);

    if (match) {
      const owner = match[1];
      const repo = match[2];
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;
    }

    let existingSha: string | null = null;

    // Check if file already exists in repository to obtain SHA for update
    try {
      const checkRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'The-302-Docket-Sync-Agent',
        },
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        existingSha = checkData.sha;
      }
    } catch (checkErr) {
      console.warn('Could not check existing file SHA:', checkErr);
    }

    // Construct commit payload
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const finalCommitMsg = commitMessage?.trim() || `302 Docket: Automated archive backup [${nowStr}]`;

    const commitBody: any = {
      message: finalCommitMsg,
      content: base64Content,
      branch: branch || 'main',
    };
    if (existingSha) {
      commitBody.sha = existingSha;
    }

    // Push file to remote repo via GitHub Contents API
    const pushRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'The-302-Docket-Sync-Agent',
      },
      body: JSON.stringify(commitBody),
    });

    const pushResult = await pushRes.json();

    if (!pushRes.ok) {
      const errorMessage = pushResult.message || `HTTP ${pushRes.status}: Failed to sync with repository.`;
      
      // Update sync log
      const currentSettings = dbService.getSettings() as any;
      currentSettings.syncConfig = {
        ...currentSettings.syncConfig,
        repoUrl,
        filePath,
        branch,
        hasToken: true,
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'FAILED',
        lastSyncLog: errorMessage,
      };
      dbService.updateSettings(currentSettings);

      return res.status(pushRes.status).json({
        success: false,
        error: errorMessage,
        details: pushResult,
      });
    }

    // Success: save configuration and record timestamp
    const maskedToken = accessToken.substring(0, 4) + '****' + accessToken.substring(Math.max(0, accessToken.length - 4));
    const currentSettings = dbService.getSettings() as any;
    currentSettings.syncConfig = {
      repoUrl,
      filePath,
      branch,
      hasToken: true,
      maskedToken,
      lastSyncAt: new Date().toISOString(),
      lastSyncStatus: 'SUCCESS',
      lastSyncLog: `Commit ${pushResult.commit?.sha?.substring(0, 7) || 'OK'}: Synced ${cases.length} cases to ${filePath} (${branch})`,
      commitUrl: pushResult.commit?.html_url,
    };
    dbService.updateSettings(currentSettings);

    return res.json({
      success: true,
      message: `Direct backup synced to repository on branch '${branch}'.`,
      commitSha: pushResult.commit?.sha,
      commitUrl: pushResult.commit?.html_url,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Network or repository synchronization error: ' + err.message });
  }
});

export default router;
