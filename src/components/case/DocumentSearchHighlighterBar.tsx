import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Highlighter,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
} from 'lucide-react';
import {
  DocumentHighlightConfig,
  HighlightTone,
  PinnedHighlightTerm,
} from '../../context/DocumentHighlightContext.tsx';
import { soundEngine } from '../../utils/soundEngine.ts';
import { DOCKET_PIN_DRAG_MIME } from '../../utils/workBoard.ts';
import { recordLedgerEvent } from '../../utils/investigativeLedger.ts';

export interface ChapterMatchSummary {
  chapterIndex: number;
  shortLabel: string;
  count: number;
}

interface DocumentSearchHighlighterBarProps {
  config: DocumentHighlightConfig;
  onChange: (next: DocumentHighlightConfig) => void;
  containerRef: React.RefObject<HTMLElement | null>;
  caseSlug?: string;
  caseNumber?: string;
  syncKey?: string | number;
  placeholder?: string;
  chapterHits?: ChapterMatchSummary[];
  activeChapter?: number;
  onSelectChapter?: (index: number) => void;
  onClose?: () => void;
}

const TONE_META: Record<
  HighlightTone,
  { dot: string; chip: string; label: string }
> = {
  amber: {
    dot: 'bg-amber-400 border-amber-200',
    chip: 'bg-amber-950/75 border-amber-500/80 text-amber-200',
    label: 'Amber Marker',
  },
  emerald: {
    dot: 'bg-emerald-400 border-emerald-200',
    chip: 'bg-emerald-950/75 border-emerald-500/80 text-emerald-200',
    label: 'Forensic Green',
  },
  red: {
    dot: 'bg-red-500 border-red-200',
    chip: 'bg-red-950/75 border-red-500/80 text-red-200',
    label: 'Flagged Red',
  },
  cyan: {
    dot: 'bg-cyan-400 border-cyan-200',
    chip: 'bg-cyan-950/75 border-cyan-500/80 text-cyan-200',
    label: 'Cyan Citation',
  },
};

