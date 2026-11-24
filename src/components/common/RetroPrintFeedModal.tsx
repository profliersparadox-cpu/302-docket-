import React, { useState, useEffect, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import { CaseFile } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

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
  | 'citations';

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
];

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
  });

  const [printedCount, setPrintedCount] = useState<number>(0);
  const [isFeeding, setIsFeeding] = useState<boolean>(true);
  const [feedSpeedMs, setFeedSpeedMs] = useState<number>(48);
  const [tornNotice, setTornNotice] = useState<boolean>(false);
  const feedViewportRef = useRef<HTMLDivElement>(null);

  const feedLines: FeedLine[] = useMemo(() => {
    const lines: FeedLine[] = [];
    const push = (kind: FeedLine['kind'], text: string) => {
      lines.push({ id: `ln-${lines.length}`, kind, text });
    };

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

    push('meta', `THE 302 DOCKET // CONTINUOUS FORM TRACTOR FEED [REV 1996.4]`);
    push('meta', `SPOOL TIMESTAMP: ${timestamp}   PORT: LPT1://ARCHIVE-PRINTER`);
    push('rule', '========================================================================');

    if (documentOverride) {
      push('header', documentOverride.title.toUpperCase());
      push(
        'meta',
        `DOCKET: ${caseData.caseNumber}  |  CLASSIFICATION: ${documentOverride.classification}`
      );
      push('meta', `AGENCY: ${documentOverride.agency}  |  DATE: ${documentOverride.date}`);
      push('rule', '------------------------------------------------------------------------');
      documentOverride.body.split('\n').forEach((line) => {
        push('body', line || ' ');
      });
      push('perforation', '--- PERFORATION / TEAR LINE --------------------------------------------');
      push('meta', `PRIMARY CITATION: ${documentOverride.citation}`);
      push('rule', '========================================================================');
      push('meta', '*** END OF TRANSMISSION // CERTIFIED PUBLIC ARCHIVE COPY ***');
      return lines;
    }

    push('header', `OFFICIAL DOSSIER EXTRACT: ${caseData.title.toUpperCase()}`);
    push(
      'meta',
      `CASE REF: ${caseData.caseNumber}   |   STATUS: ${caseData.status.toUpperCase()}`
    );
    push(
      'meta',
      `JURISDICTION: ${caseData.overview?.jurisdiction || caseData.location}   |   YEAR: ${caseData.year}`
    );
    push('rule', '========================================================================');

    if (enabledSections.overview) {
      push('subhead', '[SECTION I] EXECUTIVE CASE SYNOPSIS & CIRCUMSTANCES');
      push('body', caseData.summary);
      push('body', `INITIAL ALERT: ${caseData.overview.initialAlertDate}`);
      push('body', `BACKGROUND: ${caseData.overview.background}`);
      push('body', `VICTIM SCOPE: ${caseData.overview.victimInfo}`);
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.timeline) {
      push('subhead', '[SECTION II] CHRONOLOGICAL INCIDENT & INVESTIGATION LOG');
      const events = [
        ...(caseData.incident?.timeline || []),
        ...(caseData.investigation?.timeline || []),
      ];
      if (events.length === 0) {
        push('body', caseData.incident.narrative);
      } else {
        events.slice(0, 12).forEach((ev, i) => {
          push('meta', `  ${String(i + 1).padStart(2, '0')}. [${ev.date}] ${ev.title.toUpperCase()}`);
          push('body', `      ${ev.description}`);
        });
      }
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.evidence) {
      push('subhead', `[SECTION III] ADMITTED EVIDENCE INDEX (${caseData.evidence.length} EXHIBITS)`);
      caseData.evidence.forEach((ev, idx) => {
        push(
          'meta',
          `  [${ev.exhibitNumber || `EX-${idx + 1}`}] ${ev.title.toUpperCase()} (${ev.classification})`
        );
        push('body', `      SUMMARY: ${ev.description}`);
        push('body', `      SIGNIFICANCE: ${ev.significance}`);
      });
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.poi) {
      push('subhead', `[SECTION IV] PERSONS OF INTEREST & LEGAL DISPOSITION`);
      caseData.personsOfInterest.forEach((p) => {
        push('meta', `  * ${p.name.toUpperCase()} — ${p.role} [STATUS: ${p.status.toUpperCase()}]`);
        push('body', `    VERIFIED RECORD: ${p.verifiedFindings || p.background}`);
        push('body', `    DISPOSITION: ${p.outcome}`);
      });
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.verdict) {
      push('subhead', `[SECTION V] JUDICIAL PROCEEDINGS, VERDICT & AFTERMATH`);
      push('meta', `  COURT: ${caseData.courtroom?.court || 'District Court'}`);
      push('meta', `  BENCH: ${caseData.courtroom?.presidingJudge || 'Presiding Magistrate'}`);
      if (caseData.courtroom?.charges?.length) {
        push('body', `  CHARGES: ${caseData.courtroom.charges.join(' ; ')}`);
      }
      push('body', `  DISPOSITION (${caseData.verdict.verdictDate}): ${caseData.verdict.pleaOrVerdict}`);
      push('body', `  SENTENCE / OUTCOME: ${caseData.verdict.sentencing}`);
      if (caseData.verdict.appealsAndRulings) {
        push('body', `  APPELLATE RECORD: ${caseData.verdict.appealsAndRulings}`);
      }
      if (caseData.verdict.unresolvedLegalQuestions) {
        push('body', `  OPEN INQUIRIES: ${caseData.verdict.unresolvedLegalQuestions}`);
      }
      push('perforation', '--- FORM FEED PERFORATION ----------------------------------------------');
    }

    if (enabledSections.citations && caseData.citations?.length) {
      push('subhead', `[SECTION VI] AUDITED PUBLIC RECORD CITATIONS`);
      caseData.citations.forEach((cit, idx) => {
        push(
          'body',
          `  [${idx + 1}] ${cit.title} — ${cit.source}${cit.date ? ` (${cit.date})` : ''}`
        );
      });
      push('rule', '========================================================================');
    }

    push('meta', `*** END OF DOCKET FEED // ${caseData.caseNumber} // ARCHIVE INTEGRITY VERIFIED ***`);
    return lines;
  }, [caseData, enabledSections, documentOverride]);

  // Reset feed cleanly when opened or sections toggled
  useEffect(() => {
    if (!isOpen) return;
    setPrintedCount(1);
    setIsFeeding(true);
    setTornNotice(false);
    soundEngine.playCarriageReturn();
  }, [isOpen, enabledSections, documentOverride]);

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

      if (feedViewportRef.current) {
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
    setPrintedCount(1);
    setIsFeeding(true);
  };

  const handlePhysicalPrint = () => {
    if (!isComplete) {
      setPrintedCount(feedLines.length);
      setIsFeeding(false);
    }
    soundEngine.playPaperTear();
    setTornNotice(true);
    document.body.classList.add('printing-feed-sheet');

    const cleanup = () => {
      document.body.classList.remove('printing-feed-sheet');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      // Fallback cleanup in case afterprint does not fire in sandboxed iframe
      setTimeout(cleanup, 1200);
    }, 180);
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
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Physical Docket Document Feed Printer"
    >
      <div className="w-full max-w-4xl bg-[#0d1014] border-2 border-[#353d49] shadow-[0_24px_80px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Minimalist Retro Printer Chassis Header */}
        <div className="no-print-feed bg-[#161b22] border-b-2 border-[#2d333b] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
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
              {isComplete ? 'FEED COMPLETE [READY TO TEAR]' : `FEEDING LINE ${printedCount}/${feedLines.length} (${progressPct}%)`}
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
          <div className="no-print-feed bg-[#0b0e12] border-b border-[#232830] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
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
          className="flex-1 overflow-y-auto bg-[#07080a] p-4 sm:p-6 flex justify-center"
        >
          <div
            id="retro-print-feed-sheet"
            className="w-full max-w-3xl bg-[#f3efe6] text-[#191815] shadow-[0_12px_40px_rgba(0,0,0,0.85)] border border-[#cfc8b8] flex relative min-h-[360px]"
          >
            {/* Left Tractor-Feed Sprocket Margin */}
            <div className="no-print-feed w-7 sm:w-9 shrink-0 bg-[#ebe5d8] border-r border-dashed border-[#bfb7a6] tractor-feed-edge opacity-85" />

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
                {feedLines.slice(0, printedCount).map((line) => {
                  if (line.kind === 'perforation') {
                    return (
                      <div
                        key={line.id}
                        className="paper-perforation my-4 pt-1 text-[9px] font-mono tracking-widest text-[#7c7668] text-center"
                      >
                        {line.text}
                      </div>
                    );
                  }
                  if (line.kind === 'rule') {
                    return (
                      <div
                        key={line.id}
                        className="font-mono text-[11px] text-[#5e5a4f] overflow-hidden whitespace-nowrap"
                      >
                        {line.text}
                      </div>
                    );
                  }
                  if (line.kind === 'header') {
                    return (
                      <div
                        key={line.id}
                        className="font-bold text-[15px] sm:text-[17px] tracking-wide text-[#11100e] pt-1"
                      >
                        {line.text}
                      </div>
                    );
                  }
                  if (line.kind === 'subhead') {
                    return (
                      <div
                        key={line.id}
                        className="font-bold text-[12px] tracking-wider text-[#1c1917] pt-3 pb-1 border-b border-[#d5cebe]"
                      >
                        {line.text}
                      </div>
                    );
                  }
                  if (line.kind === 'meta') {
                    return (
                      <div
                        key={line.id}
                        className="font-mono text-[11px] font-semibold text-[#3f3b33] whitespace-pre-wrap"
                      >
                        {line.text}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={line.id}
                      className="text-[#26241f] whitespace-pre-wrap break-words"
                    >
                      {line.text}
                    </div>
                  );
                })}

                {/* Active Print Head Carriage Indicator */}
                {!isComplete && (
                  <div className="no-print-feed pt-2 flex items-center space-x-2 text-[11px] font-mono text-[#7f1d1d]">
                    <span className="inline-block w-2.5 h-4 bg-[#191815] cursor-blink" />
                    <span className="tracking-widest uppercase">
                      {isFeeding ? 'PRINT HEAD ACTIVE...' : 'FEED PAUSED'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Tractor-Feed Sprocket Margin */}
            <div className="no-print-feed w-7 sm:w-9 shrink-0 bg-[#ebe5d8] border-l border-dashed border-[#bfb7a6] tractor-feed-edge opacity-85" />
          </div>
        </div>

        {/* Footer Controls */}
        <div className="no-print-feed bg-[#14181f] border-t-2 border-[#2d333b] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
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
                {isFeeding ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
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
                setFeedSpeedMs((ms) => (ms === 48 ? 16 : 48));
              }}
              className="retro-btn px-2.5 py-1.5 text-[10px] text-zinc-400"
            >
              SPEED: {feedSpeedMs === 48 ? '1X' : '3X'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tornNotice && (
              <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                <Scissors className="w-3 h-3" />
                <span>SHEET SENT TO SPOOLER</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleExportTxt}
              className="retro-btn px-3 py-1.5 flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              <span>EXPORT .TXT</span>
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
  );
};
