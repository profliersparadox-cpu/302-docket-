import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  FileText,
  Highlighter,
  GitMerge,
  Pin,
  CheckCircle2,
  Download,
  Trash2,
  X,
  Search,
  Activity,
} from 'lucide-react';
import {
  LedgerEntry,
  LedgerEventCategory,
  INVESTIGATIVE_LEDGER_UPDATED_EVENT,
  loadInvestigativeLedger,
  clearInvestigativeLedger,
  formatLedgerExportText,
} from '../../utils/investigativeLedger.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface InvestigativeLedgerSidebarProps {
  caseSlug: string;
  caseNumber: string;
  caseTitle: string;
  isOpen: boolean;
  chaptersReadCount: number;
  auditsVerifiedCount: number;
  onClose: () => void;
}

type LedgerFilter = 'all' | LedgerEventCategory;

const CATEGORY_META: Record<
  LedgerEventCategory,
  { label: string; short: string; badgeClass: string; icon: React.FC<{ className?: string }> }
> = {
  document_view: {
    label: 'DOCUMENT VIEW',
    short: 'VIEWED',
    badgeClass: 'bg-blue-950/70 border-blue-700 text-blue-300',
    icon: FileText,
  },
  highlight: {
    label: 'HIGHLIGHTED PHRASE',
    short: 'HIGHLIGHT',
    badgeClass: 'bg-amber-950/70 border-amber-600 text-amber-300',
    icon: Highlighter,
  },
  connection: {
    label: 'CONNECTED EVIDENCE',
    short: 'LINKED',
    badgeClass: 'bg-red-950/70 border-red-600 text-red-300',
    icon: GitMerge,
  },
  pin: {
    label: 'PINNED / ANNOTATED',
    short: 'PINNED',
    badgeClass: 'bg-emerald-950/70 border-emerald-700 text-emerald-300',
    icon: Pin,
  },
  milestone: {
    label: 'AUDIT / MILESTONE',
    short: 'MILESTONE',
    badgeClass: 'bg-indigo-950/70 border-indigo-600 text-indigo-300',
    icon: CheckCircle2,
  },
};

