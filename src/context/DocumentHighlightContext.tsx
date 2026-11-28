import React, { createContext, useContext } from 'react';

export type HighlightTone = 'amber' | 'emerald' | 'red' | 'cyan';

export interface PinnedHighlightTerm {
  id: string;
  term: string;
  tone: HighlightTone;
}

export interface DocumentHighlightConfig {
  query: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  pinnedTerms: PinnedHighlightTerm[];
}

const DEFAULT_CONFIG: DocumentHighlightConfig = {
  query: '',
  caseSensitive: false,
  wholeWord: false,
  pinnedTerms: [],
};

const DocumentHighlightContext = createContext<DocumentHighlightConfig>(DEFAULT_CONFIG);

export const DocumentHighlightProvider: React.FC<{
  value: DocumentHighlightConfig;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <DocumentHighlightContext.Provider value={value}>
    {children}
  </DocumentHighlightContext.Provider>
);

export function useDocumentHighlight(): DocumentHighlightConfig {
  return useContext(DocumentHighlightContext);
}

export function escapeHighlightRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wrapBoundary(escaped: string, rawTerm: string, wholeWord: boolean): string {
  if (!wholeWord) return escaped;
  const startsWord = /^\w/.test(rawTerm);
  const endsWord = /\w$/.test(rawTerm);
  return `${startsWord ? '\\b' : ''}${escaped}${endsWord ? '\\b' : ''}`;
}

export function buildSearchRegex(
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean
): RegExp | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const pattern = wrapBoundary(escapeHighlightRegExp(trimmed), trimmed, wholeWord);
  return new RegExp(`(${pattern})`, caseSensitive ? 'g' : 'gi');
}

export function countTermOccurrences(
  text: string | undefined | null,
  query: string,
  caseSensitive = false,
  wholeWord = false
): number {
  if (!text) return 0;
  const regex = buildSearchRegex(query, caseSensitive, wholeWord);
  if (!regex) return 0;
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

const PIN_TONE_CLASSES: Record<HighlightTone, string> = {
  amber: 'bg-amber-400/30 border-b border-amber-400 text-amber-100 rounded-[2px] px-0.5',
  emerald: 'bg-emerald-400/25 border-b border-emerald-400 text-emerald-100 rounded-[2px] px-0.5',
  red: 'bg-red-500/30 border-b border-red-400 text-red-100 rounded-[2px] px-0.5',
  cyan: 'bg-cyan-400/25 border-b border-cyan-400 text-cyan-100 rounded-[2px] px-0.5',
};

export function renderHighlightedText(
  text: string,
  config: DocumentHighlightConfig
): React.ReactNode {
  if (!text) return text;
  const trimmedQuery = config.query.trim();
  const validPinned = config.pinnedTerms.filter((p) => p.term.trim().length > 0);

  if (!trimmedQuery && validPinned.length === 0) {
    return text;
  }

  // Build combined alternation sorted longest-first
  interface Rule {
    term: string;
    isSearch: boolean;
    tone?: HighlightTone;
    pattern: string;
  }

  const rules: Rule[] = [];
  if (trimmedQuery) {
    rules.push({
      term: trimmedQuery,
      isSearch: true,
      pattern: wrapBoundary(
        escapeHighlightRegExp(trimmedQuery),
        trimmedQuery,
        config.wholeWord
      ),
    });
  }

  validPinned.forEach((p) => {
    const clean = p.term.trim();
    rules.push({
      term: clean,
      isSearch: false,
      tone: p.tone,
      pattern: wrapBoundary(escapeHighlightRegExp(clean), clean, false),
    });
  });

  // Sort longest term first; search query wins ties
  rules.sort((a, b) => {
    if (b.term.length !== a.term.length) return b.term.length - a.term.length;
    return a.isSearch === b.isSearch ? 0 : a.isSearch ? -1 : 1;
  });

  const combinedRegex = new RegExp(
    `(${rules.map((r) => r.pattern).join('|')})`,
    config.caseSensitive ? 'g' : 'gi'
  );

  const parts = text.split(combinedRegex);
  if (parts.length <= 1) return text;

  const isExactMatch = (part: string, rule: Rule): boolean => {
    if (config.caseSensitive && rule.isSearch) {
      return part === rule.term;
    }
    return part.toLowerCase() === rule.term.toLowerCase();
  };

  return parts.map((part, idx) => {
    if (!part) return null;
    const matchedRule = rules.find((r) => isExactMatch(part, r));
    if (!matchedRule) {
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    }

    const handleMarkDragStart = (
      e: React.DragEvent<HTMLElement>,
      textFragment: string,
      tone: HighlightTone
    ) => {
      const selectionText = window.getSelection()?.toString().trim();
      const payloadText = selectionText && selectionText.length > 0 ? selectionText : textFragment;
      e.dataTransfer.setData('text/plain', payloadText);
      e.dataTransfer.setData(
        'application/x-docket-pin',
        JSON.stringify({
          text: payloadText,
          sourceLabel: matchedRule.isSearch ? `Search Match ("${trimmedQuery}")` : `Highlighted Term ("${matchedRule.term}")`,
          kind: 'highlight',
          tone,
        })
      );
      e.dataTransfer.effectAllowed = 'copy';
    };

    if (matchedRule.isSearch) {
      return (
        <mark
          key={idx}
          data-search-match="true"
          draggable
          onDragStart={(e) => handleMarkDragStart(e, part, 'amber')}
          title="Drag this highlighted fragment to the Work Board"
          className="doc-search-match cursor-grab active:cursor-grabbing"
        >
          {part}
        </mark>
      );
    }

    return (
      <mark
        key={idx}
        data-pinned-highlight={matchedRule.tone || 'amber'}
        draggable
        onDragStart={(e) => handleMarkDragStart(e, part, matchedRule.tone || 'amber')}
        title="Drag this highlighted fragment to the Work Board"
        className={`${PIN_TONE_CLASSES[matchedRule.tone || 'amber']} cursor-grab active:cursor-grabbing`}
      >
        {part}
      </mark>
    );
  });
}

export const HighlightText: React.FC<{
  text?: string | null;
  className?: string;
}> = ({ text, className }) => {
  const config = useDocumentHighlight();
  if (!text) return null;
  const content = renderHighlightedText(text, config);
  if (className) {
    return <span className={className}>{content}</span>;
  }
  return <>{content}</>;
};