export const DocumentSearchHighlighterBar: React.FC<DocumentSearchHighlighterBarProps> = ({
  config,
  onChange,
  containerRef,
  caseSlug,
  caseNumber = '',
  syncKey,
  placeholder = 'Search & highlight terms in evidentiary document...',
  chapterHits,
  activeChapter,
  onSelectChapter,
  onClose,
}) => {
  const [totalMatches, setTotalMatches] = useState(0);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [pinTone, setPinTone] = useState<HighlightTone>('amber');

  const syncMatchElements = useCallback(
    (targetIdx: number, shouldScroll: boolean) => {
      const root = containerRef.current;
      if (!root) {
        setTotalMatches(0);
        return;
      }

      const marks = Array.from(
        root.querySelectorAll<HTMLElement>('mark[data-search-match="true"]')
      );
      marks.forEach((el) => el.classList.remove('doc-search-match-active'));

      setTotalMatches(marks.length);
      if (marks.length === 0) {
        setActiveMatchIndex(0);
        return;
      }

      const clamped = ((targetIdx % marks.length) + marks.length) % marks.length;
      setActiveMatchIndex(clamped);
      const activeEl = marks[clamped];
      if (activeEl) {
        activeEl.classList.add('doc-search-match-active');
        if (shouldScroll) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [containerRef]
  );

  // Re-count matches whenever query, options, or viewed document/chapter changes
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (!config.query.trim()) {
        syncMatchElements(0, false);
      } else {
        syncMatchElements(0, false);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [config.query, config.caseSensitive, config.wholeWord, syncKey, syncMatchElements]);

  const handleStepMatch = (delta: number) => {
    if (totalMatches === 0) return;
    soundEngine.playKeyClick();
    const nextIdx = (activeMatchIndex + delta + totalMatches) % totalMatches;
    syncMatchElements(nextIdx, true);
    const trimmed = config.query.trim();
    if (caseSlug && trimmed.length >= 2) {
      recordLedgerEvent(caseSlug, {
        caseNumber,
        category: 'highlight',
        action: 'Highlighted Term',
        subject: `"${trimmed}"`,
        detail: `${totalMatches} matching occurrence(s) located`,
        dedupeKey: `hl-search-${trimmed.toLowerCase()}`,
      });
    }
  };

  const handlePinCurrentTerm = () => {
    const trimmed = config.query.trim();
    if (!trimmed) return;
    soundEngine.playBootBeep();

    if (caseSlug) {
      recordLedgerEvent(caseSlug, {
        caseNumber,
        category: 'highlight',
        action: 'Pinned Highlight Phrase',
        subject: `"${trimmed}"`,
        detail: `Marker tone: ${pinTone.toUpperCase()}`,
        dedupeKey: `hl-pin-${trimmed.toLowerCase()}-${pinTone}`,
      });
    }

    const exists = config.pinnedTerms.some(
      (p) => p.term.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      onChange({
        ...config,
        pinnedTerms: config.pinnedTerms.map((p) =>
          p.term.toLowerCase() === trimmed.toLowerCase() ? { ...p, tone: pinTone } : p
        ),
      });
      return;
    }

    const newPin: PinnedHighlightTerm = {
      id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      term: trimmed,
      tone: pinTone,
    };
    onChange({
      ...config,
      pinnedTerms: [...config.pinnedTerms, newPin],
    });
  };

  const handleRemovePin = (id: string) => {
    soundEngine.playKeyClick();
    onChange({
      ...config,
      pinnedTerms: config.pinnedTerms.filter((p) => p.id !== id),
    });
  };

  const handleClearSearch = () => {
    soundEngine.playKeyClick();
    onChange({ ...config, query: '' });
  };

  const hasQuery = config.query.trim().length > 0;

  return (
    <div className="bg-[#0b1017] border border-amber-700/60 rounded p-2.5 sm:p-3 space-y-2 font-mono text-xs shadow-lg">
      {/* Main Search & Navigation Row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center space-x-1.5 text-amber-400 shrink-0">
          <Highlighter className="w-3.5 h-3.5" />
          <span className="font-pixel text-[10px] uppercase tracking-wider hidden sm:inline">
            TEXT HIGHLIGHTER
          </span>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={config.query}
            onChange={(e) => onChange({ ...config, query: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleStepMatch(e.shiftKey ? -1 : 1);
              } else if (e.key === 'Escape') {
                if (hasQuery) {
                  handleClearSearch();
                } else {
                  onClose?.();
                }
              }
            }}
            placeholder={placeholder}
            className="w-full bg-black/85 border border-zinc-700 pl-8 pr-7 py-1.5 rounded text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Match Counter & Next/Prev Navigation */}
        <div className="flex items-center space-x-1 bg-black/70 border border-zinc-800 rounded px-1.5 py-0.5">
          <span
            className={`text-[10px] px-1.5 font-bold ${
              !hasQuery
                ? 'text-zinc-500'
                : totalMatches > 0
                ? 'text-amber-300'
                : 'text-red-400'
            }`}
          >
            {!hasQuery
              ? '0 MATCHES'
              : totalMatches > 0
              ? `${activeMatchIndex + 1} / ${totalMatches}`
              : '0 HITS'}
          </span>
          <button
            type="button"
            disabled={totalMatches === 0}
            onClick={() => handleStepMatch(-1)}
            className="p-1 text-zinc-300 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={totalMatches === 0}
            onClick={() => handleStepMatch(1)}
            className="p-1 text-zinc-300 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next match (Enter)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Matching Options */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              onChange({ ...config, caseSensitive: !config.caseSensitive });
            }}
            className={`px-2 py-1 rounded border text-[10px] font-bold transition-colors ${
              config.caseSensitive
                ? 'bg-amber-950 border-amber-500 text-amber-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Match case (Aa)"
          >
            Aa
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              onChange({ ...config, wholeWord: !config.wholeWord });
            }}
            className={`px-2 py-1 rounded border text-[10px] font-bold transition-colors ${
              config.wholeWord
                ? 'bg-amber-950 border-amber-500 text-amber-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Match whole word only"
          >
            WORD
          </button>
        </div>

        {/* Pin Persistent Multi-Term Highlighter Controls */}
        <div className="flex items-center space-x-1.5 border-l border-zinc-800 pl-2">
          <div className="flex items-center space-x-1">
            {(['amber', 'emerald', 'red', 'cyan'] as HighlightTone[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPinTone(t)}
                title={TONE_META[t].label}
                className={`w-3.5 h-3.5 rounded-full border ${TONE_META[t].dot} ${
                  pinTone === t ? 'ring-1 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={!hasQuery}
            onClick={handlePinCurrentTerm}
            className="px-2 py-1 rounded border border-amber-600/80 bg-amber-950/50 hover:bg-amber-900/70 text-amber-200 text-[10px] font-bold flex items-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Pin this term as a persistent colored highlight"
          >
            <Plus className="w-3 h-3" />
            <span>PIN</span>
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-200"
            aria-label="Hide highlighter toolbar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Pinned Highlight Chips */}
      {config.pinnedTerms.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-800/80">
          <span className="text-[10px] text-zinc-500 uppercase">PINNED HIGHLIGHTS:</span>
          {config.pinnedTerms.map((pin) => (
            <span
              key={pin.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  DOCKET_PIN_DRAG_MIME,
                  JSON.stringify({
                    text: pin.term,
                    sourceLabel: 'Pinned Highlight Term',
                    kind: 'highlight',
                    tone: pin.tone,
                  })
                );
                e.dataTransfer.setData('text/plain', pin.term);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              title="Click to jump to matches or drag onto Work Board"
              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded border text-[10px] cursor-grab active:cursor-grabbing ${
                TONE_META[pin.tone]?.chip || TONE_META.amber.chip
              }`}
            >
              <button
                type="button"
                onClick={() => onChange({ ...config, query: pin.term })}
                className="hover:underline font-bold"
                title="Jump/search occurrences of this pinned term"
              >
                {pin.term}
              </button>
              <button
                type="button"
                onClick={() => handleRemovePin(pin.id)}
                className="opacity-75 hover:opacity-100"
                aria-label={`Remove highlight ${pin.term}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...config, pinnedTerms: [] })}
            className="text-[10px] text-zinc-500 hover:text-red-300 ml-1"
          >
            CLEAR ALL
          </button>
        </div>
      )}

      {/* Cross-Chapter Match Navigator (shown in 9-Chapter Dossier View when query has hits) */}
      {hasQuery && chapterHits && chapterHits.length > 0 && onSelectChapter && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-800/80 text-[10px]">
          <span className="text-zinc-500 uppercase">DOSSIER CHAPTER HITS:</span>
          {chapterHits.map((ch) => {
            const isCurrent = ch.chapterIndex === activeChapter;
            return (
              <button
                key={ch.chapterIndex}
                type="button"
                onClick={() => {
                  soundEngine.playKeyClick();
                  onSelectChapter(ch.chapterIndex);
                }}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  isCurrent
                    ? 'bg-amber-500 text-black border-amber-300 font-bold'
                    : ch.count > 0
                    ? 'bg-zinc-900 border-amber-700/70 text-amber-300 hover:bg-zinc-800'
                    : 'bg-zinc-950 border-zinc-800/70 text-zinc-600'
                }`}
              >
                {ch.shortLabel} ({ch.count})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