export const InvestigativeLedgerSidebar: React.FC<InvestigativeLedgerSidebarProps> = ({
  caseSlug,
  caseNumber,
  caseTitle,
  isOpen,
  chaptersReadCount,
  auditsVerifiedCount,
  onClose,
}) => {
  const [entries, setEntries] = useState<LedgerEntry[]>(() =>
    loadInvestigativeLedger(caseSlug)
  );
  const [filter, setFilter] = useState<LedgerFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setEntries(loadInvestigativeLedger(caseSlug));
    setConfirmClear(false);

    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.caseSlug === caseSlug) {
        setEntries(loadInvestigativeLedger(caseSlug));
      }
    };
    window.addEventListener(INVESTIGATIVE_LEDGER_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(INVESTIGATIVE_LEDGER_UPDATED_EVENT, onUpdate);
  }, [caseSlug]);

  const stats = useMemo(() => {
    const docViewSubjects = new Set<string>();
    let highlightCount = 0;
    let connectionCount = 0;
    let pinCount = 0;
    let milestoneCount = 0;

    entries.forEach((entry) => {
      if (entry.category === 'document_view') {
        docViewSubjects.add(entry.subject.toLowerCase());
      } else if (entry.category === 'highlight') {
        highlightCount++;
      } else if (entry.category === 'connection') {
        connectionCount++;
      } else if (entry.category === 'pin') {
        pinCount++;
      } else if (entry.category === 'milestone') {
        milestoneCount++;
      }
    });

    // Weighted case investigation progress heuristic (max 100%)
    const chapterPts = Math.min(35, Math.round((chaptersReadCount / 9) * 35));
    const auditPts = Math.min(25, Math.round((auditsVerifiedCount / 9) * 25));
    const docPts = Math.min(15, docViewSubjects.size * 3);
    const highlightPts = Math.min(10, highlightCount * 3);
    const linkPts = Math.min(15, connectionCount * 5 + pinCount * 2);
    const progressPct = Math.min(100, chapterPts + auditPts + docPts + highlightPts + linkPts);

    return {
      uniqueDocs: docViewSubjects.size,
      highlightCount,
      connectionCount,
      pinAndAuditCount: pinCount + milestoneCount,
      progressPct,
    };
  }, [entries, chaptersReadCount, auditsVerifiedCount]);

  const filteredEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filter !== 'all' && entry.category !== filter) return false;
      if (!q) return true;
      return (
        entry.action.toLowerCase().includes(q) ||
        entry.subject.toLowerCase().includes(q) ||
        (entry.detail && entry.detail.toLowerCase().includes(q))
      );
    });
  }, [entries, filter, searchTerm]);

  if (!isOpen) return null;

  const handleExportLog = () => {
    soundEngine.playBootBeep();
    const content = formatLedgerExportText(caseSlug, caseTitle, caseNumber);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${caseSlug}_investigative_ledger.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const time = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${date} · ${time}`;
  };

  return (
    <aside
      aria-label="Investigative Ledger Sidebar"
      className="retro-window bg-[#090d14] border-2 border-blue-700/70 rounded flex flex-col font-mono text-xs shadow-2xl"
    >
      {/* Header */}
      <div className="bg-[#111724] border-b border-zinc-800 px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <ClipboardList className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <div className="font-pixel text-[10px] text-blue-300 uppercase font-bold truncate">
              INVESTIGATIVE LEDGER ({entries.length})
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              PERSISTENT CASE AUDIT TRAIL &bull; {caseNumber}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            disabled={entries.length === 0}
            onClick={handleExportLog}
            className="p-1 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-emerald-300 hover:border-emerald-500 disabled:opacity-35"
            title="Export Investigative Ledger (.txt)"
            aria-label="Export Investigative Ledger"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={entries.length === 0}
            onClick={() => {
              soundEngine.playKeyClick();
              setConfirmClear((v) => !v);
            }}
            className="p-1 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-red-400 hover:border-red-500 disabled:opacity-35"
            title="Clear ledger entries"
            aria-label="Clear Investigative Ledger"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              onClose();
            }}
            className="p-1 text-zinc-400 hover:text-zinc-100"
            aria-label="Close Investigative Ledger"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Clear Confirmation */}
      {confirmClear && (
        <div className="px-3 py-2 bg-red-950/70 border-b border-red-700 flex items-center justify-between text-[10px]">
          <span className="text-red-200 font-bold">PURGE CASE LEDGER LOG?</span>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyClick();
                clearInvestigativeLedger(caseSlug);
                setConfirmClear(false);
              }}
              className="px-2 py-0.5 rounded bg-red-600 text-white font-bold"
            >
              PURGE
            </button>
          </div>
        </div>
      )}

      {/* Progress & Metrics Overview */}
      <div className="p-3 bg-[#070a0f] border-b border-zinc-800/80 space-y-2.5">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-400 flex items-center space-x-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>INVESTIGATION DEPTH</span>
            </span>
            <span className="text-emerald-300 font-bold">{stats.progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-black border border-zinc-800 rounded-sm overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${stats.progressPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
          <div className="bg-black/60 border border-zinc-800 rounded p-1.5">
            <div className="text-blue-300 font-bold text-xs">{stats.uniqueDocs}</div>
            <div className="text-[9px] text-zinc-500">DOCS</div>
          </div>
          <div className="bg-black/60 border border-zinc-800 rounded p-1.5">
            <div className="text-amber-300 font-bold text-xs">{stats.highlightCount}</div>
            <div className="text-[9px] text-zinc-500">PHRASES</div>
          </div>
          <div className="bg-black/60 border border-zinc-800 rounded p-1.5">
            <div className="text-red-300 font-bold text-xs">{stats.connectionCount}</div>
            <div className="text-[9px] text-zinc-500">LINKS</div>
          </div>
          <div className="bg-black/60 border border-zinc-800 rounded p-1.5">
            <div className="text-emerald-300 font-bold text-xs">{stats.pinAndAuditCount}</div>
            <div className="text-[9px] text-zinc-500">PINS/AUD</div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-1">
          {(
            [
              { id: 'all', label: 'ALL' },
              { id: 'document_view', label: 'DOCS' },
              { id: 'highlight', label: 'PHRASES' },
              { id: 'connection', label: 'LINKS' },
              { id: 'pin', label: 'PINS' },
              { id: 'milestone', label: 'AUDITS' },
            ] as { id: LedgerFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEngine.playKeyClick();
                setFilter(tab.id);
              }}
              className={`px-2 py-0.5 rounded border text-[9px] font-bold transition-colors ${
                filter === tab.id
                  ? 'bg-blue-950 border-blue-500 text-blue-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter ledger entries..."
            className="w-full bg-black border border-zinc-800 pl-7 pr-6 py-1 rounded text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
              aria-label="Clear ledger filter"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Persistent Chronological Log Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[420px]">
        {filteredEntries.length === 0 ? (
          <div className="p-5 text-center text-zinc-500 border border-dashed border-zinc-800 rounded text-[11px] space-y-1">
            <ClipboardList className="w-5 h-5 mx-auto opacity-40 text-blue-400" />
            <p>
              {entries.length === 0
                ? 'No investigative activities logged yet. Open dossier chapters, highlight phrases, or connect fragments to build your case ledger.'
                : 'No ledger entries match your current filter.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const meta = CATEGORY_META[entry.category] || CATEGORY_META.document_view;
            const Icon = meta.icon;
            return (
              <div
                key={entry.id}
                className="p-2.5 rounded bg-[#0c1119] border border-zinc-800/90 hover:border-zinc-700 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded border text-[9px] font-bold ${meta.badgeClass}`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    <span>{meta.short}</span>
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>

                <div className="text-[11px] text-zinc-100 font-bold leading-snug">
                  <span className="text-zinc-400 font-normal">{entry.action}: </span>
                  <span className="text-amber-200">{entry.subject}</span>
                </div>

                {entry.detail && (
                  <p className="text-[10px] text-zinc-400 font-tech leading-relaxed line-clamp-2 border-l-2 border-zinc-700 pl-2">
                    {entry.detail}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
