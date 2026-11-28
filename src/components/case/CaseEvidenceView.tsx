import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Pin,
  Maximize2,
  X,
  FileText,
  Shield,
  Search,
  CheckCircle2,
  Calendar,
  Lock,
  ExternalLink,
  Plus,
  Volume2,
  Radio,
  Upload,
  Download,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { CaseFile, EvidenceItem } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { HighlightText } from '../../context/DocumentHighlightContext.tsx';
import { RetroAudioPlayer } from '../common/RetroAudioPlayer.tsx';
import { RetroPdfViewer } from '../common/RetroPdfViewer.tsx';
import { RetroPhotoEditor } from '../common/RetroPhotoEditor.tsx';
import { GitHubBackupModal } from '../common/GitHubBackupModal.tsx';
import {
  fetchAllMedia,
  uploadMediaFile,
  isAudioMedia,
  isPdfMedia,
  isVideoMedia,
  isImageMedia,
  convertMediaToEvidence,
  MEDIA_UPDATED_EVENT,
} from '../../utils/mediaVault.ts';
import { getEvidenceImage } from '../../data/exhibitImages.ts';
import { addWorkBoardPin, DOCKET_PIN_DRAG_MIME } from '../../utils/workBoard.ts';
import { recordLedgerEvent } from '../../utils/investigativeLedger.ts';

interface CaseEvidenceViewProps {
  caseData: CaseFile;
  onOpenEvidenceBoard?: () => void;
}

