import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Image as ImageIcon,
  Settings,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Shield,
  LogOut,
  RefreshCw,
  FolderOpen,
  Database,
} from 'lucide-react';
import { CaseFile } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { CaseEditor } from './CaseEditor.tsx';
import { MediaLibrary } from './MediaLibrary.tsx';
import { ArchiveSettingsEditor } from './ArchiveSettingsEditor.tsx';
import { BackupSyncManager } from './BackupSyncManager.tsx';
import { CaseDetail } from '../CaseDetail.tsx';

interface AdminDashboardProps {
  onBackToArchive: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToArchive }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'cases' | 'new_case' | 'media' | 'settings' | 'backup'>('cases');
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCase, setEditingCase] = useState<CaseFile | null>(null);
  const [previewCaseSlug, setPreviewCaseSlug] = useState<string | null>(null);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cases?admin=true');
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleTogglePublished = async (c: CaseFile) => {
    const updated = { ...c, isPublished: !c.isPublished };
    try {
      const res = await fetch(`/api/admin/cases/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setCases((prev) => prev.map((item) => (item.id === c.id ? updated : item)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCase = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete dossier "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/cases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCases((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (previewCaseSlug) {
    return (
      <div>
        <div className="bg-red-950 px-4 py-2 text-xs font-mono text-red-200 border-b border-red-800 flex items-center justify-between">
          <span className="font-bold">PREVIEW MODE — INVESTIGATOR ACCESS VERIFICATION</span>
          <button
            onClick={() => setPreviewCaseSlug(null)}
            className="px-2 py-0.5 bg-zinc-900 text-zinc-100 rounded text-xs hover:bg-zinc-800"
          >
            EXIT PREVIEW
          </button>
        </div>
        <CaseDetail
          caseSlug={previewCaseSlug}
          onBack={() => setPreviewCaseSlug(null)}
          onSelectRelatedCase={(slug) => setPreviewCaseSlug(slug)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Top Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-red-500 mb-1">
            <Shield className="w-4 h-4" />
            <span>AUTHENTICATED INVESTIGATIVE ADMINISTRATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-editorial text-zinc-100">
            Dossier & Archive Control Center
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Logged in as <strong className="text-zinc-200">{user?.username}</strong> | Direct persistent database writes enabled.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToArchive}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 rounded"
          >
            PUBLIC REPOSITORY VIEW
          </button>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-red-950/80 border border-zinc-800 hover:border-red-800 text-xs font-mono text-zinc-400 hover:text-red-300 rounded flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4 mb-8 text-xs font-mono">
        <button
          onClick={() => {
            setEditingCase(null);
            setActiveTab('cases');
          }}
          className={`px-4 py-2 rounded flex items-center space-x-2 transition-colors ${
            activeTab === 'cases' && !editingCase
              ? 'bg-zinc-800 text-red-400 border border-zinc-700 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>CASE DOSSIERS ({cases.length})</span>
        </button>

        <button
          onClick={() => {
            setEditingCase(null);
            setActiveTab('new_case');
          }}
          className={`px-4 py-2 rounded flex items-center space-x-2 transition-colors ${
            activeTab === 'new_case' || editingCase
              ? 'bg-red-950 text-red-200 border border-red-700 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{editingCase ? 'EDITING DOSSIER' : 'NEW INVESTIGATION DOSSIER'}</span>
        </button>

        <button
          onClick={() => {
            setEditingCase(null);
            setActiveTab('media');
          }}
          className={`px-4 py-2 rounded flex items-center space-x-2 transition-colors ${
            activeTab === 'media'
              ? 'bg-zinc-800 text-amber-400 border border-zinc-700 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>MEDIA & EXHIBITS VAULT</span>
        </button>

        <button
          onClick={() => {
            setEditingCase(null);
            setActiveTab('settings');
          }}
          className={`px-4 py-2 rounded flex items-center space-x-2 transition-colors ${
            activeTab === 'settings'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ARCHIVE SETTINGS & SECURITY</span>
        </button>

        <button
          onClick={() => {
            setEditingCase(null);
            setActiveTab('backup');
          }}
          className={`px-4 py-2 rounded flex items-center space-x-2 transition-colors ${
            activeTab === 'backup'
              ? 'bg-zinc-800 text-emerald-400 border border-zinc-700 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>DATA BACKUP & REPO SYNC</span>
        </button>
      </div>

      {/* Tab Contents */}
      {editingCase || activeTab === 'new_case' ? (
        <CaseEditor
          initialCase={editingCase}
          onSaveSuccess={(saved) => {
            setEditingCase(null);
            setActiveTab('cases');
            fetchCases();
          }}
          onCancel={() => {
            setEditingCase(null);
            setActiveTab('cases');
          }}
          onPreview={(c) => {
            setPreviewCaseSlug(c.slug);
          }}
        />
      ) : activeTab === 'cases' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-editorial text-zinc-100">
              Active Case Files Repository
            </h2>
            <button
              onClick={fetchCases}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-zinc-900 rounded border border-zinc-800"
              title="Refresh repository records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-500">
              SYNCHRONIZING WITH DATABASE...
            </div>
          ) : cases.length === 0 ? (
            <div className="p-8 text-center bg-zinc-950 border border-zinc-800 rounded">
              <FolderOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-mono text-zinc-400">No cases recorded in database.</p>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                  <tr>
                    <th className="py-3 px-4">RECORD ID</th>
                    <th className="py-3 px-4">CASE TITLE</th>
                    <th className="py-3 px-4">CATEGORY</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">EXHIBITS</th>
                    <th className="py-3 px-4 text-center">PUBLIC STATUS</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-3 px-4 text-red-400 font-bold whitespace-nowrap">
                        {c.caseNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-100 font-editorial text-sm">
                        {c.title}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{c.category}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-amber-400">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {c.evidence ? c.evidence.length : 0} exhibits
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleTogglePublished(c)}
                          className="inline-flex items-center space-x-1 cursor-pointer"
                          title="Click to toggle publish status"
                        >
                          {c.isPublished ? (
                            <span className="flex items-center text-emerald-400 text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                              PUBLISHED
                            </span>
                          ) : (
                            <span className="flex items-center text-zinc-500 text-[11px]">
                              <XCircle className="w-3.5 h-3.5 mr-1 text-zinc-600" />
                              DRAFT
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => setPreviewCaseSlug(c.slug)}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded inline-block"
                          title="Preview public dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCase(c)}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 rounded inline-block"
                          title="Edit dossier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCase(c.id, c.title)}
                          className="p-1.5 bg-zinc-900 hover:bg-red-950 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded inline-block"
                          title="Delete case permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'media' ? (
        <MediaLibrary />
      ) : activeTab === 'backup' ? (
        <BackupSyncManager />
      ) : (
        <ArchiveSettingsEditor />
      )}
    </div>
  );
};
