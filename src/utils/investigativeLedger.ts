export type LedgerEventCategory =
  | 'document_view'
  | 'highlight'
  | 'connection'
  | 'pin'
  | 'milestone';

export interface LedgerEntry {
  id: string;
  caseSlug: string;
  caseNumber: string;
  category: LedgerEventCategory;
  action: string;
  subject: string;
  detail?: string;
  dedupeKey?: string;
  timestamp: string;
}

export const INVESTIGATIVE_LEDGER_UPDATED_EVENT = 'docket_investigative_ledger_updated';
const MAX_LEDGER_ENTRIES = 250;

function getStorageKey(caseSlug: string): string {
  return `docket_ledger_${caseSlug}`;
}

export function loadInvestigativeLedger(caseSlug: string): LedgerEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey(caseSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveInvestigativeLedger(caseSlug: string, entries: LedgerEntry[]): void {
  try {
    const trimmed = entries.slice(0, MAX_LEDGER_ENTRIES);
    localStorage.setItem(getStorageKey(caseSlug), JSON.stringify(trimmed));
    window.dispatchEvent(
      new CustomEvent(INVESTIGATIVE_LEDGER_UPDATED_EVENT, { detail: { caseSlug } })
    );
  } catch (err) {
    console.warn('Failed to persist investigative ledger:', err);
  }
}

export function recordLedgerEvent(
  caseSlug: string,
  input: Omit<LedgerEntry, 'id' | 'caseSlug' | 'timestamp'>
): LedgerEntry | null {
  if (!caseSlug) return null;

  const existing = loadInvestigativeLedger(caseSlug);
  const nowMs = Date.now();

  if (input.dedupeKey && existing.length > 0) {
    const latest = existing[0];
    if (latest.dedupeKey === input.dedupeKey) {
      return latest;
    }
    const recentDuplicate = existing.find(
      (entry) =>
        entry.dedupeKey === input.dedupeKey &&
        nowMs - new Date(entry.timestamp).getTime() < 20000
    );
    if (recentDuplicate) {
      return recentDuplicate;
    }
  }

  const entry: LedgerEntry = {
    ...input,
    id: `led-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
    caseSlug,
    timestamp: new Date(nowMs).toISOString(),
  };

  saveInvestigativeLedger(caseSlug, [entry, ...existing]);
  return entry;
}

export function clearInvestigativeLedger(caseSlug: string): void {
  saveInvestigativeLedger(caseSlug, []);
}

export function formatLedgerExportText(
  caseSlug: string,
  caseTitle: string,
  caseNumber: string
): string {
  const entries = loadInvestigativeLedger(caseSlug);
  const header = [
    `302 DOCKET // INVESTIGATIVE LEDGER LOG`,
    `CASE: ${caseNumber} — ${caseTitle}`,
    `EXPORTED: ${new Date().toLocaleString()}`,
    `TOTAL RECORDED ACTIVITIES: ${entries.length}`,
    `------------------------------------------------------------`,
  ];

  const lines = entries.map((e) => {
    const ts = new Date(e.timestamp).toLocaleString();
    const detail = e.detail ? ` | ${e.detail}` : '';
    return `[${ts}] [${e.category.toUpperCase()}] ${e.action}: ${e.subject}${detail}`;
  });

  return [...header, ...lines].join('\n');
}