export const CaseEvidenceView: React.FC<CaseEvidenceViewProps> = ({
  caseData,
  onOpenEvidenceBoard,
}) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Uploaded media state
  const [uploadedExhibits, setUploadedExhibits] = useState<EvidenceItem[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTranscript, setUploadTranscript] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingEvidencePhoto, setEditingEvidencePhoto] = useState<EvidenceItem | null>(null);
  const [isGitHubBackupOpen, setIsGitHubBackupOpen] = useState(false);

  // Load uploaded media specifically matching this case
  const loadCaseUploadedMedia = async () => {
    try {
      const items = await fetchAllMedia(caseData.slug);
      const converted = items.map((m, idx) => convertMediaToEvidence(m, idx));
      setUploadedExhibits(converted);
    } catch (err) {
      console.warn('Error loading case media exhibits:', err);
    }
  };

  useEffect(() => {
    loadCaseUploadedMedia();

    const handleUpdate = () => {
      loadCaseUploadedMedia();
    };
    window.addEventListener(MEDIA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(MEDIA_UPDATED_EVENT, handleUpdate);
  }, [caseData.slug]);

  // Handle uploading new exhibit directly from Evidence Room
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      soundEngine.playKeyClick();
      await uploadMediaFile(uploadFile, {
        caseSlug: caseData.slug,
        caseNumber: caseData.caseNumber,
        title: uploadTitle.trim() || uploadFile.name,
        description: uploadDesc.trim(),
        transcript: uploadTranscript.trim(),
      });

      soundEngine.playBootBeep();
      setAddedToast(uploadTitle.trim() || uploadFile.name);
      setTimeout(() => setAddedToast(null), 3000);

      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDesc('');
      setUploadTranscript('');
      await loadCaseUploadedMedia();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload exhibit file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle adding card to the user's custom evidence board
  const handleAddToEvidenceBoard = (ev: EvidenceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playKeyClick();

    try {
      const storageKey = `board_${caseData.slug}`;
      const existing = localStorage.getItem(storageKey);
      let boardData = existing ? JSON.parse(existing) : { items: [], connections: [] };

      // Check if already on board
      const exists = boardData.items?.some((i: any) => i.id === `ev-${ev.id}`);
      if (!exists) {
        const resolvedImg = getEvidenceImage(ev);
        const newItem = {
          id: `ev-${ev.id}`,
          title: ev.title,
          itemType: ev.type || 'physical',
          status: ev.classification === 'Confidential' ? 'Forensic Theory' : 'Established Fact',
          x: 100 + ((boardData.items?.length || 0) % 3) * 260,
          y: 80 + Math.floor((boardData.items?.length || 0) / 3) * 240,
          snippet: ev.description,
          source: ev.significance,
          date: ev.recoveredAt,
          caseSlug: caseData.slug,
          caseNumber: caseData.caseNumber,
          tags: [ev.type, ev.classification],
          imageUrl: ev.imageUrl || resolvedImg.url,
          imageCaption: resolvedImg.caption,
        };
        boardData.items = [...(boardData.items || []), newItem];
        localStorage.setItem(storageKey, JSON.stringify(boardData));
      }
    } catch (err) {
      console.error('Failed to save to evidence board storage', err);
    }

    // Trigger visual toast animation
    setAddedToast(ev.exhibitNumber || ev.title);
    recordLedgerEvent(caseData.slug, {
      caseNumber: caseData.caseNumber,
      category: 'pin',
      action: 'Pinned Exhibit to Board',
      subject: `${ev.exhibitNumber || 'EXHIBIT'} — ${ev.title}`,
      detail: ev.description.slice(0, 120),
      dedupeKey: `ev-board-pin-${ev.id || ev.title}`,
    });
    setTimeout(() => {
      setAddedToast(null);
    }, 2800);
  };

  // Combined evidence: uploaded items + canonical case evidence
  const allEvidence = [...uploadedExhibits, ...caseData.evidence];

  const filteredEvidence = allEvidence.filter((ev) => {
    if (typeFilter !== 'all' && ev.type !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        (ev.exhibitNumber && ev.exhibitNumber.toLowerCase().includes(q)) ||
        (ev.significance && ev.significance.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 relative">
      {/* Toast Animation: "FILE ADDED TO EVIDENCE BOARD" */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
          <div className="bg-zinc-950 border-2 border-emerald-500 text-emerald-400 p-3.5 shadow-[0_0_20px_rgba(16,185,129,0.5)] rounded font-mono text-xs flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="font-pixel text-[11px] font-bold text-emerald-300">
                [+] FILE PINNED TO EVIDENCE BOARD
              </div>
              <div className="text-[10px] text-zinc-300">
                EXHIBIT {addedToast} ADDED TO ACTIVE DOCKET BOARD
              </div>
            </div>
            {onOpenEvidenceBoard && (
              <button
                onClick={onOpenEvidenceBoard}
                className="retro-btn text-[9px] px-2 py-1 text-emerald-300 border-emerald-600 hover:bg-emerald-950/60"
              >
                VIEW BOARD &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="retro-window p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-950/60 border border-red-800 text-red-400">
            <Fingerprint className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-red-500 uppercase font-bold">
                FORENSIC EVIDENCE REPOSITORY
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1.5">
                {allEvidence.length} EXHIBITS LOGGED
              </span>
            </div>
            <h3 className="text-base font-bold font-editorial text-zinc-100">
              Chain of Custody & Physical Exhibits
            </h3>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search exhibits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/70 border border-zinc-800 text-xs font-tech text-zinc-200 pl-8 pr-3 py-1.5 rounded focus:border-red-600 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-black/70 border border-zinc-800 text-xs font-tech text-zinc-300 px-2.5 py-1.5 rounded focus:border-red-600 focus:outline-none"
          >
            <option value="all">ALL TYPES ({allEvidence.length})</option>
            <option value="document">Documentary / PDF</option>
            <option value="audio">Audio / Wiretaps</option>
            <option value="forensic">Forensic / DNA</option>
            <option value="digital">Digital / Cyber</option>
            <option value="physical">Physical Exhibit</option>
            <option value="testimony">Deposition Exhibit</option>
          </select>

          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setIsUploadModalOpen(true);
            }}
            className="retro-btn text-xs px-3 py-1.5 flex items-center space-x-1.5 border-red-700 text-red-300 hover:bg-red-950/60"
            title="Attach and log new MP3 audio reel or PDF document to this case file"
          >
            <Upload className="w-3.5 h-3.5 text-red-400" />
            <span>+ ATTACH EXHIBIT (MP3 / PDF)</span>
          </button>

          {onOpenEvidenceBoard && (
            <button
              onClick={onOpenEvidenceBoard}
              className="retro-btn text-xs px-3 py-1.5 flex items-center space-x-1.5 border-emerald-700 text-emerald-300 hover:bg-emerald-950/40"
            >
              <Pin className="w-3.5 h-3.5" />
              <span>OPEN EVIDENCE BOARD</span>
            </button>
          )}
        </div>
      </div>

      {/* Evidence Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvidence.map((ev, idx) => {
          const isAudio = isAudioMedia({ originalName: ev.title, url: ev.imageUrl, mediaType: ev.type });
          const isPdf = isPdfMedia({ originalName: ev.title, url: ev.imageUrl }) || (ev.imageUrl?.toLowerCase().includes('.pdf') ?? false);

          return (
            <div
              key={ev.id || idx}
              draggable
              onDragStart={(e) => {
                const label = `Exhibit ${ev.exhibitNumber || `EX-${(idx + 1).toString().padStart(2, '0')}`}`;
                const summaryText = `${ev.title} — ${ev.description}`;
                e.dataTransfer.setData(
                  DOCKET_PIN_DRAG_MIME,
                  JSON.stringify({
                    text: summaryText,
                    sourceLabel: label,
                    kind: 'evidence',
                    tone: 'emerald',
                  })
                );
                e.dataTransfer.setData('text/plain', `${label}: ${summaryText}`);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => {
                soundEngine.playFileAccess();
                setSelectedEvidence(ev);
                recordLedgerEvent(caseData.slug, {
                  caseNumber: caseData.caseNumber,
                  category: 'document_view',
                  action: 'Inspected Exhibit',
                  subject: `${ev.exhibitNumber || `EX-${(idx + 1).toString().padStart(2, '0')}`} · ${ev.title}`,
                  detail: ev.classification || ev.type,
                  dedupeKey: `ev-view-${ev.id || ev.title}`,
                });
              }}
              className="retro-window p-4 cursor-pointer hover:border-red-600/80 transition-all flex flex-col justify-between group bg-[#090b0d] hover:bg-[#0c0f13]"
              title="Click to inspect or drag exhibit directly into the Work Board"
            >
              <div>
                {/* Header: Reference Number & Classification */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-pixel text-[11px] text-red-400 font-bold">
                    REF: {ev.exhibitNumber || `EX-${(idx + 1).toString().padStart(2, '0')}`}
                  </span>
                  <span className="retro-stamp text-[8px] py-0 px-1">
                    {ev.classification || 'PUBLIC RECORD'}
                  </span>
                </div>

                {/* Exhibit Photograph Preview */}
                {!isAudio && !isPdf && (
                  <div className="mb-2.5 border border-zinc-800 bg-black/70 overflow-hidden rounded">
                    <img
                      src={getEvidenceImage(ev).url}
                      alt={ev.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}

                {/* Title */}
                <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-200 transition-colors mb-2 font-editorial">
                  <HighlightText text={ev.title} />
                </h4>

                {/* Description */}
                <p className="text-xs text-zinc-400 font-mono leading-relaxed line-clamp-3 mb-3">
                  <HighlightText text={ev.description} />
                </p>

                {/* Investigative Source / Significance */}
                <div className="p-2 bg-black/60 border border-zinc-900 rounded text-[10px] font-tech text-zinc-400">
                  <span className="text-amber-400/90 font-bold block mb-0.5">SOURCE / CONTEXT:</span>
                  <span className="line-clamp-2">
                    <HighlightText text={ev.significance || 'Documented in federal judicial records.'} />
                  </span>
                </div>
              </div>

              {/* Bottom Actions: Inspect & Pin to Board */}
              <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-tech">
                <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                  <span className="uppercase text-[10px] text-zinc-500 font-pixel">
                    {ev.type}
                  </span>
                  {isAudio && (
                    <span className="px-1.5 py-0.2 bg-amber-950 border border-amber-700 text-amber-300 text-[9px] font-pixel rounded flex items-center space-x-0.5">
                      <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                      <span>MP3 AUDIO REEL</span>
                    </span>
                  )}
                  {isPdf && (
                    <span className="px-1.5 py-0.2 bg-red-950 border border-red-700 text-red-300 text-[9px] font-pixel rounded flex items-center space-x-0.5">
                      <FileText className="w-2.5 h-2.5 text-red-400" />
                      <span>PDF DOCUMENT</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playBootBeep();
                      const label = `Exhibit ${ev.exhibitNumber || `EX-${(idx + 1).toString().padStart(2, '0')}`}`;
                      addWorkBoardPin(caseData.slug, {
                        caseNumber: caseData.caseNumber,
                        text: `${ev.title} — ${ev.description}`,
                        sourceLabel: label,
                        kind: 'evidence',
                        tone: 'emerald',
                      });
                      setAddedToast(`${ev.title} (Work Board)`);
                      setTimeout(() => setAddedToast(null), 2600);
                    }}
                    title="Pin this exhibit directly to the side-panel Work Board"
                    className="px-2 py-0.5 bg-zinc-900 hover:bg-amber-950/80 border border-zinc-700 hover:border-amber-500 text-zinc-300 hover:text-amber-300 rounded text-[10px] font-pixel flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5 text-amber-400" />
                    <span>WORK BOARD</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleAddToEvidenceBoard(ev, e)}
                    title="Pin this card onto your interactive evidence board"
                    className="px-2 py-0.5 bg-zinc-900 hover:bg-emerald-950/80 border border-zinc-700 hover:border-emerald-600 text-zinc-300 hover:text-emerald-300 rounded text-[10px] font-pixel flex items-center space-x-1 transition-colors"
                  >
                    <Pin className="w-2.5 h-2.5 text-emerald-400" />
                    <span>PIN FILE</span>
                  </button>

                  <span className="text-amber-400 font-pixel text-[10px] flex items-center group-hover:translate-x-0.5 transition-transform">
                    VIEW <Maximize2 className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Evidence Viewer Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 overflow-y-auto">
          <div className="retro-window max-w-3xl w-full p-6 text-zinc-300 space-y-4 shadow-2xl bg-[#07090b] border-2 border-red-900/70 max-h-[92vh] flex flex-col">
            {/* Modal Titlebar */}
            <div className="retro-window-header active flex items-center justify-between p-2 bg-zinc-900 border-b border-zinc-700">
              <div className="flex items-center space-x-2 text-xs font-pixel text-zinc-200">
                <Fingerprint className="w-4 h-4 text-red-500" />
                <span>
                  EXHIBIT VIEWER // {selectedEvidence.exhibitNumber || selectedEvidence.title}
                </span>
              </div>
              <button
                onClick={() => {
                  soundEngine.playKeyClick();
                  setSelectedEvidence(null);
                }}
                className="retro-btn retro-btn-red text-xs px-2.5 py-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Exhibit Details (Scrollable) */}
            <div className="space-y-3 font-mono text-xs overflow-y-auto pr-1">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                <div>
                  <span className="font-pixel text-[10px] text-red-400 font-bold block">
                    REFERENCE NO: {selectedEvidence.exhibitNumber || 'N/A'}
                  </span>
                  <h3 className="text-base font-bold font-editorial text-zinc-100">
                    {selectedEvidence.title}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="retro-stamp text-[9px] py-0.5 px-2">
                    {selectedEvidence.classification}
                  </span>
                  <div className="text-[10px] font-tech text-zinc-500 mt-1 uppercase">
                    TYPE: {selectedEvidence.type}
                  </div>
                </div>
              </div>

              {/* FORMAT-SPECIFIC VIEWER 1: PDF Document Viewer */}
              {(isPdfMedia({ originalName: selectedEvidence.title, url: selectedEvidence.imageUrl }) ||
                selectedEvidence.imageUrl?.toLowerCase().includes('.pdf')) &&
                selectedEvidence.imageUrl && (
                  <div className="my-3">
                    <RetroPdfViewer
                      url={selectedEvidence.imageUrl}
                      title={selectedEvidence.title}
                      caseNumber={caseData.caseNumber}
                      classification={selectedEvidence.classification}
                      description={selectedEvidence.description}
                      transcript={selectedEvidence.significance}
                    />
                  </div>
                )}

              {/* FORMAT-SPECIFIC VIEWER 2: Audio Player for Audio Exhibits & MP3s */}
              {(isAudioMedia({ originalName: selectedEvidence.title, url: selectedEvidence.imageUrl, mediaType: selectedEvidence.type }) ||
                selectedEvidence.type === 'audio' ||
                /audio|wiretap|recording|dispatch|tape|call/i.test(selectedEvidence.title) ||
                /audio|wiretap|recording|dispatch|tape|call/i.test(selectedEvidence.description)) && (
                <div className="my-3">
                  <RetroAudioPlayer
                    url={selectedEvidence.imageUrl || ''}
                    title={selectedEvidence.title}
                    caseNumber={caseData.caseNumber}
                    transcript={selectedEvidence.significance || selectedEvidence.description}
                    mediaType="audio"
                    defaultDuration={180}
                  />
                </div>
              )}

              {/* FORMAT-SPECIFIC VIEWER 3: Forensic Image Plate */}
              {!isPdfMedia({ originalName: selectedEvidence.title, url: selectedEvidence.imageUrl }) &&
                !isAudioMedia({ originalName: selectedEvidence.title, url: selectedEvidence.imageUrl, mediaType: selectedEvidence.type }) &&
                selectedEvidence.type !== 'audio' && (
                  <div className="my-2 border border-zinc-800 bg-black/80 rounded overflow-hidden">
                    <img
                      src={
                        isImageMedia({ originalName: selectedEvidence.title, url: selectedEvidence.imageUrl })
                          ? selectedEvidence.imageUrl
                          : getEvidenceImage(selectedEvidence).url
                      }
                      alt={selectedEvidence.title}
                      referrerPolicy="no-referrer"
                      className="w-full max-h-64 object-cover"
                    />
                    <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-800 text-[10px] font-tech text-zinc-400 flex items-center justify-between gap-2">
                      <span>{getEvidenceImage(selectedEvidence).caption}</span>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playKeyClick();
                          setEditingEvidencePhoto(selectedEvidence);
                        }}
                        className="px-2 py-0.5 bg-amber-950/70 hover:bg-amber-900 border border-amber-600 text-amber-200 rounded font-mono flex items-center space-x-1 shrink-0"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>EDIT PHOTO</span>
                      </button>
                    </div>
                  </div>
                )}

              {/* Description Block */}
              <div className="bg-[#0b0e11] p-3.5 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-pixel text-zinc-400 uppercase block">
                  Documented Description & Origin
                </span>
                <p className="text-zinc-200 leading-relaxed font-tech text-xs sm:text-sm">
                  {selectedEvidence.description}
                </p>
              </div>

              {/* Significance */}
              <div className="bg-[#0b0e11] p-3.5 border border-amber-900/40 space-y-1">
                <span className="text-[10px] font-pixel text-amber-400 uppercase block">
                  Investigative Significance & Judicial Weight
                </span>
                <p className="text-amber-200/90 leading-relaxed font-tech text-xs">
                  {selectedEvidence.significance}
                </p>
              </div>

              {/* Custody Information */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-tech text-zinc-400">
                <div className="p-2 bg-zinc-950 border border-zinc-900">
                  <span className="text-[10px] font-pixel text-zinc-500 block">RECOVERED DATE:</span>
                  <strong className="text-zinc-200">
                    {selectedEvidence.recoveredAt || 'Archived in primary case docket'}
                  </strong>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-900">
                  <span className="text-[10px] font-pixel text-zinc-500 block">CHAIN OF CUSTODY:</span>
                  <strong className="text-zinc-200">
                    {selectedEvidence.recoveredBy || 'Clerk of the Court / Forensic Division'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    soundEngine.playBootBeep();
                    const label = `Exhibit ${selectedEvidence.exhibitNumber || selectedEvidence.title}`;
                    addWorkBoardPin(caseData.slug, {
                      caseNumber: caseData.caseNumber,
                      text: `${selectedEvidence.title} — ${selectedEvidence.description}`,
                      sourceLabel: label,
                      kind: 'evidence',
                      tone: 'emerald',
                    });
                    setAddedToast(`${selectedEvidence.title} (Work Board)`);
                    setTimeout(() => setAddedToast(null), 2600);
                  }}
                  className="retro-btn text-xs px-3 py-1.5 flex items-center space-x-1.5 border-amber-700 text-amber-300 hover:bg-amber-950/60"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>PIN TO WORK BOARD</span>
                </button>

                <button
                  onClick={() => handleAddToEvidenceBoard(selectedEvidence)}
                  className="retro-btn text-xs px-3 py-1.5 flex items-center space-x-1.5 border-emerald-700 text-emerald-300 hover:bg-emerald-950/60"
                >
                  <Pin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PIN FILE TO EVIDENCE BOARD</span>
                </button>
              </div>

              <button
                onClick={() => {
                  soundEngine.playKeyClick();
                  setSelectedEvidence(null);
                }}
                className="retro-btn text-xs px-3 py-1.5"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Exhibit Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="retro-window max-w-lg w-full p-6 text-zinc-300 space-y-4 shadow-2xl bg-[#080b0f] border-2 border-red-700">
            <div className="retro-window-header active flex items-center justify-between p-2 bg-zinc-900 border-b border-zinc-700">
              <div className="flex items-center space-x-2 text-xs font-pixel text-red-400">
                <Upload className="w-4 h-4" />
                <span>ATTACH CASE EXHIBIT // {caseData.caseNumber}</span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="retro-btn text-xs px-2 py-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 font-mono text-xs">
              {uploadError && (
                <div className="p-2.5 bg-red-950/80 border border-red-600 text-red-300 rounded text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* File Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-pixel text-zinc-400 block uppercase">
                  Select File (MP3 Audio Reel, PDF Document, Image, Video):
                </label>
                <input
                  type="file"
                  required
                  accept="audio/*,video/*,image/*,.mp3,.mp4,.m4a,.mpeg,.mpg,.wav,.ogg,.aac,.flac,.webm,.mov,.avi,.pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      if (!uploadTitle) {
                        setUploadTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                      }
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-200 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:font-mono file:bg-red-950 file:text-red-300 hover:file:bg-red-900"
                />
                <span className="text-[9px] text-zinc-500 block">
                  Supports MP3 audio reels, PDF case transcripts, MP4/MPEG surveillance up to 50MB.
                </span>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-pixel text-zinc-400 block uppercase">
                  Exhibit Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 911 Emergency Call Tape / Grand Jury Motion"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-black/80 border border-zinc-800 p-2 rounded text-zinc-200 focus:border-red-600 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-pixel text-zinc-400 block uppercase">
                  Exhibit Description & Context:
                </label>
                <textarea
                  rows={2}
                  placeholder="Document origin, chain of custody, or forensic context..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full bg-black/80 border border-zinc-800 p-2 rounded text-zinc-200 focus:border-red-600 focus:outline-none"
                />
              </div>

              {/* Transcript */}
              <div className="space-y-1">
                <label className="text-[10px] font-pixel text-zinc-400 block uppercase">
                  Official Transcript / Text Excerpt (Optional):
                </label>
                <textarea
                  rows={3}
                  placeholder="[00:00] Dispatcher: State your emergency..."
                  value={uploadTranscript}
                  onChange={(e) => setUploadTranscript(e.target.value)}
                  className="w-full bg-black/80 border border-zinc-800 p-2 rounded text-zinc-200 focus:border-red-600 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="retro-btn text-xs px-3 py-1.5"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="retro-btn retro-btn-red text-xs px-4 py-1.5 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'ARCHIVING...' : 'LOG EXHIBIT TO DOCKET'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingEvidencePhoto && (
        <RetroPhotoEditor
          isOpen={Boolean(editingEvidencePhoto)}
          imageUrl={
            isImageMedia({ originalName: editingEvidencePhoto.title, url: editingEvidencePhoto.imageUrl }) &&
            editingEvidencePhoto.imageUrl
              ? editingEvidencePhoto.imageUrl
              : getEvidenceImage(editingEvidencePhoto).url
          }
          initialTitle={editingEvidencePhoto.title}
          initialDescription={editingEvidencePhoto.description}
          caseSlug={caseData.slug}
          caseNumber={caseData.caseNumber}
          onClose={() => setEditingEvidencePhoto(null)}
          onSaved={async (saved) => {
            await loadCaseUploadedMedia();
            setSelectedEvidence(convertMediaToEvidence(saved, 0));
          }}
          onOpenGitHubBackup={() => setIsGitHubBackupOpen(true)}
        />
      )}

      <GitHubBackupModal
        isOpen={isGitHubBackupOpen}
        onClose={() => setIsGitHubBackupOpen(false)}
        defaultCommitMessage={`302 Docket: Backup ${caseData.caseNumber} edited exhibit photo`}
      />
    </div>
  );
};

