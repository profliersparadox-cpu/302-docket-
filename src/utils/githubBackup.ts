export interface GitHubBackupRequest {
  repoUrl: string;
  accessToken: string;
  filePath?: string;
  branch?: string;
  commitMessage?: string;
  includeMediaFiles?: boolean;
  includeBoardLayouts?: boolean;
}

export interface GitHubBackupResponse {
  success: boolean;
  message?: string;
  commitSha?: string;
  commitUrl?: string;
  filesCommitted?: number;
  photosBackedUp?: number;
  timestamp?: string;
  error?: string;
}

export function collectLocalBoardLayouts(): Record<string, unknown> {
  const layouts: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('board_') ||
          key.startsWith('docket_sticky_notes_') ||
          key.startsWith('docket_workboard_') ||
          key.startsWith('docket_ledger_') ||
          key === 'docket_site_customization_v1' ||
          key === 'docket_custom_media')
      ) {
        const raw = localStorage.getItem(key);
        if (raw) {
          layouts[key] = JSON.parse(raw);
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return layouts;
}

export async function runGitHubBackup(
  payload: GitHubBackupRequest,
  endpoint: string = '/api/backup/github'
): Promise<GitHubBackupResponse> {
  const boardLayouts = payload.includeBoardLayouts !== false ? collectLocalBoardLayouts() : undefined;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repoUrl: payload.repoUrl.trim(),
      accessToken: payload.accessToken.trim(),
      filePath: payload.filePath?.trim() || 'data/302_docket_backup.json',
      branch: payload.branch?.trim() || 'main',
      commitMessage: payload.commitMessage?.trim() || undefined,
      includeMediaFiles: payload.includeMediaFiles !== false,
      boardLayouts,
    }),
  });

  const data = (await res.json()) as GitHubBackupResponse;
  if (!res.ok) {
    return {
      success: false,
      error: data.error || `GitHub backup failed (HTTP ${res.status}).`,
    };
  }
  return data;
}
