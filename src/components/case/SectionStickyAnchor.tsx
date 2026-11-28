import React, { useState } from 'react';
import { StickyNote, Plus, Edit3, Trash2, Check, X, Pin, Quote } from 'lucide-react';
import {
  DocumentStickyNote,
  StickyNoteTone,
  StickyNoteTag,
  addStickyNote,
  updateStickyNote,
  deleteStickyNote,
  promoteStickyNoteToBoard,
} from '../../utils/stickyNotes.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface SectionStickyAnchorProps {
  caseSlug: string;
  caseNumber: string;
  targetType: 'chapter_section' | 'document_section';
  chapterIndex?: number;
  documentId?: string;
  sectionId: string;
  sectionLabel: string;
  notes: DocumentStickyNote[];
  compactButton?: boolean;
}

const TONE_STYLES: Record<
  StickyNoteTone,
  { card: string; pin: string; badge: string; label: string }
> = {
  amber: {
    card: 'bg-[#1a1509] border-amber-500/75 text-amber-100 shadow-[0_4px_16px_rgba(245,158,11,0.12)]',
    pin: 'bg-amber-400 border-amber-200',
    badge: 'bg-amber-950/90 text-amber-300 border-amber-700',
    label: 'Legal Pad Amber',
  },
  red: {
    card: 'bg-[#1e0b0e] border-red-500/80 text-red-100 shadow-[0_4px_16px_rgba(239,68,68,0.14)]',
    pin: 'bg-red-500 border-red-200',
    badge: 'bg-red-950/90 text-red-300 border-red-700',
    label: 'Urgent Red Flag',
  },
  emerald: {
    card: 'bg-[#091a13] border-emerald-500/75 text-emerald-100 shadow-[0_4px_16px_rgba(16,185,129,0.12)]',
    pin: 'bg-emerald-400 border-emerald-200',
    badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-700',
    label: 'Forensic Green',
  },
  blue: {
    card: 'bg-[#0b1524] border-blue-500/75 text-blue-100 shadow-[0_4px_16px_rgba(59,130,246,0.12)]',
    pin: 'bg-blue-400 border-blue-200',
    badge: 'bg-blue-950/90 text-blue-300 border-blue-700',
    label: 'Precedent Blue',
  },
};

const TAGS: StickyNoteTag[] = ['Lead', 'Contradiction', 'Verify', 'Precedent', 'General'];

export const SectionStickyTrigger: React.FC<{
  count: number;
  isComposerOpen: boolean;
  onToggleComposer: () => void;
}> = ({ count, isComposerOpen, onToggleComposer }) => (
  <button
    type="button"
    onClick={() => {
      soundEngine.playKeyClick();
      onToggleComposer();
    }}
    className={`px-2 py-0.5 rounded border font-mono text-[10px] inline-flex items-center space-x-1 transition-colors shrink-0 ${
      isComposerOpen || count > 0
        ? 'bg-amber-950/60 border-amber-600/80 text-amber-300 hover:bg-amber-900/70'
        : 'bg-zinc-900/90 border-zinc-700 text-zinc-400 hover:text-amber-300 hover:border-amber-600/70'
    }`}
    title="Place a digital sticky note on this section"
  >
    <StickyNote className="w-3 h-3" />
    <span>{isComposerOpen ? 'CLOSE NOTE' : count > 0 ? `+ NOTE (${count})` : '+ STICKY NOTE'}</span>
  </button>
);

export const SectionStickyListAndComposer: React.FC<
  SectionStickyAnchorProps & {
    isComposerOpen: boolean;
    onCloseComposer: () => void;
    initialExcerpt?: string;
  }
