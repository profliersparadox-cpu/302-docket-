import React, { useState } from 'react';
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
} from 'lucide-react';
import { ArchiveDocument } from '../../types.ts';
import { archiveDocuments } from '../../data/archiveVaultData.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface DocumentRoomViewerProps {
  onOpenCase?: (slug: string) => void;
}

export const DocumentRoomViewer: React.FC<DocumentRoomViewerProps> = ({ onOpenCase }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDocId, setSelectedDocId] = useState<string>(archiveDocuments[0].id);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [revealRedactions, setRevealRedactions] = useState<boolean>(false);

  const activeDoc = archiveDocuments.find((d) => d.id === selectedDocId) || archiveDocuments[0];

  const categories = ['All', 'Court Records', 'Grand Jury Exhibits', 'Coroner Autopsies', 'FD-302 Reports'];

  const filteredDocs = archiveDocuments.filter((doc) => {
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
            {archiveDocuments.length} FILES
          </span>
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
                  <span className="text-zinc-400">{doc.date.split(' ')[0]}</span>
                </div>
                <div className="text-xs font-bold text-zinc-200 line-clamp-2 font-mono">
                  {doc.title}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {doc.classification} • {doc.pageCount} Pages
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
          </div>
        </div>

        {/* Document Page Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-[#07090c]">
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

            {/* Document Body with Redactions */}
            <div className="space-y-4 text-zinc-300 leading-relaxed whitespace-pre-line font-mono">
              {activeDoc.documentBody}
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
              {onOpenCase && activeDoc.caseSlug && (
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
        </div>
      </div>
    </div>
  );
};
