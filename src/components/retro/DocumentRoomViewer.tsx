import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileText,
  Search,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Download,
  Calendar,
  Building,
  Shield,
  FileCheck,
  ExternalLink,
  Upload,
  X,
  AlertCircle,
} from 'lucide-react';
import { ArchiveDocument } from '../../types.ts';
import { archiveDocuments } from '../../data/archiveVaultData.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { RetroPdfViewer } from '../common/RetroPdfViewer.tsx';
import { LEGAL_DOCTRINE_GLOSSARY, LegalDoctrineRef } from '../../data/legalDilemmasData.ts';
import { BookOpen } from 'lucide-react';
import {
  fetchAllMedia,
  uploadMediaFile,
  isPdfMedia,
  isAudioMedia,
  isVideoMedia,
  convertMediaToDocument,
  MEDIA_UPDATED_EVENT,
} from '../../utils/mediaVault.ts';

interface DocumentRoomViewerProps {
  onOpenCase?: (slug: string) => void;
}

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

export const DocumentRoomViewer: React.FC<DocumentRoomViewerProps> = ({ onOpenCase }) => {
  const [uploadedDocs, setUploadedDocs] = useState<ArchiveDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDocId, setSelectedDocId] = useState<string>(archiveDocuments[0].id);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [revealRedactions, setRevealRedactions] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>('pdf');
  const [selectedDoctrine, setSelectedDoctrine] = useState<LegalDoctrineRef | null>(null);

  // Upload PDF modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaseSlug, setUploadCaseSlug] = useState('jonbenet-ramsey-boulder');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTranscript, setUploadTranscript] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadUploadedDocuments = async () => {
    try {
      const items = await fetchAllMedia();
      // Include PDFs and non-audio/non-video uploaded document exhibits
      const docItems = items.filter(
        (m) => isPdfMedia(m) || (!isAudioMedia(m) && !isVideoMedia(m) && !m.mimeType?.startsWith('image/'))
      );
      const converted = docItems.map((m) => convertMediaToDocument(m));
      setUploadedDocs(converted);
    } catch (err) {
      console.warn('Error loading uploaded PDFs for Document Room:', err);
    }
  };

  useEffect(() => {
    loadUploadedDocuments();
    const handleUpdate = () => loadUploadedDocuments();
    window.addEventListener(MEDIA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(MEDIA_UPDATED_EVENT, handleUpdate);
  }, []);

  const allDocs = [...uploadedDocs, ...archiveDocuments];
  const activeDoc = allDocs.find((d) => d.id === selectedDocId) || allDocs[0];
  const isPdfDoc = Boolean(
    activeDoc.downloadUrl && isPdfMedia({ url: activeDoc.downloadUrl, originalName: activeDoc.title })
  );

  // Reset view mode when switching documents
  useEffect(() => {
    if (activeDoc.downloadUrl && isPdfMedia({ url: activeDoc.downloadUrl, originalName: activeDoc.title })) {
      setViewMode('pdf');
    } else {
      setViewMode('text');
    }
  }, [activeDoc.id, activeDoc.downloadUrl]);

  const categories = ['All', 'Court Records', 'Grand Jury Exhibits', 'Coroner Autopsies', 'FD-302 Reports'];

  const filteredDocs = allDocs.filter((doc) => {
    if (selectedCategory !== 'All' && doc.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.caseNumber.toLowerCase().includes(q) ||
        doc.documentBody.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleZoomIn = () => {
    soundEngine.playKeyClick();
    setZoomLevel((prev) => Math.min(prev + 15, 160));
  };

  const handleZoomOut = () => {
    soundEngine.playKeyClick();
    setZoomLevel((prev) => Math.max(prev - 15, 80));
  };

  const toggleRedactions = () => {
    soundEngine.playKeyClick();
    setRevealRedactions((prev) => !prev);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      soundEngine.playKeyClick();
      const matchingCase = CASE_OPTIONS.find((c) => c.slug === uploadCaseSlug);
      const saved = await uploadMediaFile(uploadFile, {
        caseSlug: uploadCaseSlug,
        caseNumber: matchingCase?.number,
        title: uploadTitle.trim() || uploadFile.name,
        description: uploadDesc.trim(),
        transcript: uploadTranscript.trim(),
      });

      soundEngine.playBootBeep();
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDesc('');
      setUploadTranscript('');
      await loadUploadedDocuments();
      setSelectedDocId(`doc-${saved.id}`);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload PDF document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0a0d11] text-zinc-300 font-tech select-none overflow-hidden">
      {/* Left Sidebar: Vintage Document Folder Tree */}
      <div className="w-full md:w-80 bg-[#101318] border-b md:border-b-0 md:border-r border-[#262b35] flex flex-col">
        {/* Title */}
        <div className="p-3 border-b border-[#262b35] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-amber-400">
            <Folder className="w-4 h-4 text-amber-500" />
            <span className="font-bold">DOCUMENT ROOM // EXHIBITS</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {allDocs.length} FILES
          </span>
        </div>

        {/* Upload PDF Document Action */}
        <div className="p-2 border-b border-[#262b35] bg-[#0e1218]">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setIsUploadModalOpen(true);
            }}
            className="w-full py-1.5 px-3 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-mono font-bold rounded flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-red-400" />
            <span>+ UPLOAD PDF DOCUMENT</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-2 border-b border-[#262b35] bg-[#0c0e12]">
          <div className="flex items-center px-2 py-1 bg-zinc-900 border border-zinc-800 rounded">
            <Search className="w-3.5 h-3.5 text-zinc-500 mr-2" />
            <input
              type="text"
              placeholder="Filter archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Folder Categories Filter */}
        <div className="p-2 border-b border-[#262b35] flex flex-wrap gap-1 bg-[#141820]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                soundEngine.playKeyClick();
                setSelectedCategory(cat);
              }}
              className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                selectedCategory === cat
                  ? 'bg-amber-950 border border-amber-700 text-amber-300'
                  : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
          {filteredDocs.map((doc) => {
            const isSelected = doc.id === activeDoc.id;
            const hasPdf = Boolean(doc.downloadUrl && isPdfMedia({ url: doc.downloadUrl, originalName: doc.title }));
            return (
              <button
                key={doc.id}
                onClick={() => {
                  soundEngine.playFileAccess();
                  setSelectedDocId(doc.id);
                }}
                className={`w-full p-3 text-left transition-colors flex flex-col space-y-1 ${
                  isSelected
                    ? 'bg-zinc-800/90 border-l-4 border-red-500'
                    : 'hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500 uppercase">{doc.caseNumber}</span>
                  {hasPdf ? (
                    <span className="px-1.5 py-0.2 bg-red-950 border border-red-700 text-red-300 text-[9px] rounded font-bold">
                      PDF FILE
                    </span>
                  ) : (
                    <span className="text-zinc-400">{doc.date.split(' ')[0]}</span>
                  )}
                </div>
                <div className="text-xs font-bold text-zinc-200 line-clamp-2 font-mono">
                  {doc.title}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {doc.classification} &bull; {doc.pageCount} Pages
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Document Reading Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {/* Document Viewer Toolbar */}
        <div className="p-3 bg-[#13171f] border-b border-[#262b35] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 font-pixel text-[10px]">
              VIEWER v2.4
            </span>
            <span className="text-amber-400 font-mono font-bold text-xs truncate max-w-xs sm:max-w-md">
              {activeDoc.title}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {isPdfDoc && (
              <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded p-0.5 text-[10px] font-mono">
                <button
                  onClick={() => {
                    soundEngine.playKeyClick();
                    setViewMode('pdf');
                  }}
                  className={`px-2 py-0.5 rounded ${
                    viewMode === 'pdf' ? 'bg-red-950 text-red-200 font-bold' : 'text-zinc-400'
                  }`}
                >
                  PDF VIEW
                </button>
                <button
                  onClick={() => {
                    soundEngine.playKeyClick();
                    setViewMode('text');
                  }}
                  className={`px-2 py-0.5 rounded ${
                    viewMode === 'text' ? 'bg-zinc-800 text-amber-300 font-bold' : 'text-zinc-400'
                  }`}
                >
                  RECORD NOTES
                </button>
              </div>
            )}

            {/* Redaction toggle */}
            <button
              onClick={toggleRedactions}
              className={`px-2 py-1 text-xs font-mono rounded flex items-center space-x-1 border ${
                revealRedactions
                  ? 'bg-red-950 border-red-700 text-red-300'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle reveal of genuine statutory redaction reasons"
            >
              {revealRedactions ? <Eye className="w-3.5 h-3.5 text-red-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {revealRedactions ? 'REDACTIONS: SHOWN' : 'REDACTIONS: MASKED'}
              </span>
            </button>

            {/* Zoom Controls */}
            {viewMode === 'text' && (
              <div className="flex items-center space-x-1 bg-zinc-900 border border-zinc-800 rounded p-0.5 font-mono text-[11px]">
                <button
                  onClick={handleZoomOut}
                  className="p-1 text-zinc-400 hover:text-zinc-100"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 text-zinc-400">{zoomLevel}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 text-zinc-400 hover:text-zinc-100"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Document Page Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-[#07090c]">
          {isPdfDoc && viewMode === 'pdf' && activeDoc.downloadUrl ? (
            <div className="w-full max-w-4xl">
              <RetroPdfViewer
                key={activeDoc.id}
                url={activeDoc.downloadUrl}
                title={activeDoc.title}
                caseNumber={activeDoc.caseNumber}
                classification={activeDoc.classification}
                date={activeDoc.date}
                authorOrAgency={activeDoc.authorOrAgency}
                description={activeDoc.summary}
                transcript={activeDoc.documentBody}
              />
            </div>
          ) : (
            <div
              className="w-full max-w-3xl bg-[#0f1115] border-2 border-zinc-800 rounded shadow-2xl p-6 sm:p-10 transition-all font-typewriter"
              style={{ fontSize: `${zoomLevel * 0.01 * 13}px` }}
            >
              {/* Top Official Stamp */}
              <div className="flex items-center justify-between border-b-2 border-zinc-700 pb-4 mb-6 text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="font-bold text-zinc-200 text-sm tracking-wider">
                    {activeDoc.authorOrAgency}
                  </div>
                  <div className="text-zinc-400">
                    DATE: {activeDoc.date} | REPO REF: {activeDoc.caseNumber}
                  </div>
                </div>
                <div className="px-3 py-1 border-2 border-red-600 text-red-400 font-pixel text-xs tracking-widest uppercase rotate-2">
                  {activeDoc.classification}
                </div>
              </div>

              {/* Document Body with Interactive Legal Doctrine Cross-References */}
              {selectedDoctrine && (
                <div className="mb-5 p-3.5 bg-[#090d14] border border-amber-600/80 rounded space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                    <span className="text-[10px] font-pixel text-amber-400 flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>LEGAL CROSS-REFERENCE // {selectedDoctrine.citation}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDoctrine(null)}
                      className="text-zinc-400 hover:text-zinc-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-bold text-amber-300">{selectedDoctrine.term}</div>
                  <p className="text-zinc-300 font-tech leading-relaxed">{selectedDoctrine.summary}</p>
                </div>
              )}

              <div className="space-y-4 text-zinc-300 leading-relaxed whitespace-pre-line font-mono">
                {(() => {
                  const terms = LEGAL_DOCTRINE_GLOSSARY.map((d) => d.term).sort((a, b) => b.length - a.length);
                  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(`(${terms.map(esc).join('|')})`, 'gi');
                  return activeDoc.documentBody.split(regex).map((chunk, i) => {
                    const hit = LEGAL_DOCTRINE_GLOSSARY.find(
                      (d) => d.term.toLowerCase() === chunk.toLowerCase()
                    );
                    if (!hit) return <React.Fragment key={i}>{chunk}</React.Fragment>;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          soundEngine.playCrossRefLink();
                          setSelectedDoctrine(hit);
                        }}
                        className="inline border-b border-dotted border-amber-500 text-amber-300 hover:bg-amber-950/60 px-0.5 font-semibold cursor-pointer"
                        title={`Inspect legal doctrine: ${hit.citation}`}
                      >
                        {chunk}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Redactions Analysis Box if Present */}
              {activeDoc.redactions.length > 0 && (
                <div className="mt-8 p-4 bg-zinc-900/80 border border-zinc-800 rounded text-xs font-mono space-y-2">
                  <div className="text-red-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                    <Shield className="w-4 h-4" />
                    <span>DOCUMENT REDACTION AUDIT NOTICE:</span>
                  </div>
                  {activeDoc.redactions.map((red) => (
                    <div key={red.id} className="text-zinc-400">
                      <span className="text-zinc-200 font-bold">[{red.label}]</span>: {red.reason}
                      {revealRedactions && (
                        <span className="block mt-0.5 text-red-300 italic">
                          {red.redactedText}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Document Citation Footer */}
              <div className="mt-8 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-500">
                <div>
                  PRIMARY RECORD: <span className="text-zinc-300">{activeDoc.officialCitation}</span>
                </div>
                {onOpenCase && activeDoc.caseSlug && activeDoc.caseSlug !== 'general-archive' && (
                  <button
                    onClick={() => onOpenCase(activeDoc.caseSlug)}
                    className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 rounded flex items-center space-x-1 text-xs"
                  >
                    <span>OPEN DOSSIER</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload PDF Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161f] border-2 border-red-700 rounded-lg max-w-md w-full p-5 shadow-2xl font-mono text-xs text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-red-400 font-bold">
                <FileText className="w-4 h-4 text-red-500" />
                <span>FILE PDF RECORD TO DOCUMENT ROOM</span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              {uploadError && (
                <div className="p-2 bg-red-950/80 border border-red-600 text-red-300 rounded flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Select PDF Document *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      if (!uploadTitle) {
                        setUploadTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                      }
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-200 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:font-mono file:bg-red-950 file:text-red-300"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Assign Case Docket *
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
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Grand Jury Indictment Filing"
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Docket Summary
                </label>
                <input
                  type="text"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Official court filing summary..."
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Text Excerpt / Transcript Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={uploadTranscript}
                  onChange={(e) => setUploadTranscript(e.target.value)}
                  placeholder="Paste key text excerpts or notes..."
                  className="w-full bg-zinc-950 border border-zinc-700 p-2 rounded text-zinc-200 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'FILING...' : 'ARCHIVE PDF'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
