import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Pause,
  Play,
  FastForward,
  RotateCcw,
  Download,
  Scissors,
  Check,
  FileCode,
} from 'lucide-react';
import { CaseFile } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { loadStickyNotes } from '../../utils/stickyNotes.ts';

interface RetroPrintFeedModalProps {
  caseData: CaseFile;
  isOpen: boolean;
  onClose: () => void;
  documentOverride?: {
    title: string;
    classification: string;
    date: string;
    agency: string;
    body: string;
    citation: string;
  } | null;
}

type FeedSectionKey =
  | 'overview'
  | 'timeline'
  | 'evidence'
  | 'poi'
  | 'verdict'
  | 'citations'
  | 'notes';

interface FeedLine {
  id: string;
  text: string;
  kind: 'header' | 'rule' | 'subhead' | 'body' | 'meta' | 'perforation';
}

const SECTION_LABELS: { key: FeedSectionKey; label: string }[] = [
  { key: 'overview', label: '01 OVERVIEW' },
  { key: 'timeline', label: '02 TIMELINE' },
  { key: 'evidence', label: '03 EXHIBITS' },
  { key: 'poi', label: '04 SUBJECTS' },
  { key: 'verdict', label: '05 VERDICT' },
  { key: 'citations', label: '06 CITATIONS' },
  { key: 'notes', label: '07 STICKY NOTES' },
];

