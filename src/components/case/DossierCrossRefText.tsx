import React from 'react';
import { CaseFile, EvidenceItem, PersonOfInterest } from '../../types.ts';
import { LEGAL_DOCTRINE_GLOSSARY, LegalDoctrineRef } from '../../data/legalDilemmasData.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

export type CrossRefHit =
  | { kind: 'evidence'; item: EvidenceItem }
  | { kind: 'poi'; item: PersonOfInterest }
  | { kind: 'doctrine'; item: LegalDoctrineRef };

interface DossierCrossRefTextProps {
  text: string;
  caseData: CaseFile;
  onInspectRef: (hit: CrossRefHit) => void;
  className?: string;
}

interface TokenPattern {
  label: string;
  hit: CrossRefHit;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const DossierCrossRefText: React.FC<DossierCrossRefTextProps> = ({
  text,
  caseData,
  onInspectRef,
  className = '',
}) => {
  if (!text) return null;

  const patterns: TokenPattern[] = [];

  // 1. Evidence exhibit numbers & distinctive keywords
  (caseData.evidence || []).forEach((ev) => {
    if (ev.exhibitNumber && ev.exhibitNumber.length >= 3) {
      patterns.push({ label: ev.exhibitNumber, hit: { kind: 'evidence', item: ev } });
    }
    const lowerTitle = ev.title.toLowerCase();
    const keywords = [
      'ransom note',
      'diamond knot',
      'ligature',
      'waterproof journal',
      'ladder',
      'tire',
      'flight log',
      'non-prosecution agreement',
    ];
    keywords.forEach((kw) => {
      if (lowerTitle.includes(kw)) {
        patterns.push({ label: kw, hit: { kind: 'evidence', item: ev } });
      }
    });
  });

  // 2. Persons of Interest / Witnesses (use full names >= 5 chars)
  (caseData.personsOfInterest || []).forEach((poi) => {
    const cleanName = poi.name.replace(/\(.*?\)/g, '').trim();
    if (cleanName.length >= 5) {
      patterns.push({ label: cleanName, hit: { kind: 'poi', item: poi } });
    }
  });

  // 3. Legal Doctrines & Statutes
  LEGAL_DOCTRINE_GLOSSARY.forEach((doc) => {
    patterns.push({ label: doc.term, hit: { kind: 'doctrine', item: doc } });
  });

  // Sort longest match first to prevent partial shadowing
  const uniqueMap = new Map<string, TokenPattern>();
  patterns
    .sort((a, b) => b.label.length - a.label.length)
    .forEach((p) => {
      const key = p.label.toLowerCase();
      if (!uniqueMap.has(key)) uniqueMap.set(key, p);
    });

  const sortedPatterns = Array.from(uniqueMap.values());
  if (sortedPatterns.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(
    `(${sortedPatterns.map((p) => escapeRegExp(p.label)).join('|')})`,
    'gi'
  );

  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        const matched = uniqueMap.get(part.toLowerCase());
        if (!matched) return <React.Fragment key={idx}>{part}</React.Fragment>;

        const badgeColor =
          matched.hit.kind === 'evidence'
            ? 'border-emerald-600/80 text-emerald-300 hover:bg-emerald-950/60'
            : matched.hit.kind === 'poi'
            ? 'border-red-600/80 text-red-300 hover:bg-red-950/60'
            : 'border-amber-600/80 text-amber-300 hover:bg-amber-950/60';

        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              soundEngine.playCrossRefLink();
              onInspectRef(matched.hit);
            }}
            title={`Cross-reference: ${
              matched.hit.kind === 'evidence'
                ? 'Admitted Exhibit'
                : matched.hit.kind === 'poi'
                ? 'Subject / Witness File'
                : 'Legal Doctrine'
            }`}
            className={`inline border-b border-dotted px-0.5 transition-colors cursor-pointer font-semibold ${badgeColor}`}
          >
            {part}
          </button>
        );
      })}
    </span>
  );
};
