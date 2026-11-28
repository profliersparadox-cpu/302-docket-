import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Shield,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine.ts';
import { runGitHubBackup, GitHubBackupResponse } from '../../utils/githubBackup.ts';

interface GitHubBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCommitMessage?: string;
}

export const GitHubBackupModal: React.FC<GitHubBackupModalProps> = ({
  isOpen,
  onClose,
  defaultCommitMessage,
}) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/profliersparadox-cpu/302-docket-');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [branch, setBranch] = useState('main');
  const [filePath, setFilePath] = useState('data/302_docket_backup.json');
  const [commitMessage, setCommitMessage] = useState(defaultCommitMessage || '');
  const [includeMediaFiles, setIncludeMediaFiles] = useState(true);
  const [includeBoardLayouts, setIncludeBoardLayouts] = useState(true);

  const [statsSummary, setStatsSummary] = useState<{
    mediaCount: number;
    uploadFilesCount: number;
    lastSyncAt: string | null;
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<GitHubBackupResponse | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    if (defaultCommitMessage) {
      setCommitMessage(defaultCommitMessage);
    }

    fetch('/api/backup/github/defaults')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.repoUrl) setRepoUrl(data.repoUrl);
        if (data.branch) setBranch(data.branch);
        if (data.filePath) setFilePath(data.filePath);
        setStatsSummary({
          mediaCount: data.mediaCount ?? 0,
          uploadFilesCount: data.uploadFilesCount ?? 0,
          lastSyncAt: data.lastSyncAt ?? null,
        });
      })
      .catch(() => {});
  }, [isOpen, defaultCommitMessage]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playKeyClick();

    if (!repoUrl.trim() || !accessToken.trim()) {
      setResult({
        success: false,
        error: 'Both GitHub Repository URL and Personal Access Token are required.',
      });
      return;
    }

    setIsSyncing(true);
    setResult(null);

    try {
      const res = await runGitHubBackup({
        repoUrl,
        accessToken,
        filePath,
        branch,
        commitMessage,
        includeMediaFiles,
        includeBoardLayouts,
      });

      if (res.success) {
        soundEngine.playBootBeep();
      } else {
        soundEngine.playWarning();
      }
      setResult(res);
    } catch (err: any) {
      soundEngine.playWarning();
      setResult({ success: false, error: err.message || 'Network error during GitHub backup.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="retro-window bg-[#0a0e13] border-2 border-emerald-600 max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto font-mono text-xs text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-pixel text-xs">
            <GitBranch className="w-4 h-4" />
            <span>GITHUB DIRECT TOKEN BACKUP</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1"
            title="Close backup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-zinc-400 font-tech text-xs leading-relaxed">
          Enter your GitHub repository URL and Personal Access Token (PAT) to commit a full backup directly to GitHub — including edited/uploaded evidence photos, PDF attachments, board layouts, and case dockets.
        </p>

        {statsSummary && (
          <div className="grid grid-cols-2 gap-2 bg-zinc-950 border border-zinc-800 p-2.5 rounded text-[11px]">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Upload Media Files Ready: <strong className="text-zinc-100">{statsSummary.uploadFilesCount}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Media Records Indexed: <strong className="text-zinc-100">{statsSummary.mediaCount}</strong>
              </span>
            </div>
          </div>
        )}

        {result && (
          <div
            className={`p-3 border rounded text-xs flex items-start space-x-2 ${
              result.success
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                : 'bg-red-950/80 border-red-600 text-red-200'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <div>{result.message || result.error}</div>
              {result.commitUrl && (
                <a
                  href={result.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 underline font-bold inline-flex items-center space-x-1"
                >
                  <span>View Commit on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
              GitHub Repository URL *
            </label>
            <input
              type="text"
              required
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full bg-black border border-zinc-700 px-3 py-2 rounded text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-pixel text-zinc-400 uppercase flex items-center space-x-1">
                <Key className="w-3 h-3 text-amber-400" />
                <span>GitHub Personal Access Token (PAT) *</span>
              </label>
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
              >
                {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showToken ? 'HIDE' : 'REVEAL'}</span>
              </button>
            </div>
            <input
              type={showToken ? 'text' : 'password'}
              required
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
              autoComplete="off"
              className="w-full bg-black border border-zinc-700 px-3 py-2 rounded text-amber-300 focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Requires <code className="text-zinc-300">repo</code> or <code className="text-zinc-300">Contents: Read and write</code> scope. Token stays in session memory and is never persisted to disk.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full bg-black border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                Snapshot JSON Path
              </label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="data/302_docket_backup.json"
                className="w-full bg-black border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 bg-zinc-950 border border-zinc-800 p-3 rounded">
            <label className="flex items-center space-x-2 cursor-pointer text-zinc-200">
              <input
                type="checkbox"
                checked={includeMediaFiles}
                onChange={(e) => setIncludeMediaFiles(e.target.checked)}
                className="accent-emerald-500"
              />
              <span>Back up all edited &amp; uploaded photos / media files (<code className="text-amber-300">uploads/*</code>)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer text-zinc-200">
              <input
                type="checkbox"
                checked={includeBoardLayouts}
                onChange={(e) => setIncludeBoardLayouts(e.target.checked)}
                className="accent-emerald-500"
              />
              <span>Include Evidence Board layouts &amp; pinned photo connections</span>
            </label>
          </div>

          <div>
            <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
              Commit Message (Optional)
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="302 Docket: Backup edited evidence photos & case files"
              className="w-full bg-black border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded"
            >
              CLOSE
            </button>
            <button
              type="submit"
              disabled={isSyncing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'SYNCING TO GITHUB...' : 'BACKUP TO GITHUB NOW'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
