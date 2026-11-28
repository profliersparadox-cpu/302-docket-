import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Palette,
  Video,
  Volume2,
  Sliders,
  CheckCircle2,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  Download,
  FileUp,
  Film,
  Music,
  Sparkles,
  Image as ImageIcon,
  Plus,
  AlertCircle,
  Tv,
} from 'lucide-react';
import { CaseFile, MediaItem, SiteFontStyle, SiteThemePreset } from '../../types.ts';
import {
  useSiteCustomization,
  THEME_PRESETS,
  FONT_STYLE_MAP,
} from '../../context/SiteCustomizationContext.tsx';
import {
  fetchAllMedia,
  uploadMediaFile,
  addMediaLink,
  updateCustomMedia,
  deleteCustomMedia,
  isAudioMedia,
  isVideoMedia,
  MEDIA_UPDATED_EVENT,
} from '../../utils/mediaVault.ts';
import { RetroVideoPlayer } from './RetroVideoPlayer.tsx';
import { soundEngine } from '../../utils/soundEngine.ts';

export type StudioTab = 'add_media' | 'customize' | 'library';

interface CustomizeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: StudioTab;
  initialCaseSlug?: string;
  cases: CaseFile[];
  crtEnabled?: boolean;
  onToggleCrt?: () => void;
}

interface QueuedFile {
  id: string;
  file: File;
  title: string;
  description: string;
  transcript: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
}

const cleanFileTitle = (name: string) =>
  name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();

