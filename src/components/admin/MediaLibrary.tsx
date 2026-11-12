import React, { useState, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Volume2,
  Music,
  Download,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  Shield,
  Layers,
  Video,
} from 'lucide-react';
import { MediaItem } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

const CASE_OPTIONS = [
  { slug: 'jonbenet-ramsey-boulder', number: 'CASE 001', label: 'CASE 001 — JonBenét Ramsey' },
  { slug: 'golden-state-killer-deangelo', number: 'CASE 002', label: 'CASE 002 — Golden State Killer' },
  { slug: 'gabby-petito-brian-laundrie', number: 'CASE 003', label: 'CASE 003 — Gabby Petito' },
  { slug: 'lindbergh-kidnapping-hauptmann', number: 'CASE 004', label: 'CASE 004 — Lindbergh Kidnapping' },
  { slug: 'jacob-wetterling-abduction', number: 'CASE 005', label: 'CASE 005 — Jacob Wetterling' },
  { slug: 'larry-nassar-msu-usag', number: 'CASE 006', label: 'CASE 006 — Larry Nassar & USAG' },
  { slug: 'epstein-maxwell-trafficking', number: 'CASE 007', label: 'CASE 007 — Epstein & Maxwell' },
  { slug: 'general-archive', number: 'GENERAL', label: 'GENERAL ARCHIVE EXHIBIT' },
];

