import React, { useState } from 'react';
import { Save, KeyRound, CheckCircle2, AlertCircle, Database, Shield } from 'lucide-react';
import { ArchiveSettings } from '../../types.ts';
import { useArchive } from '../../context/ArchiveContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const ArchiveSettingsEditor: React.FC = () => {
  const { settings, refreshSettings } = useArchive();
  const { changePassword } = useAuth();

  const [formData, setFormData] = useState<ArchiveSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to update archive settings');
      }

      await refreshSettings();
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      setSettingsError(err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPass(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsChangingPass(false);

    if (result.success) {
      setPassSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 3000);
    } else {
      setPassError(result.error || 'Failed to update password.');
    }
  };

  return (
    <div className="space-y-10">
      {/* Archive Configuration */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-xs font-mono text-amber-500 mb-1">
          <Database className="w-4 h-4" />
          <span>EDITORIAL IDENTITY & ARCHIVE METADATA</span>
        </div>
        <h3 className="text-lg font-bold font-editorial text-zinc-100 mb-4">
          Archive Branding & Public Content
        </h3>

        {settingsSuccess && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-mono rounded flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Archive settings successfully committed to persistent database.</span>
          </div>
        )}

        {settingsError && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-mono rounded flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{settingsError}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                ARCHIVE TITLE
              </label>
              <input
                type="text"
                value={formData.archiveTitle}
                onChange={(e) => setFormData({ ...formData, archiveTitle: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-editorial focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                TAGLINE
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              INTRODUCTORY HEADING
            </label>
            <input
              type="text"
              value={formData.introHeading}
              onChange={(e) => setFormData({ ...formData, introHeading: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              HOMEPAGE INTRODUCTORY BODY
            </label>
            <textarea
              rows={4}
              value={formData.introBody}
              onChange={(e) => setFormData({ ...formData, introBody: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              EDITORIAL DISCLAIMER & NON-AFFILIATION STATEMENT
            </label>
            <textarea
              rows={3}
              value={formData.disclaimer}
              onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-100 text-xs font-mono rounded font-bold tracking-wider transition-colors flex items-center space-x-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingSettings ? 'SAVING...' : 'SAVE ARCHIVE CONFIGURATION'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Credentials Update */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-xs font-mono text-red-500 mb-1">
          <Shield className="w-4 h-4" />
          <span>INVESTIGATOR CLEARANCE SECURITY</span>
        </div>
        <h3 className="text-lg font-bold font-editorial text-zinc-100 mb-2">
          Update Security Clearance Password
        </h3>
        <p className="text-xs font-mono text-zinc-400 mb-4">
          Passwords are salted and hashed using bcrypt on the server.
        </p>

        {passSuccess && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-mono rounded flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Master clearance password successfully updated.</span>
          </div>
        )}

        {passError && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-mono rounded flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              CURRENT CLEARANCE PASSWORD
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              NEW CLEARANCE PASSWORD (MIN 8 CHARACTERS)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              CONFIRM NEW PASSWORD
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPass}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-mono rounded transition-colors flex items-center space-x-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isChangingPass ? 'UPDATING...' : 'UPDATE PASSWORD'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
