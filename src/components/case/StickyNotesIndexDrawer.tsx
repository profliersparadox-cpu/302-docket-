import React, { useState } from 'react';
import { StickyNote, X, Trash2, ArrowRight, Search, Pin, Check, Quote } from 'lucide-react';
import {
  DocumentStickyNote,
  StickyNoteTag,
  deleteStickyNote,
  promoteStickyNoteToBoard,
} from '../../utils/stickyNotes.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface StickyNotesIndexDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseSlug: string;
  notes: DocumentStickyNote[];
  onJumpToNote: (note: DocumentStickyNote) => void;
}

const TONE_BORDER: Record<string, string> = {
  amber: 'border-amber-500/75 bg-[#191408]',
  red: 'border-red-500/75 bg-[#1d0b0e]',
  emerald: 'border-emerald-500/75 bg-[#091913]',
  blue: 'border-blue-500/75 bg-[#0b1523]',
};

export const StickyNotesIndexDrawer: React.FC<StickyNotesIndexDrawerProps> = ({
  isOpen,
  onClose,
  caseSlug,
  notes,
  onJumpToNote,
}) => {
  const [tagFilter, setTagFilter] = useState<'All' | StickyNoteTag>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [promotedId, setPromotedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = notes.filter((n) => {
    if (tagFilter !== 'All' && n.tag !== tagFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        n.noteText.toLowerCase().includes(q) ||
        n.sectionLabel.toLowerCase().includes(q) ||
        (n.quotedExcerpt && n.quotedExcerpt.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-4 bg-[#090d14] border-2 border-amber-500/80 rounded shadow-2xl space-y-3 font-mono text-xs dossier-chapter-enter">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
        <div className="flex items-center space-x-2 text-amber-300">
          <StickyNote className="w-4 h-4 text-amber-400" />
          <span className="font-pixel text-[11px] uppercase font-bold">
            INVESTIGATOR STICKY NOTES INDEX ({notes.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black border border-zinc-700 pl-6 pr-2 py-1 rounded text-[11px] text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value as 'All' | StickyNoteTag)}
            className="bg-black border border-zinc-700 px-2 py-1 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Tags ({notes.length})</option>
            <option value="Lead">Lead</option>
            <option value="Contradiction">Contradiction</option>
            <option value="Verify">Verify</option>
            <option value="Precedent">Precedent</option>
            <option value="General">General</option>
          </select>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1"
            aria-label="Close sticky notes index"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 text-center bg-black/50 border border-dashed border-zinc-800 rounded text-zinc-400">
          {notes.length === 0
            ? 'No sticky notes placed yet. Click "+ STICKY NOTE" on any chapter or loaded document section below to pin an annotation.'
            : 'No sticky notes match your current filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
          {filtered.map((note) => (
            <div
              key={note.id}
              className={`p-3 rounded border flex flex-col justify-between space-y-2 ${
                TONE_BORDER[note.tone] || TONE_BORDER.amber
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="font-bold text-amber-300 truncate">{note.sectionLabel}</span>
                  <span className="px-1.5 py-0.5 bg-black/50 border border-zinc-700 rounded text-[9px] text-zinc-300 shrink-0">
                    {note.tag}
                  </span>
                </div>

                {note.quotedExcerpt && (
                  <div className="px-2 py-1 bg-black/40 border-l-2 border-zinc-500 text-[10px] italic text-zinc-300 flex items-start space-x-1">
                    <Quote className="w-2.5 h-2.5 shrink-0 mt-0.5 text-zinc-400" />
                    <span className="line-clamp-1">{note.quotedExcerpt}</span>
                  </div>
                )}

                <p className="text-xs font-tech text-zinc-100 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {note.noteText}
                </p>
              </div>

              <div className="pt-2 border-t border-black/40 flex items-center justify-between gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playFileAccess();
                    onJumpToNote(note);
                  }}
                  className="text-amber-300 hover:text-amber-100 font-bold flex items-center space-x-1"
                >
                  <span>JUMP TO SECTION</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playBootBeep();
                      promoteStickyNoteToBoard(note);
                      setPromotedId(note.id);
                      setTimeout(() => setPromotedId(null), 2000);
                    }}
                    className="p-1 text-zinc-400 hover:text-emerald-300"
                    title="Pin sticky note to Evidence Board"
                  >
                    {promotedId === note.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Pin className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyClick();
                      deleteStickyNote(caseSlug, note.id);
                    }}
                    className="p-1 text-zinc-400 hover:text-red-400"
                    title="Delete sticky note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
