import { recordLedgerEvent } from './investigativeLedger.ts';

export type StickyNoteTone = 'amber' | 'red' | 'emerald' | 'blue';
export type StickyNoteTag = 'Lead' | 'Contradiction' | 'Verify' | 'Precedent' | 'General';

export interface DocumentStickyNote {
  id: string;
  caseSlug: string;
  caseNumber: string;
  targetType: 'chapter_section' | 'document_section';
  chapterIndex?: number;
  documentId?: string;
  sectionId: string;
  sectionLabel: string;
  quotedExcerpt?: string;
  noteText: string;
  tone: StickyNoteTone;
  tag: StickyNoteTag;
  createdAt: string;
  updatedAt: string;
}

export const STICKY_NOTES_UPDATED_EVENT = 'docket_sticky_notes_updated';

function getStorageKey(caseSlug: string): string {
  return `docket_sticky_notes_${caseSlug}`;
}

export function loadStickyNotes(caseSlug: string): DocumentStickyNote[] {
  try {
    const raw = localStorage.getItem(getStorageKey(caseSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStickyNotes(caseSlug: string, notes: DocumentStickyNote[]): void {
  try {
    localStorage.setItem(getStorageKey(caseSlug), JSON.stringify(notes));
    window.dispatchEvent(new CustomEvent(STICKY_NOTES_UPDATED_EVENT, { detail: { caseSlug } }));
  } catch (err) {
    console.warn('Failed to save sticky notes:', err);
  }
}

export function addStickyNote(
  caseSlug: string,
  input: Omit<DocumentStickyNote, 'id' | 'caseSlug' | 'createdAt' | 'updatedAt'>
): DocumentStickyNote {
  const now = new Date().toISOString();
  const note: DocumentStickyNote = {
    ...input,
    id: `sn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    caseSlug,
    createdAt: now,
    updatedAt: now,
  };
  const existing = loadStickyNotes(caseSlug);
  saveStickyNotes(caseSlug, [note, ...existing]);
  recordLedgerEvent(caseSlug, {
    caseNumber: input.caseNumber,
    category: 'pin',
    action: 'Added Sticky Note',
    subject: input.sectionLabel,
    detail: input.quotedExcerpt
      ? `"${input.quotedExcerpt.slice(0, 70)}" — ${input.noteText.slice(0, 70)}`
      : input.noteText.slice(0, 120),
    dedupeKey: `sticky-${note.id}`,
  });
  return note;
}

export function updateStickyNote(
  caseSlug: string,
  noteId: string,
  updates: Partial<Pick<DocumentStickyNote, 'noteText' | 'tone' | 'tag' | 'quotedExcerpt'>>
): DocumentStickyNote[] {
  const now = new Date().toISOString();
  const next = loadStickyNotes(caseSlug).map((n) =>
    n.id === noteId ? { ...n, ...updates, updatedAt: now } : n
  );
  saveStickyNotes(caseSlug, next);
  return next;
}

export function deleteStickyNote(caseSlug: string, noteId: string): DocumentStickyNote[] {
  const next = loadStickyNotes(caseSlug).filter((n) => n.id !== noteId);
  saveStickyNotes(caseSlug, next);
  return next;
}

export function promoteStickyNoteToBoard(note: DocumentStickyNote): boolean {
  try {
    const boardKey = `board_${note.caseSlug}`;
    const raw = localStorage.getItem(boardKey);
    const parsed = raw ? JSON.parse(raw) : { items: [], connections: [] };
    const existingItems = Array.isArray(parsed.items) ? parsed.items : [];

    const boardId = `sticky-${note.id}`;
    if (existingItems.some((it: any) => it.id === boardId)) {
      return true;
    }

    const newItem = {
      id: boardId,
      title: `NOTE: ${note.sectionLabel}`,
      itemType: note.tag === 'Contradiction' ? 'statement' : 'document',
      status:
        note.tag === 'Contradiction'
          ? 'Documented Allegation'
          : note.tag === 'Verify'
          ? 'Forensic Theory'
          : 'Established Fact',
      x: 70 + (existingItems.length % 3) * 260,
      y: 60 + Math.floor(existingItems.length / 3) * 240,
      snippet: note.quotedExcerpt
        ? `${note.noteText}\n\nExcerpt: "${note.quotedExcerpt}"`
        : note.noteText,
      source: `Investigator Sticky Note (${note.tag}) · ${note.sectionLabel}`,
      date: note.createdAt.split('T')[0],
      caseSlug: note.caseSlug,
      caseNumber: note.caseNumber,
      tags: ['Sticky Note', note.tag],
    };

    localStorage.setItem(
      boardKey,
      JSON.stringify({
        ...parsed,
        items: [newItem, ...existingItems],
      })
    );
    return true;
  } catch {
    return false;
  }
}