> = ({
  caseSlug,
  caseNumber,
  targetType,
  chapterIndex,
  documentId,
  sectionId,
  sectionLabel,
  notes,
  isComposerOpen,
  onCloseComposer,
  initialExcerpt = '',
}) => {
  const [noteText, setNoteText] = useState('');
  const [quotedExcerpt, setQuotedExcerpt] = useState(initialExcerpt);
  const [tone, setTone] = useState<StickyNoteTone>('amber');
  const [tag, setTag] = useState<StickyNoteTag>('Lead');

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editDraftText, setEditDraftText] = useState('');
  const [editDraftTone, setEditDraftTone] = useState<StickyNoteTone>('amber');
  const [editDraftTag, setEditDraftTag] = useState<StickyNoteTag>('Lead');
  const [pinnedToBoardId, setPinnedToBoardId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isComposerOpen && initialExcerpt) {
      setQuotedExcerpt(initialExcerpt);
    }
  }, [isComposerOpen, initialExcerpt]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    soundEngine.playBootBeep();
    addStickyNote(caseSlug, {
      caseNumber,
      targetType,
      chapterIndex,
      documentId,
      sectionId,
      sectionLabel,
      quotedExcerpt: quotedExcerpt.trim() || undefined,
      noteText: noteText.trim(),
      tone,
      tag,
    });
    setNoteText('');
    setQuotedExcerpt('');
    onCloseComposer();
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editDraftText.trim()) return;
    soundEngine.playKeyClick();
    updateStickyNote(caseSlug, noteId, {
      noteText: editDraftText.trim(),
      tone: editDraftTone,
      tag: editDraftTag,
    });
    setEditingNoteId(null);
  };

  if (!isComposerOpen && notes.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2.5">
      {/* Inline Sticky Note Composer */}
      {isComposerOpen && (
        <form
          onSubmit={handleCreateNote}
          className="p-3 bg-[#151209] border-2 border-amber-500/80 rounded shadow-xl space-y-2.5 font-mono text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/50 pb-1.5">
            <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-[11px]">
              <StickyNote className="w-3.5 h-3.5" />
              <span>PIN STICKY NOTE &middot; {sectionLabel}</span>
            </div>
            <button
              type="button"
              onClick={onCloseComposer}
              className="text-zinc-400 hover:text-zinc-100 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-400">Color:</span>
              {(['amber', 'red', 'emerald', 'blue'] as StickyNoteTone[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  title={TONE_STYLES[t].label}
                  className={`w-4 h-4 rounded-full border-2 ${TONE_STYLES[t].pin} ${
                    tone === t ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-400">Tag:</span>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as StickyNoteTag)}
                className="bg-black border border-zinc-700 px-2 py-0.5 rounded text-amber-200 focus:outline-none focus:border-amber-500"
              >
                {TAGS.map((tg) => (
                  <option key={tg} value={tg}>
                    {tg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="text"
            value={quotedExcerpt}
            onChange={(e) => setQuotedExcerpt(e.target.value)}
            placeholder="Optional quoted passage / line reference from this section..."
            className="w-full bg-black/70 border border-zinc-800 px-2.5 py-1 rounded text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />

          <textarea
            rows={2}
            required
            autoFocus
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write investigator annotation, discrepancy, follow-up lead, or legal observation..."
            className="w-full bg-black/80 border border-zinc-700 p-2 rounded text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />

          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onCloseComposer}
              className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pin Note to Section</span>
            </button>
          </div>
        </form>
      )}

      {/* Pinned Sticky Notes Grid */}
      {notes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {notes.map((note) => {
            const style = TONE_STYLES[note.tone] || TONE_STYLES.amber;
            const isEditing = editingNoteId === note.id;

            return (
              <div
                key={note.id}
                className={`relative rounded border p-3 pt-3.5 font-mono text-xs transition-all ${style.card}`}
              >
                {/* Sticky Note Top Pin */}
                <div
                  className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border shadow ${style.pin}`}
                />

                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded border text-[9px] font-pixel uppercase ${style.badge}`}
                  >
                    {note.tag}
                  </span>
                  <div className="flex items-center space-x-1">
                    {!isEditing && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playBootBeep();
                            promoteStickyNoteToBoard(note);
                            setPinnedToBoardId(note.id);
                            setTimeout(() => setPinnedToBoardId(null), 2200);
                          }}
                          className="p-1 text-zinc-400 hover:text-emerald-300"
                          title="Send sticky note to Case Evidence Board"
                        >
                          {pinnedToBoardId === note.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Pin className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditDraftText(note.noteText);
                            setEditDraftTone(note.tone);
                            setEditDraftTag(note.tag);
                          }}
                          className="p-1 text-zinc-400 hover:text-amber-300"
                          title="Edit note"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playKeyClick();
                        deleteStickyNote(caseSlug, note.id);
                      }}
                      className="p-1 text-zinc-400 hover:text-red-400"
                      title="Remove sticky note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {note.quotedExcerpt && (
                  <div className="mb-1.5 px-2 py-1 bg-black/40 border-l-2 border-zinc-500 text-[10px] italic text-zinc-300 flex items-start space-x-1">
                    <Quote className="w-2.5 h-2.5 shrink-0 mt-0.5 text-zinc-400" />
                    <span className="line-clamp-2">{note.quotedExcerpt}</span>
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <div className="flex items-center space-x-1">
                        {(['amber', 'red', 'emerald', 'blue'] as StickyNoteTone[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setEditDraftTone(t)}
                            className={`w-3.5 h-3.5 rounded-full border ${TONE_STYLES[t].pin} ${
                              editDraftTone === t ? 'ring-1 ring-white scale-110' : 'opacity-65'
                            }`}
                          />
                        ))}
                      </div>
                      <select
                        value={editDraftTag}
                        onChange={(e) => setEditDraftTag(e.target.value as StickyNoteTag)}
                        className="bg-black border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-200"
                      >
                        {TAGS.map((tg) => (
                          <option key={tg} value={tg}>
                            {tg}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      value={editDraftText}
                      onChange={(e) => setEditDraftText(e.target.value)}
                      className="w-full bg-black/80 border border-zinc-600 p-1.5 rounded text-xs text-zinc-100"
                    />
                    <div className="flex justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(note.id)}
                        className="px-2 py-0.5 bg-amber-500 text-black font-bold rounded text-[10px]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-tech leading-relaxed whitespace-pre-wrap">
                    {note.noteText}
                  </p>
                )}

                <div className="mt-2 pt-1 border-t border-black/30 flex items-center justify-between text-[9px] opacity-65">
                  <span>{new Date(note.updatedAt).toLocaleString()}</span>
                  {pinnedToBoardId === note.id && (
                    <span className="text-emerald-300 font-bold">Sent to Evidence Board</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
