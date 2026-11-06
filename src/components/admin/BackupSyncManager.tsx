import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  GitBranch,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  FileCode,
  Server,
  Eye,
  EyeOff,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine.ts';

export const BackupSyncManager: React.FC = () => {
  // Sync state
  const [repoUrl, setRepoUrl] = useState('https://github.com/profliersparadox-cpu/302-docket-');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [filePath, setFilePath] = useState('data/302_docket_backup.json');
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message?: string;
    commitSha?: string;
    commitUrl?: string;
    error?: string;
  } | null>(null);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  // Saved config state
  const [savedConfig, setSavedConfig] = useState<any>(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/backup/config');
      if (res.ok) {
        const data = await res.json();
        setSavedConfig(data);
        if (data.repoUrl) setRepoUrl(data.repoUrl);
        if (data.filePath) setFilePath(data.filePath);
        if (data.branch) setBranch(data.branch);
      }
    } catch (err) {
      console.error('Failed to load backup config:', err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleExportDownload = () => {
    soundEngine.playKeyClick();
    window.location.href = '/api/admin/backup/export';
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playKeyClick();
    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import failed.');
      }

      soundEngine.playBootBeep();
      setImportResult({ success: true, message: data.message });
    } catch (err: any) {
      soundEngine.playWarning();
      setImportResult({ success: false, message: 'Restore error: ' + err.message });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleSyncToRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playKeyClick();

    if (!repoUrl.trim()) {
      setSyncResult({ success: false, error: 'Repository URL is required.' });
      return;
    }

    if (!accessToken.trim()) {
      setSyncResult({ success: false, error: 'Repository Access Token is required.' });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/admin/backup/sync-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          accessToken: accessToken.trim(),
          filePath: filePath.trim() || 'data/302_docket_backup.json',
          branch: branch.trim() || 'main',
          commitMessage: commitMessage.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        soundEngine.playWarning();
        setSyncResult({
          success: false,
          error: data.error || 'Repository sync failed. Check token permissions and repository path.',
        });
      } else {
        soundEngine.playBootBeep();
        setSyncResult({
          success: true,
          message: data.message,
          commitSha: data.commitSha,
          commitUrl: data.commitUrl,
        });
        fetchConfig();
      }
    } catch (err: any) {
      soundEngine.playWarning();
      setSyncResult({ success: false, error: 'Network error: ' + err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8 font-tech text-xs">
      {/* Top Banner */}
      <div className="border-b border-[#2d333b] pb-4">
        <div className="flex items-center space-x-2 text-red-500 font-pixel text-[11px] mb-1">
          <Database className="w-4 h-4" />
          <span>DATA INTEGRITY // DIRECT TOKEN BACKUP & REPO SYNC</span>
        </div>
        <h2 className="text-xl font-bold font-editorial text-zinc-100">
          Database Backup & Remote Repository Synchronization
        </h2>
        <p className="text-zinc-400 text-xs mt-1">
          Ensure zero data loss. Export complete SQLite database snapshots, restore archives, or sync automatically to your Git repository using your Access Token.
        </p>
      </div>

      {/* Render Deployment Ready Configuration */}
      <div className="retro-window p-5 bg-[#0b0e11] border border-emerald-900/50">
        <div className="flex items-center space-x-2 text-xs font-pixel text-emerald-400 mb-2">
          <Server className="w-4 h-4 text-emerald-500" />
          <span>RENDER DEPLOYMENT PARAMETERS (VERIFIED READY)</span>
        </div>
        <p className="text-zinc-300 text-xs mb-3">
          Use the following configuration values in your Render Web Service dashboard to deploy this fullstack repository seamlessly:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/70 p-3 border border-[#21262d] font-mono text-xs">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase font-pixel">Root Directory</div>
            <div className="text-amber-400 font-bold mt-0.5">
              (empty) <span className="text-zinc-600 font-normal">/ leave blank</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 uppercase font-pixel">Build Command</div>
            <div className="text-emerald-400 font-bold mt-0.5">
              npm install && npm run build
            </div>
            <div className="text-[10px] text-zinc-500">or: bun install && bun run build</div>
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 uppercase font-pixel">Start Command</div>
            <div className="text-emerald-400 font-bold mt-0.5">
              npm start
            </div>
            <div className="text-[10px] text-zinc-500">or: bun run start</div>
          </div>
        </div>
      </div>

      {/* Direct Repo Access Token Sync */}
      <div className="retro-window p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#2d333b] mb-4">
          <div className="flex items-center space-x-2 text-xs font-pixel text-amber-400">
            <GitBranch className="w-4 h-4 text-amber-500" />
            <span>REMOTE REPOSITORY TOKEN SYNC</span>
          </div>
          {savedConfig?.lastSyncAt && (
            <span className="text-zinc-500 text-[11px]">
              LAST SYNC: {new Date(savedConfig.lastSyncAt).toLocaleString()} ({savedConfig.lastSyncStatus})
            </span>
          )}
        </div>

        <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
          Provide your target Git repository URL and Personal Access Token (PAT). Clicking <strong>SYNC DIRECT BACKUP</strong> will package the current case dockets, exhibits, settings, and media indexes into a standalone JSON file and commit it directly to your repository via the GitHub Contents API.
        </p>

        {syncResult && (
          <div
            className={`p-3 border rounded-none mb-4 text-xs font-tech flex items-start space-x-2 ${
              syncResult.success
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                : 'bg-red-950/80 border-red-700 text-red-200'
            }`}
          >
            {syncResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div>{syncResult.message || syncResult.error}</div>
              {syncResult.commitUrl && (
                <a
                  href={syncResult.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-300 underline font-bold mt-1 inline-flex items-center"
                >
                  View Commit on Remote Repository <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSyncToRepo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 font-pixel text-[10px] uppercase mb-1">
                REPOSITORY URL *
              </label>
              <input
                type="text"
                required
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/the-302-docket"
                className="w-full bg-[#080a0c] border border-[#2d333b] p-2 text-zinc-100 font-mono text-xs focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-pixel text-[10px] uppercase mb-1">
                TARGET FILE PATH IN REPOSITORY
              </label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="data/302_docket_backup.json"
                className="w-full bg-[#080a0c] border border-[#2d333b] p-2 text-zinc-100 font-mono text-xs focus:border-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-zinc-400 font-pixel text-[10px] uppercase mb-1 flex items-center justify-between">
                <span>REPOSITORY ACCESS TOKEN (PAT / BEARER) *</span>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-zinc-500 hover:text-zinc-300 text-[10px] flex items-center"
                >
                  {showToken ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {showToken ? 'HIDE' : 'REVEAL'}
                </button>
              </label>
              <input
                type={showToken ? 'text' : 'password'}
                required
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or personal access token"
                className="w-full bg-[#080a0c] border border-[#2d333b] p-2 text-amber-300 font-mono text-xs focus:border-red-600"
              />
              <span className="text-[10px] text-zinc-600 block mt-1">
                Token requires `contents: write` or classic `repo` scope to commit the backup file.
              </span>
            </div>

            <div>
              <label className="block text-zinc-400 font-pixel text-[10px] uppercase mb-1">
                BRANCH
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full bg-[#080a0c] border border-[#2d333b] p-2 text-zinc-100 font-mono text-xs focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 font-pixel text-[10px] uppercase mb-1">
              CUSTOM COMMIT MESSAGE (OPTIONAL)
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="e.g., Update 302 Docket cases and JonBenet evidence records"
              className="w-full bg-[#080a0c] border border-[#2d333b] p-2 text-zinc-100 font-mono text-xs focus:border-red-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="text-[11px] text-zinc-500 font-tech">
              Securely transmitted via server-side HTTPS.
            </div>

            <button
              type="submit"
              disabled={isSyncing}
              className="retro-btn retro-btn-green px-4 py-2 font-pixel text-xs flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'COMMITTING TO REPOSITORY...' : 'SYNC DIRECT BACKUP TO REPO'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Manual Export & Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Direct JSON Export */}
        <div className="retro-window p-5 bg-[#0b0e11]">
          <div className="flex items-center space-x-2 text-xs font-pixel text-phosphor mb-2">
            <Download className="w-4 h-4" />
            <span>EXPORT LOCAL SNAPSHOT</span>
          </div>
          <p className="text-zinc-400 text-xs mb-4">
            Download an unencrypted, complete JSON backup containing all case files, 9-chapter narratives, exhibit records, and persons of interest.
          </p>
          <button
            onClick={handleExportDownload}
            className="retro-btn px-4 py-2 text-xs font-pixel flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-phosphor" />
            <span>DOWNLOAD BACKUP (.JSON)</span>
          </button>
        </div>

        {/* Direct JSON Import */}
        <div className="retro-window p-5 bg-[#0b0e11]">
          <div className="flex items-center space-x-2 text-xs font-pixel text-amber-400 mb-2">
            <Upload className="w-4 h-4" />
            <span>RESTORE FROM SNAPSHOT</span>
          </div>
          <p className="text-zinc-400 text-xs mb-4">
            Upload a previously exported 302 Docket backup file to restore records directly into the active SQLite database.
          </p>

          {importResult && (
            <div
              className={`p-2 border mb-3 text-[11px] ${
                importResult.success
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/70 border-red-800 text-red-300'
              }`}
            >
              {importResult.message}
            </div>
          )}

          <label className="retro-btn px-4 py-2 text-xs font-pixel inline-flex items-center space-x-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>{isImporting ? 'RESTORING RECORDS...' : 'SELECT BACKUP FILE'}</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