function wrapTextLines(raw: string, maxCols = 74, indent = ''): string[] {
  const safe = String(raw || '').trim();
  if (!safe) return [];
  const result: string[] = [];
  const paragraphs = safe.split(/\r?\n/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      result.push(' ');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = indent;
    const limit = Math.max(24, maxCols);

    for (const word of words) {
      if (current === indent) {
        current += word;
      } else if (current.length + 1 + word.length <= limit) {
        current += ' ' + word;
      } else {
        result.push(current);
        current = indent + word;
      }
    }
    if (current.trim().length > 0) {
      result.push(current);
    }
  }
  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const RetroPrintFeedModal: React.FC<RetroPrintFeedModalProps> = ({
  caseData,
  isOpen,
  onClose,
  documentOverride = null,
}) => {
  const [enabledSections, setEnabledSections] = useState<Record<FeedSectionKey, boolean>>({
    overview: true,
    timeline: true,
    evidence: true,
    poi: true,
    verdict: true,
    citations: true,
    notes: true,
  });

  const [printedCount, setPrintedCount] = useState<number>(0);
  const [isFeeding, setIsFeeding] = useState<boolean>(true);
  const [feedSpeedMs, setFeedSpeedMs] = useState<number>(36);
  const [tornNotice, setTornNotice] = useState<string | null>(null);
  const feedViewportRef = useRef<HTMLDivElement>(null);
  const autoFollowRef = useRef<boolean>(true);
  const spoolTimeRef = useRef<string>(
    new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  );

  // Refresh spool timestamp only when modal opens
  useEffect(() => {
    if (isOpen) {
      spoolTimeRef.current = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    }
  }, [isOpen]);

  // Attach body print-portal class whenever modal is open so Ctrl+P and button print cleanly
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-retro-print-portal');
    } else {
      document.body.classList.remove('has-retro-print-portal');
    }
    return () => {
      document.body.classList.remove('has-retro-print-portal');
    };
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const docKey = documentOverride
    ? `${documentOverride.title}|${documentOverride.date}|${documentOverride.body.length}`
    : 'case-dossier';

  const feedLines: FeedLine[] = useMemo(() => {
    const lines: FeedLine[] = [];
    const push = (kind: FeedLine['kind'], text: string) => {
      lines.push({ id: `ln-${lines.length}`, kind, text });
    };
    const pushWrapped = (kind: FeedLine['kind'], text: string | undefined, indent = '') => {
      const wrapped = wrapTextLines(text || '', 74, indent);
      wrapped.forEach((w) => push(kind, w));
    };

    const timestamp = spoolTimeRef.current;

    push('meta', 'THE 302 DOCKET // CONTINUOUS FORM TRACTOR FEED [REV 1996.4]');
    push('meta', `SPOOL TIMESTAMP: ${timestamp}   PORT: LPT1://ARCHIVE-PRINTER`);
    push('rule', '========================================================================');

    if (documentOverride) {
      push('header', (documentOverride.title || 'CASE DOCUMENT').toUpperCase());
      push(
        'meta',
        `DOCKET: ${caseData.caseNumber}  |  CLASSIFICATION: ${documentOverride.classification || 'OFFICIAL RECORD'}`
      );
      push(
        'meta',
        `AGENCY: ${documentOverride.agency || 'ARCHIVE CLERK'}  |  DATE: ${documentOverride.date || 'UNDATED'}`
      );
      push('rule', '------------------------------------------------------------------------');
      pushWrapped('body', documentOverride.body || '[NO TEXT BODY ATTACHED]');
      push('perforation', '--- PERFORATION / TEAR LINE --------------------------------------------');
      push('meta', `PRIMARY CITATION: ${documentOverride.citation || caseData.caseNumber}`);
      push('rule', '========================================================================');
      push('meta', '*** END OF TRANSMISSION // CERTIFIED PUBLIC ARCHIVE COPY ***');
      return lines;
    }

    push('header', `OFFICIAL DOSSIER EXTRACT: ${(caseData.title || '').toUpperCase()}`);
    push(
      'meta',
      `CASE REF: ${caseData.caseNumber}   |   STATUS: ${(caseData.status || '').toUpperCase()}`
    );
    push(
      'meta',
      `JURISDICTION: ${caseData.overview?.jurisdiction || caseData.location || 'N/A'}   |   YEAR: ${caseData.year || 'N/A'}`
    );
    push('rule', '========================================================================');

    if (enabledSections.overview) {
      push('subhead', '[SECTION I] EXECUTIVE CASE SYNOPSIS & CIRCUMSTANCES');
      pushWrapped('body', caseData.summary);
      if (caseData.overview?.initialAlertDate) {
        push('meta', `INITIAL ALERT: ${caseData.overview.initialAlertDate}`);
      }
      if (caseData.overview?.background) {
        pushWrapped('body', `BACKGROUND: ${caseData.overview.background}`);
      }
      if (caseData.overview?.victimInfo) {
        pushWrapped('body', `VICTIM SCOPE: ${caseData.overview.victimInfo}`);
      }
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.timeline) {
      push('subhead', '[SECTION II] CHRONOLOGICAL INCIDENT & INVESTIGATION LOG');
      const events = [
        ...(caseData.incident?.timeline || []),
        ...(caseData.investigation?.timeline || []),
      ];
      if (events.length === 0) {
        pushWrapped('body', caseData.incident?.narrative);
      } else {
        events.slice(0, 16).forEach((ev, i) => {
          push(
            'meta',
            `  ${String(i + 1).padStart(2, '0')}. [${ev.date || 'UNDATED'}] ${(ev.title || '').toUpperCase()}`
          );
          pushWrapped('body', ev.description, '      ');
        });
      }
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.evidence) {
      const evidenceList = caseData.evidence || [];
      push('subhead', `[SECTION III] ADMITTED EVIDENCE INDEX (${evidenceList.length} EXHIBITS)`);
      evidenceList.forEach((ev, idx) => {
        push(
          'meta',
          `  [${ev.exhibitNumber || `EX-${idx + 1}`}] ${(ev.title || '').toUpperCase()} (${ev.classification || 'EXHIBIT'})`
        );
        pushWrapped('body', `SUMMARY: ${ev.description || ''}`, '      ');
        if (ev.significance) {
          pushWrapped('body', `SIGNIFICANCE: ${ev.significance}`, '      ');
        }
      });
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.poi) {
      const poiList = caseData.personsOfInterest || [];
      push('subhead', '[SECTION IV] PERSONS OF INTEREST & LEGAL DISPOSITION');
      poiList.forEach((p) => {
        push(
          'meta',
          `  * ${(p.name || '').toUpperCase()} — ${p.role || 'Subject'} [STATUS: ${(p.status || '').toUpperCase()}]`
        );
        pushWrapped('body', `VERIFIED RECORD: ${p.verifiedFindings || p.background || ''}`, '    ');
        if (p.outcome) {
          pushWrapped('body', `DISPOSITION: ${p.outcome}`, '    ');
        }
      });
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.verdict) {
      push('subhead', '[SECTION V] JUDICIAL PROCEEDINGS, VERDICT & AFTERMATH');
      push('meta', `  COURT: ${caseData.courtroom?.court || 'District Court'}`);
      push('meta', `  BENCH: ${caseData.courtroom?.presidingJudge || 'Presiding Magistrate'}`);
      if (caseData.courtroom?.charges?.length) {
        pushWrapped('body', `CHARGES: ${caseData.courtroom.charges.join('; ')}`, '  ');
      }
      if (caseData.verdict) {
        pushWrapped(
          'body',
          `DISPOSITION (${caseData.verdict.verdictDate || 'N/A'}): ${caseData.verdict.pleaOrVerdict || 'Pending'}`,
          '  '
        );
        if (caseData.verdict.sentencing) {
          pushWrapped('body', `SENTENCE / OUTCOME: ${caseData.verdict.sentencing}`, '  ');
        }
        if (caseData.verdict.appealsAndRulings) {
          pushWrapped('body', `APPELLATE RECORD: ${caseData.verdict.appealsAndRulings}`, '  ');
        }
        if (caseData.verdict.unresolvedLegalQuestions) {
          pushWrapped('body', `OPEN INQUIRIES: ${caseData.verdict.unresolvedLegalQuestions}`, '  ');
        }
      }
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.citations && caseData.citations?.length) {
      push('subhead', '[SECTION VI] AUDITED PUBLIC RECORD CITATIONS');
      caseData.citations.forEach((cit, idx) => {
        pushWrapped(
          'body',
          `[${idx + 1}] ${cit.title} — ${cit.source}${cit.date ? ` (${cit.date})` : ''}`,
          '  '
        );
      });
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.notes) {
      const stickyNotes = loadStickyNotes(caseData.slug);
      if (stickyNotes.length > 0) {
        push('subhead', `[SECTION VII] INVESTIGATOR STICKY NOTES (${stickyNotes.length})`);
        stickyNotes.forEach((n, idx) => {
          push(
            'meta',
            `  [${idx + 1}] ${n.tag.toUpperCase()} // ${n.sectionLabel}`
          );
          if (n.quotedExcerpt) {
            pushWrapped('body', `EXCERPT: "${n.quotedExcerpt}"`, '      ');
          }
          pushWrapped('body', `NOTE: ${n.noteText}`, '      ');
        });
        push('rule', '========================================================================');
      }
    }

    push('meta', `*** END OF DOCKET FEED // ${caseData.caseNumber} // ARCHIVE INTEGRITY VERIFIED ***`);
    return lines;
  }, [caseData, enabledSections, docKey]);

  const resetKey = `${isOpen}|${caseData.slug}|${docKey}|${JSON.stringify(enabledSections)}`;

  // Reset feed cleanly only when opened or sections/document identity actually change
  useEffect(() => {
    if (!isOpen) return;
    autoFollowRef.current = true;
    setPrintedCount(1);
    setIsFeeding(true);
    setTornNotice(null);
    soundEngine.playCarriageReturn();
  }, [resetKey]);

  // Track whether user manually scrolled away from bottom
  const handleViewportScroll = () => {
    const el = feedViewportRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    autoFollowRef.current = distanceFromBottom < 80;
  };

  // Live physical line-feed stepper
  useEffect(() => {
    if (!isOpen || !isFeeding) return;
    if (printedCount >= feedLines.length) {
      setIsFeeding(false);
      soundEngine.playCarriageReturn();
      return;
    }

    const timer = window.setTimeout(() => {
      const nextIndex = printedCount;
      const line = feedLines[nextIndex];
      setPrintedCount((c) => Math.min(feedLines.length, c + 1));

      if (line?.kind === 'perforation' || line?.kind === 'subhead') {
        soundEngine.playCarriageReturn();
      } else if (nextIndex % 2 === 0) {
        soundEngine.playPrinterTick();
      }

      if (feedViewportRef.current && autoFollowRef.current) {
        feedViewportRef.current.scrollTop = feedViewportRef.current.scrollHeight;
      }
    }, feedSpeedMs);

    return () => window.clearTimeout(timer);
  }, [isOpen, isFeeding, printedCount, feedLines, feedSpeedMs]);

  if (!isOpen) return null;

  const progressPct = feedLines.length
    ? Math.round((printedCount / feedLines.length) * 100)
    : 100;
  const isComplete = printedCount >= feedLines.length;

  const handleCompleteNow = () => {
    soundEngine.playCarriageReturn();
    setPrintedCount(feedLines.length);
    setIsFeeding(false);
  };

  const handleRestartFeed = () => {
    soundEngine.playCarriageReturn();
    autoFollowRef.current = true;
    setPrintedCount(1);
    setIsFeeding(true);
    if (feedViewportRef.current) {
      feedViewportRef.current.scrollTop = 0;
    }
  };

  const handlePhysicalPrint = () => {
    if (!isComplete) {
      setPrintedCount(feedLines.length);
      setIsFeeding(false);
    }
    soundEngine.playPaperTear();
    setTornNotice(
      window.self !== window.top
        ? 'PRINT JOB SENT (USE EXPORT .HTML IF PREVIEW FRAME BLOCKS DIALOG)'
        : 'SHEET SENT TO PRINTER SPOOLER'
    );

    // Wait two animation frames so full feed lines are committed before window.print()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          window.print();
        } catch (err) {
          console.warn('window.print() failed:', err);
          setTornNotice('DIRECT PRINT BLOCKED — USE EXPORT .HTML OR CTRL+P');
        }
      });
    });
  };

  const handleExportTxt = () => {
    soundEngine.playPaperTear();
    const content = feedLines.map((l) => l.text).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseData.caseNumber.toLowerCase()}-docket-feed.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTornNotice('EXPORTED .TXT TRACTOR SHEET');
  };

  const handleExportPrintableHtml = () => {
    soundEngine.playPaperTear();
    const rows = feedLines
      .map((l) => {
        const cls = `line-${l.kind}`;
        return `<div class="${cls}">${escapeHtml(l.text)}</div>`;
      })
      .join('\n');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(caseData.caseNumber)} — Printable Docket Feed</title>
