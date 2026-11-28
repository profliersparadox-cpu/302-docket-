import { recordLedgerEvent } from './investigativeLedger.ts';

export type WorkBoardRelation = 'supports' | 'contradicts' | 'corroborates' | 'timeline';
export type WorkBoardTone = 'amber' | 'emerald' | 'red' | 'cyan';

export interface WorkBoardPin {
  id: string;
  caseSlug: string;
  caseNumber: string;
  text: string;
  sourceLabel: string;
  kind: 'fragment' | 'highlight' | 'evidence';
  tone: WorkBoardTone;
  createdAt: string;
  x?: number;
  y?: number;
}

export interface WorkBoardConnection {
  id: string;
  fromPinId: string;
  toPinId: string;
  relation: WorkBoardRelation;
  note?: string;
  createdAt: string;
}

export interface WorkBoardState {
  pins: WorkBoardPin[];
  connections: WorkBoardConnection[];
}

export const WORK_BOARD_UPDATED_EVENT = 'docket_workboard_updated';
export const DOCKET_PIN_DRAG_MIME = 'application/x-docket-pin';

function getStorageKey(caseSlug: string): string {
  return `docket_workboard_${caseSlug}`;
}

export function getDefaultPinPosition(index: number): { x: number; y: number } {
  const col = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: 24 + col * 215,
    y: 26 + row * 145,
  };
}

export function loadWorkBoard(caseSlug: string): WorkBoardState {
  try {
    const raw = localStorage.getItem(getStorageKey(caseSlug));
    if (!raw) return { pins: [], connections: [] };
    const parsed = JSON.parse(raw);
    const rawPins: WorkBoardPin[] = Array.isArray(parsed.pins) ? parsed.pins : [];
    const pins = rawPins.map((pin, idx) => {
      if (typeof pin.x === 'number' && typeof pin.y === 'number') {
        return pin;
      }
      const pos = getDefaultPinPosition(idx);
      return { ...pin, x: pos.x, y: pos.y };
    });
    return {
      pins,
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
    };
  } catch {
    return { pins: [], connections: [] };
  }
}

export function saveWorkBoard(caseSlug: string, state: WorkBoardState): void {
  try {
    localStorage.setItem(getStorageKey(caseSlug), JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(WORK_BOARD_UPDATED_EVENT, { detail: { caseSlug } }));
  } catch (err) {
    console.warn('Failed to save work board:', err);
  }
}