export const CustomizeStudioModal: React.FC<CustomizeStudioModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'add_media',
  initialCaseSlug,
  cases,
  crtEnabled,
  onToggleCrt,
}) => {
  const {
    customization,
    updateCustomization,
    applyThemePreset,
    resetCustomization,
    saveToServer,
    isSaving,
  } = useSiteCustomization();

  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab);
  const [selectedCaseSlug, setSelectedCaseSlug] = useState<string>(
    initialCaseSlug || cases[0]?.slug || 'general-archive'
  );

  // Batch upload queue
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchBanner, setBatchBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement | null>(null);
  const importJsonRef = useRef<HTMLInputElement | null>(null);

  // URL Link form state
  const [linkKind, setLinkKind] = useState<'video' | 'audio'>('video');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDesc, setLinkDesc] = useState('');
  const [linkTranscript, setLinkTranscript] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkStatus, setLinkStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Customization feedback state
  const [customNotice, setCustomNotice] = useState<string | null>(null);
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);

  // Media Library state
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'video' | 'audio'>('all');
  const [previewMediaId, setPreviewMediaId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    caseSlug: string;
    description: string;
    transcript: string;
  }>({ title: '', caseSlug: '', description: '', transcript: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (initialCaseSlug) {
        setSelectedCaseSlug(initialCaseSlug);
      } else if (!selectedCaseSlug && cases.length > 0) {
        setSelectedCaseSlug(cases[0].slug);
      }
      setBatchBanner(null);
      setLinkStatus(null);
      setCustomNotice(null);
    }
  }, [isOpen, initialTab, initialCaseSlug, cases]);

  const refreshLibrary = async () => {
    const all = await fetchAllMedia();
    setLibraryItems(all);
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshLibrary();
    const handler = () => refreshLibrary();
    window.addEventListener(MEDIA_UPDATED_EVENT, handler);
    return () => window.removeEventListener(MEDIA_UPDATED_EVENT, handler);
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedCaseObj = cases.find((c) => c.slug === selectedCaseSlug);

  const enqueueFiles = (files: FileList | File[]) => {
    const incoming: QueuedFile[] = Array.from(files).map((file, i) => ({
      id: `q-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      title: cleanFileTitle(file.name),
      description: '',
      transcript: '',
      status: 'pending',
    }));
    if (incoming.length > 0) {
      soundEngine.playKeyClick();
      setQueue((prev) => [...prev, ...incoming]);
      setBatchBanner(null);
    }
  };

  const handleUploadQueue = async () => {
    const pending = queue.filter((q) => q.status === 'pending' || q.status === 'error');
    if (pending.length === 0) return;

    setIsBatchUploading(true);
    setBatchBanner(null);
    let successCount = 0;

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', errorMsg: undefined } : q))
      );
      try {
        await uploadMediaFile(item.file, {
          caseSlug: selectedCaseSlug,
          caseNumber: selectedCaseObj?.caseNumber || 'GENERAL',
          title: item.title.trim() || item.file.name,
          description: item.description.trim() || undefined,
          transcript: item.transcript.trim() || undefined,
        });
        successCount++;
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'done' } : q))
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', errorMsg: err?.message || 'Upload failed' }
              : q
          )
        );
      }
    }

    setIsBatchUploading(false);
    if (successCount > 0) {
      soundEngine.playBootBeep();
      setBatchBanner(
        `Added ${successCount} file${successCount === 1 ? '' : 's'} to ${
          selectedCaseObj ? `${selectedCaseObj.caseNumber} (${selectedCaseObj.title})` : selectedCaseSlug
        }.`
      );
      await refreshLibrary();
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    setIsAddingLink(true);
    setLinkStatus(null);
    try {
      soundEngine.playKeyClick();
      await addMediaLink({
        url: linkUrl.trim(),
        mediaKind: linkKind,
        caseSlug: selectedCaseSlug,
        caseNumber: selectedCaseObj?.caseNumber || 'GENERAL',
        title: linkTitle.trim() || undefined,
        description: linkDesc.trim() || undefined,
        transcript: linkTranscript.trim() || undefined,
      });
      soundEngine.playBootBeep();
      setLinkUrl('');
      setLinkTitle('');
      setLinkDesc('');
      setLinkTranscript('');
      setLinkStatus({
        ok: true,
        msg: `${linkKind === 'video' ? 'Video' : 'Audio'} link added to ${
          selectedCaseObj?.caseNumber || selectedCaseSlug
        }!`,
      });
      await refreshLibrary();
    } catch (err: any) {
      setLinkStatus({ ok: false, msg: err?.message || 'Could not add media link.' });
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleWallpaperUpload = async (file: File) => {
    setIsUploadingWallpaper(true);
    try {
      const uploaded = await uploadMediaFile(file, {
        caseSlug: 'site-wallpaper',
        caseNumber: 'THEME',
        title: `Custom Wallpaper (${file.name})`,
      });
      updateCustomization({ wallpaperUrl: uploaded.url });
      setCustomNotice('Custom wallpaper uploaded & applied.');
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          updateCustomization({ wallpaperUrl: reader.result });
          setCustomNotice('Wallpaper applied locally.');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingWallpaper(false);
    }
  };

  const handleSaveServerCustomization = async () => {
    soundEngine.playBootBeep();
    const ok = await saveToServer();
    setCustomNotice(
      ok
        ? 'Site theme & branding saved to server!'
        : 'Saved to your browser storage (server sync skipped).'
    );
  };

  const handleExportThemeJson = () => {
    soundEngine.playKeyClick();
    const blob = new Blob([JSON.stringify(customization, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site-customization.json';
    a.click();
    URL.revokeObjectURL(url);
    setCustomNotice('Exported customization JSON.');
  };

  const handleImportThemeJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        updateCustomization(parsed);
        soundEngine.playBootBeep();
        setCustomNotice('Imported customization settings!');
      } catch {
        setCustomNotice('Invalid customization JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const filteredLibrary = libraryItems.filter((item) => {
    if (libraryFilter === 'video') return isVideoMedia(item);
    if (libraryFilter === 'audio') return isAudioMedia(item);
    return true;
  });

  const videoCount = libraryItems.filter((m) => isVideoMedia(m)).length;
  const audioCount = libraryItems.filter((m) => isAudioMedia(m)).length;

  return (
    <div className="fixed inset-0 z-[9995] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="retro-window w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b0e13] border-2 border-emerald-700/80 shadow-2xl overflow-hidden">
        {/* Studio Header */}
        <div className="retro-window-header px-4 py-2.5 flex items-center justify-between gap-3 bg-gradient-to-r from-[#131a22] via-[#0e141b] to-[#131a22]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-pixel text-[11px] sm:text-xs text-emerald-300 tracking-wider truncate">
              CREATOR STUDIO // ADD VIDEOS, AUDIO &amp; CUSTOMIZE SITE
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              onClose();
            }}
            className="retro-btn px-2 py-1 text-xs flex items-center space-x-1"
            aria-label="Close studio"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CLOSE</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#090c10] border-b border-zinc-800 px-4 py-2 flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setActiveTab('add_media');
            }}
            className={`px-3 py-1.5 rounded border flex items-center space-x-1.5 transition-colors ${
              activeTab === 'add_media'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>ADD VIDEOS &amp; AUDIO</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setActiveTab('customize');
            }}
            className={`px-3 py-1.5 rounded border flex items-center space-x-1.5 transition-colors ${
              activeTab === 'customize'
                ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>CUSTOMIZE WEBSITE</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setActiveTab('library');
              refreshLibrary();
            }}
            className={`px-3 py-1.5 rounded border flex items-center space-x-1.5 transition-colors ${
              activeTab === 'library'
                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>MY MEDIA LIBRARY ({libraryItems.length})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 font-mono text-xs text-zinc-300">
          {/* ================= TAB 1: ADD VIDEOS & AUDIO ================= */}
          {activeTab === 'add_media' && (
            <div className="space-y-6">
              {/* Step 1: Pick Case */}
              <div className="p-4 bg-[#080b0f] border border-zinc-800 rounded flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-pixel text-[10px] text-emerald-400 uppercase">
                    STEP 1 // CHOOSE WHICH CASE RECEIVES YOUR FILES
                  </div>
                  <p className="text-[11px] text-zinc-400 font-tech mt-0.5">
                    Any video or audio added here immediately appears inside that case&apos;s Media Vault and Audio Player.
                  </p>
                </div>
                <select
                  value={selectedCaseSlug}
                  onChange={(e) => setSelectedCaseSlug(e.target.value)}
                  className="bg-black border border-emerald-700/70 text-zinc-100 px-3 py-2 rounded text-xs font-mono min-w-[240px] focus:border-emerald-400 focus:outline-none"
                >
                  {cases.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.caseNumber} — {c.title}
                    </option>
                  ))}
                  <option value="general-archive">GENERAL ARCHIVE (UNASSIGNED)</option>
                </select>
              </div>

              {/* Step 2A: Drag & Drop Multi-File Uploader */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-4 bg-[#080b0f] border border-zinc-800 rounded space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <Upload className="w-4 h-4" />
                      <span>OPTION A: DROP VIDEO OR AUDIO FILES</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">MP4, WEBM, MOV, MP3, WAV, M4A</span>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files?.length) {
                        enqueueFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? 'border-emerald-400 bg-emerald-950/30 text-emerald-200'
                        : 'border-zinc-700 hover:border-emerald-600 bg-black/50 text-zinc-400'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="video/*,audio/*,image/*,.mp4,.webm,.mov,.m4v,.mp3,.wav,.m4a,.ogg,.flac,.aac,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          enqueueFiles(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />
                    <div className="flex justify-center space-x-3 mb-2">
                      <Video className="w-7 h-7 text-red-400" />
                      <Volume2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="font-bold text-zinc-200 text-sm">
                      Drag &amp; drop one or multiple videos / audio files here
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      or click to browse your device (up to 50 MB per file)
                    </div>
                  </div>

                  {batchBanner && (
                    <div className="p-2.5 bg-emerald-950/70 border border-emerald-600 text-emerald-200 rounded flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{batchBanner}</span>
                    </div>
                  )}

                  {queue.length > 0 && (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {queue.map((qItem) => (
                        <div
                          key={qItem.id}
                          className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-amber-300 font-bold truncate">
                              {qItem.file.name} ({Math.max(1, Math.round(qItem.file.size / 1024))} KB)
                            </span>
                            <div className="flex items-center space-x-2 shrink-0">
                              {qItem.status === 'done' && (
                                <span className="text-[10px] text-emerald-400 font-bold">ADDED</span>
                              )}
                              {qItem.status === 'uploading' && (
                                <span className="text-[10px] text-amber-400 animate-pulse">
                                  UPLOADING...
                                </span>
                              )}
                              {qItem.status !== 'uploading' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQueue((prev) => prev.filter((item) => item.id !== qItem.id))
                                  }
                                  className="text-zinc-500 hover:text-red-400"
                                  title="Remove from queue"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <input
                            type="text"
                            value={qItem.title}
                            onChange={(e) =>
                              setQueue((prev) =>
                                prev.map((it) =>
                                  it.id === qItem.id ? { ...it, title: e.target.value } : it
                                )
                              )
                            }
                            placeholder="Display title"
                            className="w-full bg-black border border-zinc-800 px-2.5 py-1.5 rounded text-zinc-100 text-xs"
                          />

                          <input
                            type="text"
                            value={qItem.description}
                            onChange={(e) =>
                              setQueue((prev) =>
                                prev.map((it) =>
                                  it.id === qItem.id ? { ...it, description: e.target.value } : it
                                )
                              )
                            }
                            placeholder="Short description / note (optional)"
                            className="w-full bg-black border border-zinc-800 px-2.5 py-1 rounded text-zinc-300 text-[11px]"
                          />

                          {qItem.errorMsg && (
                            <div className="text-[10px] text-red-400">{qItem.errorMsg}</div>
                          )}
                        </div>
                      ))}

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setQueue([])}
                          className="retro-btn px-3 py-1.5 text-zinc-400"
                        >
                          CLEAR QUEUE
                        </button>
                        <button
                          type="button"
                          disabled={
                            isBatchUploading ||
                            queue.every((q) => q.status === 'done')
                          }
                          onClick={handleUploadQueue}
                          className="retro-btn retro-btn-green px-4 py-1.5 font-bold flex items-center space-x-1.5 disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {isBatchUploading ? 'UPLOADING...' : 'UPLOAD ALL TO CASE'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2B: Paste Any Video or Audio URL */}
                <form
                  onSubmit={handleAddLink}
                  className="p-4 bg-[#080b0f] border border-zinc-800 rounded space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold">
                      <LinkIcon className="w-4 h-4" />
                      <span>OPTION B: PASTE VIDEO OR AUDIO URL</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">YouTube, Vimeo, .mp4, .mp3</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLinkKind('video')}
                      className={`py-2 px-3 rounded border flex items-center justify-center space-x-1.5 ${
                        linkKind === 'video'
                          ? 'bg-red-950/70 border-red-500 text-red-200 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>VIDEO LINK</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkKind('audio')}
                      className={`py-2 px-3 rounded border flex items-center justify-center space-x-1.5 ${
                        linkKind === 'audio'
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>AUDIO LINK</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-pixel text-zinc-400 block">
                      MEDIA URL (YouTube, Vimeo, direct .mp4 / .mp3 / .wav):
                    </label>
                    <input
                      type="url"
                      required
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://.../clip.mp4"
                      className="w-full bg-black border border-zinc-800 px-3 py-2 rounded text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-pixel text-zinc-400 block">
                      TITLE:
                    </label>
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder={
                        linkKind === 'video'
                          ? 'e.g. Surveillance Footage Reel #2'
                          : 'e.g. Dispatch Audio Tape #1'
                      }
                      className="w-full bg-black border border-zinc-800 px-3 py-2 rounded text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-pixel text-zinc-400 block">
                      DESCRIPTION (OPTIONAL):
                    </label>
                    <input
                      type="text"
                      value={linkDesc}
                      onChange={(e) => setLinkDesc(e.target.value)}
                      placeholder="Short context or source note..."
                      className="w-full bg-black border border-zinc-800 px-3 py-1.5 rounded text-zinc-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-pixel text-zinc-400 block">
                      TRANSCRIPT / NOTES (OPTIONAL):
                    </label>
                    <textarea
                      rows={2}
                      value={linkTranscript}
                      onChange={(e) => setLinkTranscript(e.target.value)}
                      placeholder="Optional transcript or timestamp notes..."
                      className="w-full bg-black border border-zinc-800 px-3 py-1.5 rounded text-zinc-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {linkStatus && (
                    <div
                      className={`p-2 rounded border text-xs flex items-center space-x-2 ${
                        linkStatus.ok
                          ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200'
                          : 'bg-red-950/70 border-red-600 text-red-200'
                      }`}
                    >
                      {linkStatus.ok ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{linkStatus.msg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAddingLink || !linkUrl.trim()}
                    className="w-full retro-btn retro-btn-green py-2 font-bold flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingLink ? 'ADDING...' : 'ADD URL TO CASE MEDIA'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================= TAB 2: CUSTOMIZE WEBSITE ================= */}
          {activeTab === 'customize' && (
            <div className="space-y-6">
              {customNotice && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-600 text-emerald-200 rounded flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{customNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomNotice(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* One-Click Theme Presets */}
              <div className="p-4 bg-[#080b0f] border border-zinc-800 rounded space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 font-bold">
                  <Palette className="w-4 h-4" />
                  <span>1-CLICK COLOR THEMES</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {(Object.keys(THEME_PRESETS) as SiteThemePreset[]).map((presetKey) => {
                    const preset = THEME_PRESETS[presetKey];
                    const active = customization.themePreset === presetKey;
                    return (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() => {
                          soundEngine.playKeyClick();
                          applyThemePreset(presetKey);
                          setCustomNotice(`Applied "${preset.label}" theme.`);
                        }}
                        className={`p-3 rounded border text-left transition-all space-y-1.5 ${
                          active
                            ? 'border-emerald-400 bg-zinc-900 shadow-[0_0_10px_rgba(52,211,153,0.25)]'
                            : 'border-zinc-800 bg-black/60 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.panelColor }}
                          />
                          <span className="font-bold text-zinc-100 text-[11px] truncate">
                            {preset.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-tech line-clamp-2">
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color & Typography Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80">
                  <label className="space-y-1">
                    <span className="text-[10px] font-pixel text-zinc-400 block">ACCENT COLOR</span>
                    <div className="flex items-center space-x-2 bg-black border border-zinc-800 px-2 py-1.5 rounded">
                      <input
                        type="color"
                        value={customization.accentColor}
                        onChange={(e) => updateCustomization({ accentColor: e.target.value })}
                        className="w-7 h-6 bg-transparent border-0 cursor-pointer"
                      />
                      <span className="text-zinc-300 uppercase">{customization.accentColor}</span>
                    </div>
                  </label>

                  <label className="space-y-1">
                    <span className="text-[10px] font-pixel text-zinc-400 block">BACKGROUND</span>
                    <div className="flex items-center space-x-2 bg-black border border-zinc-800 px-2 py-1.5 rounded">
                      <input
                        type="color"
                        value={customization.backgroundColor}
                        onChange={(e) => updateCustomization({ backgroundColor: e.target.value })}
                        className="w-7 h-6 bg-transparent border-0 cursor-pointer"
                      />
                      <span className="text-zinc-300 uppercase">{customization.backgroundColor}</span>
                    </div>
                  </label>

                  <label className="space-y-1">
                    <span className="text-[10px] font-pixel text-zinc-400 block">WINDOW PANELS</span>
                    <div className="flex items-center space-x-2 bg-black border border-zinc-800 px-2 py-1.5 rounded">
                      <input
                        type="color"
                        value={customization.panelColor}
                        onChange={(e) => updateCustomization({ panelColor: e.target.value })}
                        className="w-7 h-6 bg-transparent border-0 cursor-pointer"
                      />
                      <span className="text-zinc-300 uppercase">{customization.panelColor}</span>
                    </div>
                  </label>

                  <label className="space-y-1">
                    <span className="text-[10px] font-pixel text-zinc-400 block">SITE FONT</span>
                    <select
                      value={customization.fontStyle}
                      onChange={(e) =>
                        updateCustomization({ fontStyle: e.target.value as SiteFontStyle })
                      }
                      className="w-full bg-black border border-zinc-800 px-2.5 py-2 rounded text-zinc-100"
                    >
                      {(Object.keys(FONT_STYLE_MAP) as SiteFontStyle[]).map((fk) => (
                        <option key={fk} value={fk}>
                          {FONT_STYLE_MAP[fk].label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* Site Name, Tagline, and Text */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-4 bg-[#080b0f] border border-zinc-800 rounded space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <Sliders className="w-4 h-4" />
                    <span>WEBSITE TITLE, TAGLINE &amp; COPY</span>
                  </div>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-pixel text-zinc-400">WEBSITE TITLE:</span>
                    <input
                      type="text"
                      value={customization.archiveTitle}
                      onChange={(e) => updateCustomization({ archiveTitle: e.target.value })}
                      className="w-full bg-black border border-zinc-800 px-3 py-2 rounded text-zinc-100"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-pixel text-zinc-400">TOP BAR BADGE:</span>
                    <input
                      type="text"
                      value={customization.headerBadge}
                      onChange={(e) => updateCustomization({ headerBadge: e.target.value })}
                      className="w-full bg-black border border-zinc-800 px-3 py-2 rounded text-zinc-100"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-pixel text-zinc-400">TYPEWRITER TAGLINE:</span>
                    <input
                      type="text"
                      value={customization.tagline}
                      onChange={(e) => updateCustomization({ tagline: e.target.value })}
                      className="w-full bg-black border border-zinc-800 px-3 py-2 rounded text-zinc-100"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-pixel text-zinc-400">FOOTER DISCLAIMER:</span>
                    <textarea
                      rows={2}
                      value={customization.disclaimer}
                      onChange={(e) => updateCustomization({ disclaimer: e.target.value })}
                      className="w-full bg-black border border-zinc-800 px-3 py-1.5 rounded text-zinc-200"
                    />
                  </label>
                </div>

                {/* Desktop Wallpaper & Display Toggles */}
                <div className="p-4 bg-[#080b0f] border border-zinc-800 rounded space-y-3.5">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                    <ImageIcon className="w-4 h-4" />
                    <span>DESKTOP WALLPAPER &amp; DISPLAY OPTIONS</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-pixel text-zinc-400 block">
                      CUSTOM WALLPAPER IMAGE URL OR UPLOAD:
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={customization.wallpaperUrl}
                        onChange={(e) => updateCustomization({ wallpaperUrl: e.target.value })}
                        placeholder="https://... or upload an image file"
                        className="flex-1 bg-black border border-zinc-800 px-3 py-1.5 rounded text-zinc-100"
                      />
                      <input
                        ref={wallpaperInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleWallpaperUpload(f);
                        }}
                      />
                      <button
                        type="button"
                        disabled={isUploadingWallpaper}
                        onClick={() => wallpaperInputRef.current?.click()}
                        className="retro-btn px-2.5 py-1.5 text-emerald-300 border-emerald-700"
                      >
                        {isUploadingWallpaper ? '...' : 'UPLOAD'}
                      </button>
                      {customization.wallpaperUrl && (
                        <button
                          type="button"
                          onClick={() => updateCustomization({ wallpaperUrl: '' })}
                          className="retro-btn px-2 py-1.5 text-red-300 border-red-800"
                          title="Clear wallpaper"
                        >
                          CLEAR
                        </button>
                      )}
                    </div>
                  </div>

                  <label className="space-y-1 block">
                    <div className="flex justify-between text-[10px] font-pixel text-zinc-400">
                      <span>WALLPAPER OPACITY:</span>
                      <span>{Math.round(customization.wallpaperOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.6"
                      step="0.05"
                      value={customization.wallpaperOpacity}
                      onChange={(e) =>
                        updateCustomization({ wallpaperOpacity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-emerald-400"
                    />
                  </label>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    {onToggleCrt && (
                      <label className="flex items-center justify-between cursor-pointer p-2 bg-black/50 border border-zinc-800 rounded">
                        <span className="flex items-center space-x-2">
                          <Tv className="w-3.5 h-3.5 text-amber-400" />
                          <span>CRT Scanline Filter (Live)</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={Boolean(crtEnabled)}
                          onChange={onToggleCrt}
                          className="accent-emerald-400 w-4 h-4"
                        />
                      </label>
                    )}

                    <label className="flex items-center justify-between cursor-pointer p-2 bg-black/50 border border-zinc-800 rounded">
                      <span>Skip Boot Animation on Startup</span>
                      <input
                        type="checkbox"
                        checked={customization.skipBootScreen}
                        onChange={(e) => updateCustomization({ skipBootScreen: e.target.checked })}
                        className="accent-emerald-400 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer p-2 bg-black/50 border border-zinc-800 rounded">
                      <span>Show Central Title Watermark on Desktop</span>
                      <input
                        type="checkbox"
                        checked={customization.showHeroWatermark}
                        onChange={(e) => updateCustomization({ showHeroWatermark: e.target.checked })}
                        className="accent-emerald-400 w-4 h-4"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Save, Export, Import, Reset */}
              <div className="p-4 bg-[#080b0f] border border-zinc-800 rounded flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportThemeJson}
                    className="retro-btn px-3 py-1.5 flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>EXPORT JSON</span>
                  </button>

                  <input
                    ref={importJsonRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImportThemeJson(f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => importJsonRef.current?.click()}
                    className="retro-btn px-3 py-1.5 flex items-center space-x-1.5"
                  >
                    <FileUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>IMPORT JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyClick();
                      resetCustomization();
                      setCustomNotice('Reset customization back to factory defaults.');
                    }}
                    className="retro-btn px-3 py-1.5 flex items-center space-x-1.5 text-red-300 border-red-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESET DEFAULT</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveServerCustomization}
                  className="retro-btn retro-btn-green px-5 py-2 font-bold flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'SAVING...' : 'SAVE TO SERVER'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 3: MY MEDIA LIBRARY ================= */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setLibraryFilter('all')}
                    className={`px-3 py-1 rounded border ${
                      libraryFilter === 'all'
                        ? 'bg-zinc-800 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    ALL ({libraryItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibraryFilter('video')}
                    className={`px-3 py-1 rounded border ${
                      libraryFilter === 'video'
                        ? 'bg-zinc-800 border-red-500 text-red-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    VIDEOS ({videoCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibraryFilter('audio')}
                    className={`px-3 py-1 rounded border ${
                      libraryFilter === 'audio'
                        ? 'bg-zinc-800 border-amber-500 text-amber-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    AUDIO ({audioCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('add_media')}
                  className="retro-btn retro-btn-green px-3 py-1.5 flex items-center space-x-1.5 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD MORE VIDEO / AUDIO</span>
                </button>
              </div>

              {filteredLibrary.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded text-zinc-500 space-y-2">
                  <div>No custom videos or audio uploaded yet.</div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add_media')}
                    className="retro-btn retro-btn-green px-4 py-1.5"
                  >
                    UPLOAD OR PASTE A LINK
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLibrary.map((item) => {
                    const isVideo = isVideoMedia(item);
                    const isAudio = isAudioMedia(item);
                    const isUserAdded = item.id.startsWith('media-');
                    const isEditing = editingItemId === item.id;
                    const isPreviewing = previewMediaId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 bg-[#080b0f] border border-zinc-800 rounded space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center space-x-2">
                              {isVideo ? (
                                <Video className="w-4 h-4 text-red-400 shrink-0" />
                              ) : isAudio ? (
                                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                              )}
                              <span className="font-bold text-zinc-100 truncate">
                                {item.title || item.originalName}
                              </span>
                              <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-amber-300">
                                {item.caseNumber || item.caseSlug || 'GENERAL'}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-zinc-400">{item.description}</p>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {(isVideo || isAudio) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewMediaId(isPreviewing ? null : item.id)
                                }
                                className="retro-btn px-2.5 py-1 text-emerald-300 border-emerald-700"
                              >
                                {isPreviewing ? 'HIDE PLAYER' : 'PREVIEW'}
                              </button>
                            )}

                            {isUserAdded && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingItemId(null);
                                  } else {
                                    setEditingItemId(item.id);
                                    setEditDraft({
                                      title: item.title || item.originalName,
                                      caseSlug: item.caseSlug || 'general-archive',
                                      description: item.description || '',
                                      transcript: item.transcript || '',
                                    });
                                  }
                                }}
                                className="retro-btn px-2.5 py-1 text-amber-300 border-amber-700 flex items-center space-x-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>EDIT</span>
                              </button>
                            )}

                            {isUserAdded &&
                              (confirmDeleteId === item.id ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await deleteCustomMedia(item.id);
                                    setConfirmDeleteId(null);
                                    await refreshLibrary();
                                  }}
                                  className="retro-btn retro-btn-red px-2.5 py-1 font-bold"
                                >
                                  CONFIRM DELETE
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  className="retro-btn px-2 py-1 text-red-400 border-red-900"
                                  title="Delete media"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ))}
                          </div>
                        </div>

                        {isPreviewing && isVideo && (
                          <RetroVideoPlayer
                            url={item.url}
                            title={item.title || item.originalName}
                            caseNumber={item.caseNumber}
                          />
                        )}

                        {isPreviewing && isAudio && !isVideo && (
                          <audio src={item.url} controls className="w-full" />
                        )}

                        {isEditing && (
                          <div className="p-3 bg-black/70 border border-zinc-800 rounded space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={editDraft.title}
                                onChange={(e) =>
                                  setEditDraft((d) => ({ ...d, title: e.target.value }))
                                }
                                placeholder="Title"
                                className="bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 rounded text-zinc-100"
                              />
                              <select
                                value={editDraft.caseSlug}
                                onChange={(e) =>
                                  setEditDraft((d) => ({ ...d, caseSlug: e.target.value }))
                                }
                                className="bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 rounded text-zinc-100"
                              >
                                {cases.map((c) => (
                                  <option key={c.slug} value={c.slug}>
                                    {c.caseNumber} — {c.title}
                                  </option>
                                ))}
                                <option value="general-archive">GENERAL ARCHIVE</option>
                              </select>
                            </div>
                            <input
                              type="text"
                              value={editDraft.description}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, description: e.target.value }))
                              }
                              placeholder="Description"
                              className="w-full bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 rounded text-zinc-200"
                            />
                            <textarea
                              rows={2}
                              value={editDraft.transcript}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, transcript: e.target.value }))
                              }
                              placeholder="Transcript / Notes"
                              className="w-full bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 rounded text-zinc-200"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setEditingItemId(null)}
                                className="retro-btn px-3 py-1"
                              >
                                CANCEL
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const targetCase = cases.find((c) => c.slug === editDraft.caseSlug);
                                  await updateCustomMedia(item.id, {
                                    title: editDraft.title.trim() || item.originalName,
                                    caseSlug: editDraft.caseSlug,
                                    caseNumber: targetCase?.caseNumber || 'GENERAL',
                                    description: editDraft.description,
                                    transcript: editDraft.transcript,
                                  });
                                  setEditingItemId(null);
                                  await refreshLibrary();
                                }}
                                className="retro-btn retro-btn-green px-3 py-1 font-bold"
                              >
                                SAVE CHANGES
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