<style>
  @page { size: letter; margin: 0.6in; }
  body { background: #ffffff; color: #111111; font-family: 'Courier New', Courier, monospace; font-size: 11pt; line-height: 1.45; max-width: 78ch; margin: 0 auto; padding: 24px; }
  .stamp { display: flex; justify-content: space-between; border-bottom: 1.5px solid #333; padding-bottom: 6px; margin-bottom: 14px; font-size: 9.5pt; }
  .badge { border: 1px solid #7f1d1d; color: #7f1d1d; padding: 1px 6px; font-weight: bold; }
  .line-header { font-size: 14pt; font-weight: bold; margin: 8px 0 4px; }
  .line-subhead { font-size: 11pt; font-weight: bold; margin: 14px 0 6px; border-bottom: 1px solid #999; padding-bottom: 2px; break-after: avoid; }
  .line-meta { font-weight: bold; color: #222; white-space: pre-wrap; }
  .line-rule { color: #555; overflow: hidden; white-space: nowrap; }
  .line-perforation { border-top: 1px dashed #888; text-align: center; font-size: 8.5pt; color: #666; margin: 14px 0; padding-top: 3px; }
  .line-body { white-space: pre-wrap; word-break: break-word; }
  .print-btn-bar { margin-bottom: 16px; padding: 10px; background: #f4f1ea; border: 1px solid #ccc; display: flex; justify-content: space-between; align-items: center; }
  @media print { .print-btn-bar { display: none; } body { padding: 0; } }
</style>
</head>
<body>
  <div class="print-btn-bar">
    <span>FORM FD-302 // ARCHIVAL TRACTOR FEED COPY</span>
    <button onclick="window.print()" style="padding:6px 14px;font-family:monospace;font-weight:bold;cursor:pointer;">PRINT SHEET</button>
  </div>
  <div class="stamp">
    <span>FORM FD-302 // ARCHIVAL OUTPUT</span>
    <span class="badge">OFFICIAL RECORD COPY</span>
  </div>
  ${rows}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseData.caseNumber.toLowerCase()}-printable-docket.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTornNotice('SAVED STANDALONE PRINTABLE .HTML');
  };

  const renderFeedLine = (line: FeedLine, forPrintPortal = false) => {
    const baseBreak = forPrintPortal ? 'print-line' : '';
    if (line.kind === 'perforation') {
      return (
        <div
          key={line.id}
          className={`${baseBreak} paper-perforation my-4 pt-1 text-[9px] font-mono tracking-widest ${
            forPrintPortal ? 'text-[#555555]' : 'text-[#7c7668]'
          } text-center`}
        >
          {line.text}
        </div>
      );
    }
    if (line.kind === 'rule') {
      return (
        <div
          key={line.id}
          className={`${baseBreak} font-mono text-[11px] ${
            forPrintPortal ? 'text-[#333333]' : 'text-[#5e5a4f]'
          } overflow-hidden whitespace-nowrap`}
        >
          {line.text}
        </div>
      );
    }
    if (line.kind === 'header') {
      return (
        <div
          key={line.id}
          className={`${baseBreak} font-bold text-[15px] sm:text-[17px] tracking-wide ${
            forPrintPortal ? 'text-[#000000]' : 'text-[#11100e]'
          } pt-1`}
        >
          {line.text}
        </div>
      );
    }
    if (line.kind === 'subhead') {
      return (
        <div
          key={line.id}
          className={`${forPrintPortal ? 'print-subhead' : ''} font-bold text-[12px] tracking-wider ${
            forPrintPortal
              ? 'text-[#000000] border-[#888888]'
              : 'text-[#1c1917] border-[#d5cebe]'
          } pt-3 pb-1 border-b`}
        >
          {line.text}
        </div>
      );
    }
    if (line.kind === 'meta') {
      return (
        <div
          key={line.id}
          className={`${baseBreak} font-mono text-[11px] font-semibold ${
            forPrintPortal ? 'text-[#111111]' : 'text-[#3f3b33]'
          } whitespace-pre-wrap`}
        >
          {line.text}
        </div>
      );
    }
    return (
      <div
        key={line.id}
        className={`${baseBreak} ${
          forPrintPortal ? 'text-[#111111]' : 'text-[#26241f]'
        } whitespace-pre-wrap break-words`}
      >
        {line.text}
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Physical Docket Document Feed Printer"
      >
        <div className="w-full max-w-4xl bg-[#0d1014] border-2 border-[#353d49] shadow-[0_24px_80px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden">
          {/* Minimalist Retro Printer Chassis Header */}
          <div className="bg-[#161b22] border-b-2 border-[#2d333b] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="font-pixel text-[10px] text-zinc-200 tracking-widest uppercase">
                  LPT1 // DOT-MATRIX PHYSICAL FEED OUTPUT
                </div>
                <div className="font-mono text-[10px] text-zinc-400">
                  {caseData.caseNumber} &bull; CONTINUOUS TRACTOR PAPER (8.5&times;11 IN)
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] text-amber-400 bg-black/70 border border-zinc-800 px-2 py-0.5">
                {isComplete
                  ? 'FEED COMPLETE [READY TO TEAR]'
                  : `FEEDING LINE ${printedCount}/${feedLines.length} (${progressPct}%)`}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playKeyClick();
                  onClose();
                }}
                className="retro-btn p-1.5 text-zinc-400 hover:text-zinc-100"
                aria-label="Close print dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section Selector Strip (Minimalist Toggle Bar) */}
          {!documentOverride && (
            <div className="bg-[#0b0e12] border-b border-[#232830] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
              <span className="text-zinc-500 uppercase tracking-wider">SPOOL SECTIONS:</span>
              <div className="flex flex-wrap gap-1.5">
                {SECTION_LABELS.map((sec) => {
                  const active = enabledSections[sec.key];
                  return (
                    <button
                      key={sec.key}
                      type="button"
                      onClick={() => {
                        soundEngine.playKeyClick();
                        setEnabledSections((prev) => ({
                          ...prev,
                          [sec.key]: !prev[sec.key],
                        }));
                      }}
                      className={`px-2 py-0.5 border transition-colors flex items-center space-x-1 ${
                        active
                          ? 'bg-zinc-800 border-zinc-500 text-zinc-100'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {active && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Physical Paper Feed Chamber */}
          <div
            ref={feedViewportRef}
            onScroll={handleViewportScroll}
            className="flex-1 overflow-y-auto bg-[#07080a] p-4 sm:p-6 flex justify-center"
          >
            <div className="w-full max-w-3xl bg-[#f3efe6] text-[#191815] shadow-[0_12px_40px_rgba(0,0,0,0.85)] border border-[#cfc8b8] flex relative min-h-[360px] h-fit">
              {/* Left Tractor-Feed Sprocket Margin */}
              <div className="w-7 sm:w-9 shrink-0 bg-[#ebe5d8] border-r border-dashed border-[#bfb7a6] tractor-feed-edge opacity-85" />

              {/* Paper Print Area */}
              <div className="flex-1 px-4 sm:px-8 py-6 font-typewriter text-[12px] sm:text-[13px] leading-relaxed select-text">
                {/* Minimalist Printer Header Stamp */}
                <div className="flex items-center justify-between border-b border-[#8f897b] pb-2 mb-4 text-[10px] font-mono text-[#524e44]">
                  <span>FORM FD-302 // ARCHIVAL OUTPUT</span>
                  <span className="border border-[#7f1d1d] text-[#7f1d1d] px-1.5 py-0.2 font-bold tracking-widest uppercase">
                    OFFICIAL RECORD COPY
                  </span>
                </div>

                <div className="space-y-1">
                  {feedLines.slice(0, printedCount).map((line) => renderFeedLine(line, false))}

                  {/* Active Print Head Carriage Indicator */}
                  {!isComplete && (
                    <div className="pt-2 flex items-center space-x-2 text-[11px] font-mono text-[#7f1d1d]">
                      <span className="inline-block w-2.5 h-4 bg-[#191815] cursor-blink" />
                      <span className="tracking-widest uppercase">
                        {isFeeding ? 'PRINT HEAD ACTIVE...' : 'FEED PAUSED'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Tractor-Feed Sprocket Margin */}
              <div className="w-7 sm:w-9 shrink-0 bg-[#ebe5d8] border-l border-dashed border-[#bfb7a6] tractor-feed-edge opacity-85" />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="bg-[#14181f] border-t-2 border-[#2d333b] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              {!isComplete && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyClick();
                    setIsFeeding((f) => !f);
                  }}
                  className="retro-btn px-3 py-1.5 flex items-center space-x-1.5"
                >
                  {isFeeding ? (
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{isFeeding ? 'PAUSE FEED' : 'RESUME FEED'}</span>
                </button>
              )}

              {!isComplete && (
                <button
                  type="button"
                  onClick={handleCompleteNow}
                  className="retro-btn px-3 py-1.5 flex items-center space-x-1.5"
                >
                  <FastForward className="w-3.5 h-3.5 text-zinc-300" />
                  <span>INSTANT FEED</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRestartFeed}
                className="retro-btn px-3 py-1.5 flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>RE-FEED</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playKeyClick();
                  setFeedSpeedMs((ms) => (ms === 36 ? 12 : 36));
                }}
                className="retro-btn px-2.5 py-1.5 text-[10px] text-zinc-400"
              >
                SPEED: {feedSpeedMs === 36 ? '1X' : '3X'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {tornNotice && (
                <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                  <Scissors className="w-3 h-3" />
                  <span>{tornNotice}</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleExportTxt}
                className="retro-btn px-3 py-1.5 flex items-center space-x-1.5"
                title="Download plain-text continuous feed file"
              >
                <Download className="w-3.5 h-3.5 text-zinc-300" />
                <span>EXPORT .TXT</span>
              </button>

              <button
                type="button"
                onClick={handleExportPrintableHtml}
                className="retro-btn px-3 py-1.5 flex items-center space-x-1.5"
                title="Save standalone print-ready HTML sheet"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-300" />
                <span>EXPORT .HTML</span>
              </button>

              <button
                type="button"
                onClick={handlePhysicalPrint}
                className="retro-btn retro-btn-green px-4 py-1.5 font-bold flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>TEAR &amp; PRINT COPY</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated clean print portal mounted directly on document.body (avoids fixed/overflow clipping during multi-page print) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="retro-print-portal-sheet" aria-hidden="true">
            <div className="px-2 py-2 font-typewriter text-[11pt] leading-relaxed">
              <div className="flex items-center justify-between border-b border-[#444] pb-2 mb-4 text-[9pt] font-mono text-[#333]">
                <span>FORM FD-302 // ARCHIVAL OUTPUT</span>
                <span className="border border-[#7f1d1d] text-[#7f1d1d] px-1.5 py-0.5 font-bold tracking-widest uppercase">
                  OFFICIAL RECORD COPY
                </span>
              </div>
              <div className="space-y-1">
                {feedLines.map((line) => renderFeedLine(line, true))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
