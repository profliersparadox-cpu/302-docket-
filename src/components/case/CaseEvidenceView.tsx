import React, { useState } from 'react';
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
} from 'lucide-react';
import { CaseFile, EvidenceItem } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

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
        const newItem = {
          id: `ev-${ev.id}`,
          title: ev.title,
          itemType: ev.type || 'physical',
          status: ev.classification === 'Confidential' ? 'Forensic Theory' : 'Established Fact',
          x: 100 + ((boardData.items?.length || 0) % 3) * 260,
          y: 80 + Math.floor((boardData.items?.length || 0) / 3) * 190,
          snippet: ev.description,
          source: ev.significance,
          date: ev.recoveredAt,
          caseSlug: caseData.slug,
          caseNumber: caseData.caseNumber,
          tags: [ev.type, ev.classification],
        };
        boardData.items = [...(boardData.items || []), newItem];
        localStorage.setItem(storageKey, JSON.stringify(boardData));
      }
    } catch (err) {
      console.error('Failed to save to evidence board storage', err);
    }

    // Trigger visual toast animation
    setAddedToast(ev.exhibitNumber || ev.title);
    setTimeout(() => {
      setAddedToast(null);
    }, 2800);
  };

  const filteredEvidence = caseData.evidence.filter((ev) => {
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
                {caseData.evidence.length} EXHIBITS LOGGED
              </span>
            </div>
            <h3 className="text-base font-bold font-editorial text-zinc-100">
              Chain of Custody & Physical Exhibits
            </h3>
          </div>
        </div>

        {/* Filters */}
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
            <option value="all">ALL TYPES ({caseData.evidence.length})</option>
            <option value="document">Documentary</option>
            <option value="forensic">Forensic / DNA</option>
            <option value="digital">Digital / Cyber</option>
            <option value="physical">Physical Exhibit</option>
            <option value="testimony">Deposition Exhibit</option>
          </select>

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
        {filteredEvidence.map((ev, idx) => (
          <div
            key={ev.id || idx}
            onClick={() => {
              soundEngine.playFileAccess();
              setSelectedEvidence(ev);
            }}
            className="retro-window p-4 cursor-pointer hover:border-red-600/80 transition-all flex flex-col justify-between group bg-[#090b0d] hover:bg-[#0c0f13]"
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

              {/* Title */}
              <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-200 transition-colors mb-2 font-editorial">
                {ev.title}
              </h4>

              {/* Description */}
              <p className="text-xs text-zinc-400 font-mono leading-relaxed line-clamp-3 mb-3">
                {ev.description}
              </p>

              {/* Investigative Source / Significance */}
              <div className="p-2 bg-black/60 border border-zinc-900 rounded text-[10px] font-tech text-zinc-400">
                <span className="text-amber-400/90 font-bold block mb-0.5">SOURCE / CONTEXT:</span>
                <span className="line-clamp-2">{ev.significance || 'Documented in federal judicial records.'}</span>
              </div>
            </div>

            {/* Bottom Actions: Inspect & Pin to Board */}
            <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-tech">
              <span className="uppercase text-[10px] text-zinc-500 font-pixel">
                {ev.type}
              </span>

              <div className="flex items-center space-x-2">
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
        ))}
      </div>

      {/* Detailed Evidence Viewer Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="retro-window max-w-2xl w-full p-6 text-zinc-300 space-y-4 shadow-2xl bg-[#07090b] border-2 border-red-900/70">
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

            {/* Exhibit Details */}
            <div className="space-y-3 font-mono text-xs">
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
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <button
                onClick={() => handleAddToEvidenceBoard(selectedEvidence)}
                className="retro-btn text-xs px-3 py-1.5 flex items-center space-x-1.5 border-emerald-700 text-emerald-300 hover:bg-emerald-950/60"
              >
                <Pin className="w-3.5 h-3.5 text-emerald-400" />
                <span>PIN FILE TO EVIDENCE BOARD</span>
              </button>

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
    </div>
  );
};