export function addWorkBoardPin(
  caseSlug: string,
  input: Omit<WorkBoardPin, 'id' | 'caseSlug' | 'createdAt'>
): WorkBoardPin {
  const cleanText = input.text.trim();
  const current = loadWorkBoard(caseSlug);

  // Deduplicate exact same text if already pinned
  const duplicate = current.pins.find(
    (p) => p.text.toLowerCase() === cleanText.toLowerCase()
  );
  if (duplicate) return duplicate;

  const fallbackPos = getDefaultPinPosition(current.pins.length);
  const pin: WorkBoardPin = {
    ...input,
    text: cleanText,
    x: typeof input.x === 'number' ? input.x : fallbackPos.x,
    y: typeof input.y === 'number' ? input.y : fallbackPos.y,
    id: `wb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    caseSlug,
    createdAt: new Date().toISOString(),
  };
  saveWorkBoard(caseSlug, {
    pins: [pin, ...current.pins],
    connections: current.connections,
  });
  recordLedgerEvent(caseSlug, {
    caseNumber: input.caseNumber,
    category: 'pin',
    action: 'Pinned to Work Board',
    subject: input.sourceLabel,
    detail: cleanText.slice(0, 140),
    dedupeKey: `wb-pin-${cleanText.slice(0, 48).toLowerCase()}`,
  });
  return pin;
}

export function removeWorkBoardPin(caseSlug: string, pinId: string): WorkBoardState {
  const current = loadWorkBoard(caseSlug);
  const next: WorkBoardState = {
    pins: current.pins.filter((p) => p.id !== pinId),
    connections: current.connections.filter(
      (c) => c.fromPinId !== pinId && c.toPinId !== pinId
    ),
  };
  saveWorkBoard(caseSlug, next);
  return next;
}

export function updateWorkBoardPinTone(
  caseSlug: string,
  pinId: string,
  tone: WorkBoardTone
): WorkBoardState {
  const current = loadWorkBoard(caseSlug);
  const next: WorkBoardState = {
    ...current,
    pins: current.pins.map((p) => (p.id === pinId ? { ...p, tone } : p)),
  };
  saveWorkBoard(caseSlug, next);
  return next;
}

export function updateWorkBoardPinPosition(
  caseSlug: string,
  pinId: string,
  x: number,
  y: number
): WorkBoardState {
  const current = loadWorkBoard(caseSlug);
  const clampedX = Math.max(12, Math.round(x));
  const clampedY = Math.max(16, Math.round(y));
  const next: WorkBoardState = {
    ...current,
    pins: current.pins.map((p) =>
      p.id === pinId ? { ...p, x: clampedX, y: clampedY } : p
    ),
  };
  saveWorkBoard(caseSlug, next);
  return next;
}

export function autoArrangeWorkBoardPins(
  caseSlug: string,
  canvasWidth = 560
): WorkBoardState {
  const current = loadWorkBoard(caseSlug);
  const n = current.pins.length;
  if (n === 0) return current;

  const cols = canvasWidth >= 680 ? 3 : 2;
  const colSpacing = cols === 3 ? 220 : 210;
  const rowSpacing = 148;

  const arranged = current.pins.map((pin, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return {
      ...pin,
      x: 24 + col * colSpacing,
      y: 26 + row * rowSpacing,
    };
  });

  const next: WorkBoardState = {
    ...current,
    pins: arranged,
  };
  saveWorkBoard(caseSlug, next);
  return next;
}

export function connectWorkBoardPins(
  caseSlug: string,
  fromPinId: string,
  toPinId: string,
  relation: WorkBoardRelation,
  note?: string
): WorkBoardState {
  if (fromPinId === toPinId) return loadWorkBoard(caseSlug);
  const current = loadWorkBoard(caseSlug);

  const filtered = current.connections.filter(
    (c) =>
      !(
        (c.fromPinId === fromPinId && c.toPinId === toPinId) ||
        (c.fromPinId === toPinId && c.toPinId === fromPinId)
      )
  );

  const conn: WorkBoardConnection = {
    id: `wbc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fromPinId,
    toPinId,
    relation,
    note: note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  const next: WorkBoardState = {
    pins: current.pins,
    connections: [conn, ...filtered],
  };
  saveWorkBoard(caseSlug, next);

  const fromPin = current.pins.find((p) => p.id === fromPinId);
  const toPin = current.pins.find((p) => p.id === toPinId);
  const caseNumber = fromPin?.caseNumber || toPin?.caseNumber || '';
  recordLedgerEvent(caseSlug, {
    caseNumber,
    category: 'connection',
    action: 'Connected Evidence',
    subject: `${fromPin?.sourceLabel || 'Fragment'} ↔ ${toPin?.sourceLabel || 'Fragment'}`,
    detail: `${relation.toUpperCase()} · "${(fromPin?.text || '').slice(0, 45)}" ↔ "${(toPin?.text || '').slice(0, 45)}"`,
    dedupeKey: `wb-conn-${fromPinId}-${toPinId}-${relation}`,
  });

  return next;
}

export function updateWorkBoardConnectionRelation(
  caseSlug: string,
  connectionId: string,
  relation: WorkBoardRelation
): WorkBoardState {
  const current = loadWorkBoard(caseSlug);
  const targetConn = current.connections.find((c) => c.id === connectionId);
  const next: WorkBoardState = {
    ...current,
    connections: current.connections.map((c) =>
      c.id === connectionId ? { ...c, relation } : c
    ),
  };
  saveWorkBoard(caseSlug, next);

  if (targetConn) {
    const fromPin = current.pins.find((p) => p.id === targetConn.fromPinId);
    const toPin = current.pins.find((p) => p.id === targetConn.toPinId);
    recordLedgerEvent(caseSlug, {
      caseNumber: fromPin?.caseNumber || toPin?.caseNumber || '',
      category: 'connection',
      action: 'Updated Link Relation',
      subject: `${fromPin?.sourceLabel || 'Fragment'} ↔ ${toPin?.sourceLabel || 'Fragment'}`,
      detail: `Reclassified string as ${relation.toUpperCase()}`,
      dedupeKey: `wb-rel-${connectionId}-${relation}`,
    });
  }

  return next;
}

export function removeWorkBoardConnection(
  caseSlug: string,
  connectionId: string
): WorkBoardState {
  const current = loadWorkBoard(caseSlug);
  const next: WorkBoardState = {
    pins: current.pins,
    connections: current.connections.filter((c) => c.id !== connectionId),
  };
  saveWorkBoard(caseSlug, next);
  return next;
}

export function clearWorkBoard(caseSlug: string): void {
  saveWorkBoard(caseSlug, { pins: [], connections: [] });
}

export function syncWorkBoardToEvidenceBoard(
  caseSlug: string,
  caseNumber: string
): number {
  const wb = loadWorkBoard(caseSlug);
  if (wb.pins.length === 0) return 0;

  try {
    const boardKey = `board_${caseSlug}`;
    const raw = localStorage.getItem(boardKey);
    const parsed = raw ? JSON.parse(raw) : { items: [], connections: [] };
    const existingItems: any[] = Array.isArray(parsed.items) ? parsed.items : [];
    const existingConns: any[] = Array.isArray(parsed.connections) ? parsed.connections : [];

    const existingIds = new Set(existingItems.map((it) => it.id));
    let addedCount = 0;

    const newItems = [...existingItems];
    wb.pins.forEach((pin, idx) => {
      const boardId = `wb-sync-${pin.id}`;
      if (!existingIds.has(boardId)) {
        addedCount++;
        newItems.unshift({
          id: boardId,
          title: `WORK BOARD: ${pin.sourceLabel}`,
          itemType: pin.kind === 'evidence' ? 'forensic' : 'document',
          status:
            pin.tone === 'red'
              ? 'Documented Allegation'
              : pin.tone === 'cyan'
              ? 'Forensic Theory'
              : 'Established Fact',
          x: typeof pin.x === 'number' ? Math.max(40, Math.round(pin.x * 1.2)) : 60 + ((existingItems.length + idx) % 3) * 265,
          y: typeof pin.y === 'number' ? Math.max(40, Math.round(pin.y * 1.35)) : 50 + Math.floor((existingItems.length + idx) / 3) * 210,
          snippet: pin.text,
          source: `Work Board Pin (${pin.kind}) · ${pin.sourceLabel}`,
          date: pin.createdAt.split('T')[0],
          caseSlug,
          caseNumber,
          tags: ['Work Board', pin.kind],
        });
      }
    });

    const newConns = [...existingConns];
    wb.connections.forEach((conn) => {
      const fromId = `wb-sync-${conn.fromPinId}`;
      const toId = `wb-sync-${conn.toPinId}`;
      const already = newConns.some(
        (c) =>
          (c.fromId === fromId && c.toId === toId) ||
          (c.fromId === toId && c.toId === fromId)
      );
      if (!already) {
        newConns.push({
          fromId,
          toId,
          label: conn.relation === 'contradicts' ? 'contradicts' : conn.relation === 'supports' ? 'supports' : 'related to',
          type:
            conn.relation === 'contradicts'
              ? 'contradiction'
              : conn.relation === 'timeline'
              ? 'timeline_sequence'
              : 'forensic_link',
        });
      }
    });

    localStorage.setItem(
      boardKey,
      JSON.stringify({ ...parsed, items: newItems, connections: newConns })
    );
    if (addedCount > 0) {
      recordLedgerEvent(caseSlug, {
        caseNumber,
        category: 'milestone',
        action: 'Synced Work Board',
        subject: `${addedCount} fragment(s) pushed to Evidence Board`,
        dedupeKey: `wb-sync-${addedCount}-${newConns.length}`,
      });
    }
    return addedCount;
  } catch {
    return 0;
  }
}