export const MediaLibrary: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCaseFilter, setActiveCaseFilter] = useState<string>('all');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCaseSlug, setUploadCaseSlug] = useState('jonbenet-ramsey-boulder');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTranscript, setUploadTranscript] = useState('');

  // Edit transcript/metadata modal
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCaseSlug, setEditCaseSlug] = useState('');
  const [editTranscript, setEditTranscript] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Expanded transcripts in cards
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const matchingCase = CASE_OPTIONS.find((c) => c.slug === uploadCaseSlug);
    formData.append('caseSlug', uploadCaseSlug);
    if (matchingCase) {
      formData.append('caseNumber', matchingCase.number);
    }
    formData.append('title', uploadTitle.trim());
    formData.append('description', uploadDescription.trim());
    formData.append('transcript', uploadTranscript.trim());

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Upload failed');
      }

      soundEngine.playBootBeep();
      setSuccessMsg('Media exhibit and transcript successfully uploaded to archive.');
      setTimeout(() => setSuccessMsg(null), 4000);

      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadTranscript('');
      await fetchMedia();
    } catch (err: any) {
      setError(err.message || 'Error uploading media file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEdit = (item: MediaItem) => {
    setEditingItem(item);
    setEditTitle(item.title || item.originalName);
    setEditCaseSlug(item.caseSlug || 'general-archive');
    setEditTranscript(item.transcript || '');
    setEditDescription(item.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    setError(null);

    const matchingCase = CASE_OPTIONS.find((c) => c.slug === editCaseSlug);
    try {
      const res = await fetch(`/api/admin/media/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          caseSlug: editCaseSlug,
          caseNumber: matchingCase?.number || 'GENERAL',
          transcript: editTranscript.trim(),
          description: editDescription.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update media item');
      }

      const updated = await res.json();
      setMediaList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingItem(null);
      soundEngine.playKeyClick();
      setSuccessMsg('Media transcript and case assignment updated.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update metadata.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this media asset?')) return;

    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMediaList((prev) => prev.filter((m) => m.id !== id));
        soundEngine.playKeyClick();
      }
    } catch (err: any) {
      setError('Failed to delete media asset: ' + err.message);
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadBackup = () => {
    soundEngine.playKeyClick();
    const backupData = {
      timestamp: new Date().toISOString(),
      archive: 'THE 302 DOCKET',
      totalItems: mediaList.length,
      media: mediaList,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `302_docket_media_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpandTranscript = (id: string) => {
    setExpandedTranscripts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredMedia = mediaList.filter((item) => {
    if (activeCaseFilter === 'all') return true;
    return item.caseSlug === activeCaseFilter;
  });

  return (
    <div className="space-y-6 text-zinc-300 font-tech">
      {/* Top Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-pixel text-amber-400 mb-1">
            <Volume2 className="w-4 h-4 text-red-500" />
            <span>CASE-WISE EVIDENCE & AUDIO MEDIA STORAGE</span>
          </div>
          <h2 className="text-xl font-bold font-editorial text-zinc-100">
            Investigator Audio Vault & Document Assets
          </h2>
          <p className="text-xs font-mono text-zinc-400">
            Upload audio reels, wiretap recordings, and forensic documents with case classification and searchable transcripts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Download Backup Button */}
          <button
            onClick={handleDownloadBackup}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono rounded flex items-center space-x-1.5 transition-colors"
            title="Export all media metadata & transcripts to JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>BACKUP MEDIA</span>
          </button>

          {/* Upload New Asset Button */}
          <label className="px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-700 text-red-100 text-xs font-mono rounded cursor-pointer transition-colors flex items-center space-x-2 font-bold shadow-[0_0_12px_rgba(220,38,38,0.3)]">
            <Upload className="w-3.5 h-3.5 text-red-400" />
            <span>UPLOAD NEW ASSET</span>
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="audio/*,video/*,image/*,.mp3,.mp4,.m4a,.mpeg,.mpg,.wav,.ogg,.aac,.flac,.webm,.mov,.avi,.pdf"
            />
          </label>
        </div>
      </div>

      {/* Case-Wise Separation Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-zinc-800/80 font-mono text-xs">
        <button
          onClick={() => setActiveCaseFilter('all')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeCaseFilter === 'all'
              ? 'bg-amber-950 text-amber-300 border border-amber-600 font-bold'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          ALL CASES ({mediaList.length})
        </button>
        {CASE_OPTIONS.map((c) => {
          const count = mediaList.filter((m) => m.caseSlug === c.slug).length;
          return (
            <button
              key={c.slug}
              onClick={() => setActiveCaseFilter(c.slug)}
              className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap flex items-center space-x-1 ${
                activeCaseFilter === c.slug
                  ? 'bg-red-950 text-red-200 border border-red-700 font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <span>{c.number}</span>
              <span className="text-zinc-500 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-mono rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-mono rounded flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-xs font-mono text-zinc-500">
          RETRIEVING STORED ARCHIVAL MEDIA...
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="p-12 text-center bg-zinc-950 border border-zinc-800 rounded-lg">
          <Volume2 className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs font-mono text-zinc-400">No media pieces found for this selection.</p>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            Click "UPLOAD NEW ASSET" to add audio reels, wiretaps, photos, or transcripts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedia.map((item) => {
            const isAudio =
              item.mimeType.startsWith('audio/') ||
              /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(item.originalName) ||
              /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(item.filename);

            const isVideo =
              item.mimeType.startsWith('video/') ||
              /\.(mp4|m4v|mpeg|mpg|webm|mov|avi)$/i.test(item.originalName) ||
              /\.(mp4|m4v|mpeg|mpg|webm|mov|avi)$/i.test(item.filename);

            const isImage = item.mimeType.startsWith('image/');
            const sizeKb = (item.size / 1024).toFixed(1);
            const caseInfo = CASE_OPTIONS.find((c) => c.slug === item.caseSlug);
            const isTranscriptOpen = !!expandedTranscripts[item.id];

            const formatLabel = isVideo
              ? 'MP4 VIDEO / AUDIO'
              : /\.(mp3)$/i.test(item.originalName) || item.mimeType === 'audio/mpeg' || item.mimeType === 'audio/mp3'
              ? 'MP3 AUDIO REEL'
              : isAudio
              ? 'AUDIO REEL'
              : isImage
              ? 'PHOTO EXHIBIT'
              : 'DOCUMENT';

            return (
              <div
                key={item.id}
                className="bg-[#0b0e13] border border-[#232936] rounded-lg overflow-hidden flex flex-col justify-between hover:border-zinc-600 transition-colors shadow-lg"
              >
                {/* Header Badge Strip: Case Label & Media Type */}
                <div className="p-2.5 bg-[#12161f] border-b border-[#232936] flex items-center justify-between text-[10px] font-mono">
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded font-bold">
                    {item.caseNumber || caseInfo?.number || 'GENERAL'}
                  </span>
                  <span className="text-zinc-400 font-pixel uppercase">
                    {formatLabel}
                  </span>
                </div>

                {/* Media Preview Box */}
                <div className="p-3 bg-[#080a0e] flex flex-col items-center justify-center border-b border-zinc-900 min-h-[140px]">
                  {isVideo ? (
                    <div className="w-full space-y-2">
                      <div className="flex items-center space-x-2 text-zinc-300 text-xs font-mono">
                        <Video className="w-4 h-4 text-amber-400" />
                        <span className="truncate font-bold">{item.title || item.originalName}</span>
                      </div>
                      <video
                        controls
                        playsInline
                        src={item.url}
                        className="w-full max-h-48 rounded bg-black border border-zinc-800"
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  ) : isAudio ? (
                    <div className="w-full space-y-3">
                      <div className="flex items-center space-x-2 text-zinc-300 text-xs font-mono">
                        <Music className="w-5 h-5 text-red-500 animate-pulse" />
                        <span className="truncate font-bold">{item.title || item.originalName}</span>
                      </div>
                      <audio controls className="w-full h-8 brightness-90 contrast-125" src={item.url}>
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  ) : isImage ? (
                    <div className="w-full h-36 flex items-center justify-center overflow-hidden rounded">
                      <img
                        src={item.url}
                        alt={item.title || item.originalName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-zinc-500">
                      <FileText className="w-12 h-12 text-indigo-400 mb-1" />
                      <span className="text-[10px] font-mono">SCANNED EXHIBIT DOCUMENT</span>
                    </div>
                  )}
                </div>

                {/* Metadata & Transcript Details */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <h4 className="font-bold font-mono text-zinc-200 line-clamp-1" title={item.title || item.originalName}>
                      {item.title || item.originalName}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-zinc-400 font-mono mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">
                      FILE: {item.filename} &bull; {sizeKb} KB
                    </div>
                  </div>

                  {/* Transcript Section */}
                  {item.transcript ? (
                    <div className="mt-2 pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => toggleExpandTranscript(item.id)}
                        className="w-full flex items-center justify-between text-[11px] font-mono text-amber-400 hover:text-amber-300 py-1"
                      >
                        <span className="font-bold flex items-center space-x-1">
                          <FileText className="w-3 h-3 mr-1" />
                          <span>AUDIO TRANSCRIPT ({item.transcript.length} chars)</span>
                        </span>
                        {isTranscriptOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isTranscriptOpen && (
                        <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed mt-1">
                          {item.transcript}
                        </div>
                      )}
                    </div>
                  ) : isAudio ? (
                    <div className="mt-2 pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-[10px] font-mono text-amber-500 hover:underline flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>+ ADD AUDIO TRANSCRIPT</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Actions Strip */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyUrl(item.url, item.id)}
                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-mono text-zinc-300 rounded flex items-center space-x-1"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>COPY LINK</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-mono text-amber-300 rounded flex items-center space-x-1"
                        title="Edit transcript & case label"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>EDIT</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Upload New Media Asset with Case Label & Audio Transcript */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10141a] border-2 border-red-700 rounded-lg max-w-lg w-full p-5 shadow-2xl font-mono text-xs text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <Upload className="w-4 h-4 text-red-500" />
                <span>UPLOAD ARCHIVAL EXHIBIT & TRANSCRIPT</span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Selected File
                </label>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded text-amber-300 truncate">
                  {selectedFile?.name} ({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-1">
                  Compatible with MP files (.mp3, .mp4, .m4a, .mpeg, .mpg), WAV, and OGG up to 50MB.
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Target Investigation / Case Label *
                </label>
                <select
                  value={uploadCaseSlug}
                  onChange={(e) => setUploadCaseSlug(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-200 focus:outline-none focus:border-red-600"
                >
                  {CASE_OPTIONS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Exhibit Title / Media Label *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. 911 Emergency Dispatch Audio Tape"
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Source / Archival Context Description
                </label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="e.g. Admitted exhibit in 1998 Grand Jury proceedings"
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-[10px] text-amber-400 uppercase mb-1 font-bold">
                  Audio Transcript / Spoken Dialogue (Optional for Audio Exhibits)
                </label>
                <textarea
                  rows={4}
                  value={uploadTranscript}
                  onChange={(e) => setUploadTranscript(e.target.value)}
                  placeholder="[00:01:15] DISPATCHER: What is the nature of your emergency?&#10;[00:01:22] CALLER: Please send help immediately..."
                  className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded text-zinc-200 focus:outline-none focus:border-red-600 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadTitle}
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'SAVING ASSET...' : 'SAVE TO ARCHIVE'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Transcript & Case Label */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10141a] border-2 border-amber-600 rounded-lg max-w-lg w-full p-5 shadow-2xl font-mono text-xs text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <Edit3 className="w-4 h-4 text-amber-500" />
                <span>EDIT MEDIA TRANSCRIPT & CASE ASSIGNMENT</span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-zinc-500 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Exhibit Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Case Association
                </label>
                <select
                  value={editCaseSlug}
                  onChange={(e) => setEditCaseSlug(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  {CASE_OPTIONS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Description / Archival Context
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-amber-400 uppercase mb-1 font-bold">
                  Audio Transcript / Spoken Dialogue
                </label>
                <textarea
                  rows={6}
                  value={editTranscript}
                  onChange={(e) => setEditTranscript(e.target.value)}
                  placeholder="Paste or edit the full transcript of this audio recording..."
                  className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? 'SAVING...' : 'UPDATE TRANSCRIPT'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
