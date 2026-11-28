import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Calendar,
  MapPin,
  Shield,
  FileText,
  Clock,
  Fingerprint,
  Users,
  Search,
  Scale,
  Gavel,
  History,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Printer,
  Info,
  Tv,
  Eye,
  Pin,
  Mic,
  Award,
  Compass,
  FileCheck,
  Upload,
} from 'lucide-react';
import { CaseFile, EvidenceItem, PersonOfInterest } from '../types.ts';
import { useArchive } from '../context/ArchiveContext.tsx';
import { soundEngine } from '../utils/soundEngine.ts';
import { CaseInteractiveExperience } from './case/CaseInteractiveExperience.tsx';
import { CaseTimelineView } from './case/CaseTimelineView.tsx';
import { CaseWitnessStatementsView } from './case/CaseWitnessStatementsView.tsx';
import { CaseEvidenceView } from './case/CaseEvidenceView.tsx';
import { CaseFindingsView } from './case/CaseFindingsView.tsx';
import { CaseEvidenceBoardView } from './case/CaseEvidenceBoardView.tsx';
import { CaseCourtroomView } from './case/CaseCourtroomView.tsx';
import { CasePersonsOfInterestView } from './case/CasePersonsOfInterestView.tsx';
import { CaseColdCaseTheoryLab } from './case/CaseColdCaseTheoryLab.tsx';
import { CaseMediaVaultView } from './case/CaseMediaVaultView.tsx';
import { RetroPrintFeedModal } from './common/RetroPrintFeedModal.tsx';
import { DossierCrossRefText, CrossRefHit } from './case/DossierCrossRefText.tsx';
import { ChapterAuditChallenge } from './case/ChapterAuditChallenge.tsx';
import { EvidenceTimelineScrubber } from './case/EvidenceTimelineScrubber.tsx';
import { AudioEvidence } from './case/AudioEvidence.tsx';
import {
  DocumentStickyNote,
  loadStickyNotes,
  STICKY_NOTES_UPDATED_EVENT,
} from '../utils/stickyNotes.ts';
import {
  SectionStickyTrigger,
  SectionStickyListAndComposer,
} from './case/SectionStickyAnchor.tsx';
import { StickyNotesIndexDrawer } from './case/StickyNotesIndexDrawer.tsx';
import { X, BookOpen, StickyNote, Highlighter, ClipboardList } from 'lucide-react';
import {
  DocumentHighlightProvider,
  DocumentHighlightConfig,
  HighlightText,
  countTermOccurrences,
} from '../context/DocumentHighlightContext.tsx';
import {
  DocumentSearchHighlighterBar,
  ChapterMatchSummary,
} from './case/DocumentSearchHighlighterBar.tsx';
import { WorkBoardSidePanel } from './case/WorkBoardSidePanel.tsx';
import {
  loadWorkBoard,
  addWorkBoardPin,
  WORK_BOARD_UPDATED_EVENT,
  DOCKET_PIN_DRAG_MIME,
} from '../utils/workBoard.ts';
import { InvestigativeLedgerSidebar } from './case/InvestigativeLedgerSidebar.tsx';
import {
  loadInvestigativeLedger,
  recordLedgerEvent,
  INVESTIGATIVE_LEDGER_UPDATED_EVENT,
} from '../utils/investigativeLedger.ts';

interface CaseDetailProps {
  caseSlug: string;
  onBack: () => void;
  onSelectRelatedCase: (slug: string) => void;
}

const CHAPTERS = [
  { index: 0, id: 'intro', title: '01 — CASE INTRODUCTION', icon: FileText },
  { index: 1, id: 'incident', title: '02 — THE INCIDENT', icon: Clock },
  { index: 2, id: 'initial', title: '03 — INITIAL INVESTIGATION', icon: Search },
  { index: 3, id: 'evidence', title: '04 — EVIDENCE ROOM', icon: Fingerprint },
  { index: 4, id: 'poi', title: '05 — PERSONS OF INTEREST', icon: Users },
  { index: 5, id: 'breakthrough', title: '06 — BREAKTHROUGH', icon: CheckCircle2 },
  { index: 6, id: 'courtroom', title: '07 — THE COURTROOM', icon: Scale },
  { index: 7, id: 'verdict', title: '08 — THE VERDICT', icon: Gavel },
  { index: 8, id: 'aftermath', title: '09 — AFTERMATH', icon: History },
];

export const CaseDetail: React.FC<CaseDetailProps> = ({
  caseSlug,
  onBack,
  onSelectRelatedCase,
}) => {
  const { isBookmarked, toggleBookmark, markChapterRead, getCaseProgress, revealRedactions } = useArchive();
  const [caseData, setCaseData] = useState<CaseFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(0);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<PersonOfInterest | null>(null);
  const [expandedReflectionIndex, setExpandedReflectionIndex] = useState<number | null>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [networkViewMode, setNetworkViewMode] = useState<'diagram' | 'cards'>('cards');
  const [showInteractiveSuite, setShowInteractiveSuite] = useState(false);
  const [interactiveSuiteView, setInteractiveSuiteView] = useState<'pinboard' | 'timeline' | 'documents' | 'interviews' | 'exercise' | 'media' | 'radar'>('pinboard');
  const [visitedStages, setVisitedStages] = useState<Set<number>>(() => new Set([0]));
  const [verifiedAudits, setVerifiedAudits] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`docket_audits_${caseSlug}`);
      return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeCrossRef, setActiveCrossRef] = useState<CrossRefHit | null>(null);
  const [stickyNotes, setStickyNotes] = useState<DocumentStickyNote[]>(() =>
    loadStickyNotes(caseSlug)
  );
  const [showStickyIndex, setShowStickyIndex] = useState(false);
  const [openStickySectionId, setOpenStickySectionId] = useState<string | null>(null);
  const [stickySelectionExcerpt, setStickySelectionExcerpt] = useState('');
  const [requestedDocumentId, setRequestedDocumentId] = useState<string | undefined>(undefined);
  const [showHighlighter, setShowHighlighter] = useState(false);
  const [highlightConfig, setHighlightConfig] = useState<DocumentHighlightConfig>({
    query: '',
    caseSensitive: false,
    wholeWord: false,
    pinnedTerms: [],
  });
  const [showWorkBoard, setShowWorkBoard] = useState<boolean>(() => {
    try {
      return localStorage.getItem('docket_workboard_open') === 'true';
    } catch {
      return false;
    }
  });
  const [workBoardCount, setWorkBoardCount] = useState<number>(() =>
    loadWorkBoard(caseSlug).pins.length
  );
  const [showLedger, setShowLedger] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('docket_ledger_open');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [ledgerCount, setLedgerCount] = useState<number>(() =>
    loadInvestigativeLedger(caseSlug).length
  );
  const [selectionPinPrompt, setSelectionPinPrompt] = useState<{
    text: string;
    sourceLabel: string;
    top: number;
    left: number;
  } | null>(null);
  const dossierHighlightRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const chapterMatchCounts: ChapterMatchSummary[] = useMemo(() => {
    if (!caseData || !highlightConfig.query.trim()) return [];
    const q = highlightConfig.query;
    const cs = highlightConfig.caseSensitive;
    const ww = highlightConfig.wholeWord;

    const countText = (parts: (string | undefined | null)[]) =>
      parts.reduce((sum, p) => sum + countTermOccurrences(p, q, cs, ww), 0);

    return [
      {
        chapterIndex: 0,
        shortLabel: 'CH 01',
        count: countText([
          caseData.summary,
          caseData.overview?.background,
          caseData.overview?.victimInfo,
        ]),
      },
      {
        chapterIndex: 1,
        shortLabel: 'CH 02',
        count: countText([
          caseData.incident?.narrative,
          ...(caseData.incident?.timeline || []).flatMap((t) => [t.title, t.description]),
        ]),
      },
      {
        chapterIndex: 2,
        shortLabel: 'CH 03',
        count: countText([
          caseData.investigation?.narrative,
          caseData.investigation?.interviewRecordsSummary,
          caseData.investigation?.procedureNotes,
          ...(caseData.investigation?.timeline || []).flatMap((t) => [t.title, t.description]),
        ]),
      },
      {
        chapterIndex: 3,
        shortLabel: 'CH 04',
        count: countText(
          (caseData.evidence || []).flatMap((e) => [e.title, e.description, e.significance])
        ),
      },
      {
        chapterIndex: 4,
        shortLabel: 'CH 05',
        count: countText(
          (caseData.personsOfInterest || []).flatMap((p) => [
            p.name,
            p.role,
            p.background,
            p.verifiedFindings,
            p.outcome,
          ])
        ),
      },
      {
        chapterIndex: 5,
        shortLabel: 'CH 06',
        count: countText([
          caseData.breakthrough?.narrative,
          ...(caseData.breakthrough?.turningPoints || []).flatMap((tp) => [
            tp.title,
            tp.detail,
            tp.description,
          ]),
        ]),
      },
      {
        chapterIndex: 6,
        shortLabel: 'CH 07',
        count: countText([
          caseData.courtroom?.prosecutionArgument,
          caseData.courtroom?.defenseArgument,
          ...(caseData.courtroom?.keyTestimonies || []).flatMap((kt) => [kt.witness, kt.keyPoints]),
        ]),
      },
      {
        chapterIndex: 7,
        shortLabel: 'CH 08',
        count: countText([
          caseData.verdict?.pleaOrVerdict,
          caseData.verdict?.sentencing,
          caseData.verdict?.appealsAndRulings,
          caseData.verdict?.unresolvedLegalQuestions,
        ]),
      },
      {
        chapterIndex: 8,
        shortLabel: 'CH 09',
        count: countText([
          ...(caseData.aftermath?.legalReforms || []),
          caseData.aftermath?.institutionalImpact,
          caseData.aftermath?.victimAdvocacy,
          caseData.aftermath?.currentStatus,
        ]),
      },
    ];
  }, [caseData, highlightConfig.query, highlightConfig.caseSensitive, highlightConfig.wholeWord]);

  useEffect(() => {
    setStickyNotes(loadStickyNotes(caseSlug));
    setOpenStickySectionId(null);
    setRequestedDocumentId(undefined);
    const onStickyUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.caseSlug === caseSlug) {
        setStickyNotes(loadStickyNotes(caseSlug));
      }
    };
    window.addEventListener(STICKY_NOTES_UPDATED_EVENT, onStickyUpdated);
    return () => window.removeEventListener(STICKY_NOTES_UPDATED_EVENT, onStickyUpdated);
  }, [caseSlug]);

  useEffect(() => {
    try {
      localStorage.setItem('docket_workboard_open', showWorkBoard ? 'true' : 'false');
    } catch {}
  }, [showWorkBoard]);

  useEffect(() => {
    setWorkBoardCount(loadWorkBoard(caseSlug).pins.length);
    const onWorkBoardUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.caseSlug === caseSlug) {
        setWorkBoardCount(loadWorkBoard(caseSlug).pins.length);
      }
    };
    window.addEventListener(WORK_BOARD_UPDATED_EVENT, onWorkBoardUpdated);
    return () => window.removeEventListener(WORK_BOARD_UPDATED_EVENT, onWorkBoardUpdated);
  }, [caseSlug]);

  useEffect(() => {
    try {
      localStorage.setItem('docket_ledger_open', showLedger ? 'true' : 'false');
    } catch {}
  }, [showLedger]);

  useEffect(() => {
    setLedgerCount(loadInvestigativeLedger(caseSlug).length);
    const onLedgerUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.caseSlug === caseSlug) {
        setLedgerCount(loadInvestigativeLedger(caseSlug).length);
      }
    };
    window.addEventListener(INVESTIGATIVE_LEDGER_UPDATED_EVENT, onLedgerUpdated);
    return () => window.removeEventListener(INVESTIGATIVE_LEDGER_UPDATED_EVENT, onLedgerUpdated);
  }, [caseSlug]);

  useEffect(() => {
    if (!activeCrossRef || !caseData) return;
    const subject =
      activeCrossRef.kind === 'evidence'
        ? `Exhibit ${activeCrossRef.item.exhibitNumber || ''} · ${activeCrossRef.item.title}`
        : activeCrossRef.kind === 'poi'
        ? `Subject: ${activeCrossRef.item.name}`
        : `Doctrine: ${activeCrossRef.item.term}`;
    recordLedgerEvent(caseData.slug, {
      caseNumber: caseData.caseNumber,
      category: 'document_view',
      action: 'Cross-Referenced Record',
      subject,
      dedupeKey: `xref-${activeCrossRef.kind}-${subject}`,
    });
  }, [activeCrossRef, caseData]);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (
        target.closest('[data-pin-selection-popover="true"]') ||
        target.closest('aside[aria-label="Persistent Investigator Work Board"]') ||
        target.closest('input, textarea, select, button')
      ) {
        return;
      }

      const root = mainContentRef.current;
      if (!root || !root.contains(target)) {
        setSelectionPinPrompt(null);
        return;
      }

      const sel = window.getSelection();
      const selectedText = sel ? sel.toString().trim() : '';
      if (!selectedText || selectedText.length < 3 || !sel || sel.rangeCount === 0) {
        setSelectionPinPrompt(null);
        return;
      }

      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        setSelectionPinPrompt(null);
        return;
      }

      const chapterTitle = CHAPTERS[activeChapter]?.title || 'Case Dossier';
      const sourceLabel = showInteractiveSuite
        ? `${interactiveSuiteView.toUpperCase()} View`
        : chapterTitle;

      const clampedLeft = Math.min(Math.max(rect.left + rect.width / 2, 110), window.innerWidth - 130);
      const top = rect.top > 72 ? rect.top - 44 : rect.bottom + 8;

      setSelectionPinPrompt({
        text: selectedText.slice(0, 600),
        sourceLabel,
        top,
        left: clampedLeft,
      });
    };

    const handleClearSelection = () => {
      const sel = window.getSelection();
      if (!sel || !sel.toString().trim()) {
        setSelectionPinPrompt(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleClearSelection);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleClearSelection);
    };
  }, [activeChapter, showInteractiveSuite, interactiveSuiteView]);

  const toggleSectionSticky = (sectionId: string) => {
    if (openStickySectionId === sectionId) {
      setOpenStickySectionId(null);
      setStickySelectionExcerpt('');
      return;
    }
    const sel = window.getSelection()?.toString().trim() || '';
    setStickySelectionExcerpt(sel.slice(0, 240));
    setOpenStickySectionId(sectionId);
  };

  const renderSectionStickyControl = (sectionId: string) => (
    <SectionStickyTrigger
      count={stickyNotes.filter((n) => n.sectionId === sectionId).length}
      isComposerOpen={openStickySectionId === sectionId}
      onToggleComposer={() => toggleSectionSticky(sectionId)}
    />
  );

  const renderSectionStickyBody = (
    sectionId: string,
    sectionLabel: string,
    chapterIndex: number
  ) => (
    <SectionStickyListAndComposer
      caseSlug={caseData ? caseData.slug : caseSlug}
      caseNumber={caseData ? caseData.caseNumber : ''}
      targetType="chapter_section"
      chapterIndex={chapterIndex}
      sectionId={sectionId}
      sectionLabel={sectionLabel}
      notes={stickyNotes.filter((n) => n.sectionId === sectionId)}
      isComposerOpen={openStickySectionId === sectionId}
      onCloseComposer={() => setOpenStickySectionId(null)}
      initialExcerpt={stickySelectionExcerpt}
    />
  );

  const handleJumpToStickyNote = (note: DocumentStickyNote) => {
    setShowStickyIndex(false);
    if (note.targetType === 'document_section') {
      setRequestedDocumentId(note.documentId);
      setInteractiveSuiteView('documents');
      setShowInteractiveSuite(true);
      setTimeout(() => {
        const el = document.querySelector(`[data-sticky-section="${note.sectionId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return;
    }
    setShowInteractiveSuite(false);
    if (typeof note.chapterIndex === 'number') {
      handleChapterChange(note.chapterIndex);
    }
    setTimeout(() => {
      const el = document.querySelector(`[data-sticky-section="${note.sectionId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/cases/${caseSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Case not found');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setCaseData(data);
          setIsLoading(false);
          markChapterRead(data.id, 0);
          setVisitedStages(new Set([0]));
          recordLedgerEvent(data.slug, {
            caseNumber: data.caseNumber,
            category: 'document_view',
            action: 'Opened Dossier Chapter',
            subject: CHAPTERS[0].title,
            detail: data.title,
            dedupeKey: `chapter-view-0-${data.slug}`,
          });
          try {
            const saved = localStorage.getItem(`docket_audits_${caseSlug}`);
            setVerifiedAudits(saved ? new Set<number>(JSON.parse(saved)) : new Set<number>());
          } catch {
            setVerifiedAudits(new Set<number>());
          }
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [caseSlug]);

  const handleChapterChange = (index: number) => {
    if (index === 6 || index === 7) {
      soundEngine.playUnsealChord();
    } else {
      soundEngine.playKeyClick();
    }
    setActiveChapter(index);
    setVisitedStages((prev) => new Set(prev).add(index));
    if (caseData) {
      markChapterRead(caseData.id, index);
      recordLedgerEvent(caseData.slug, {
        caseNumber: caseData.caseNumber,
        category: 'document_view',
        action: 'Viewed Dossier Chapter',
        subject: CHAPTERS[index]?.title || `Chapter ${index + 1}`,
        dedupeKey: `chapter-view-${index}`,
      });
    }
    window.scrollTo({ top: 280, behavior: 'smooth' });
  };

  const handleVerifyChapter = (chapterIndex: number) => {
    setVerifiedAudits((prev) => {
      const next = new Set(prev).add(chapterIndex);
      try {
        localStorage.setItem(`docket_audits_${caseSlug}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    if (caseData) {
      recordLedgerEvent(caseData.slug, {
        caseNumber: caseData.caseNumber,
        category: 'milestone',
        action: 'Verified Legal Audit',
        subject: CHAPTERS[chapterIndex]?.title || `Chapter ${chapterIndex + 1}`,
        dedupeKey: `audit-verify-${chapterIndex}`,
      });
    }
  };

  const handleShare = () => {
    soundEngine.playKeyClick();
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center font-terminal text-lg text-phosphor space-y-2">
        <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
        <div>&gt; ACCESSING ENCRYPTED ARCHIVE RECORD: {caseSlug}...</div>
        <div className="text-xs font-tech text-zinc-500">DECOMPRESSING FD-302 INVESTIGATIVE CHAPTERS [1-9]</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="py-20 text-center max-w-md mx-auto retro-window p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-pixel text-zinc-200 mb-1">
          RECORD_NOT_LOCATED.ERR
        </h2>
        <p className="text-zinc-400 text-xs font-tech mb-6">
          The requested case docket could not be retrieved from the persistent database.
        </p>
        <button
          onClick={onBack}
          className="retro-btn px-4 py-2 text-xs font-tech"
        >
          RETURN TO DOCKET INDEX
        </button>
      </div>
    );
  }

  const bookmarked = isBookmarked(caseData.slug);
  const progressPercent = getCaseProgress(caseData.id);
  const isUnsolved = caseData.status === 'Cold Case / Unresolved' || caseData.status === 'Active Investigation';

  return (
    <div className="min-h-screen pb-20">
      {/* Top Dossier Action Breadcrumb */}
      <div className="bg-[#0b0e11] border-b border-[#2d333b] sticky top-0 z-40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                onBack();
              }}
              className="retro-btn text-xs font-tech flex items-center"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              BACK TO INDEX
            </button>
            <span className="hidden sm:inline font-mono text-zinc-700">|</span>
            <span className="hidden sm:inline font-pixel text-xs text-red-400">
              {caseData.caseNumber}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-xs font-tech text-zinc-400">
              <span>PROGRESS:</span>
              <span className="text-phosphor font-bold">{progressPercent}%</span>
              <div className="w-20 h-1.5 bg-black border border-zinc-700">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                toggleBookmark(caseData.slug);
              }}
              className={`retro-btn text-xs font-tech flex items-center ${
                bookmarked ? 'border-amber-600 text-amber-400' : ''
              }`}
              title="Bookmark case"
            >
              <Bookmark className={`w-3.5 h-3.5 mr-1.5 ${bookmarked ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{bookmarked ? 'SAVED' : 'SAVE FILE'}</span>
            </button>

            <button
              onClick={handleShare}
              className="retro-btn text-xs font-tech flex items-center"
              title="Copy citation link"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">{copiedLink ? 'COPIED' : 'SHARE'}</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setShowStickyIndex((v) => !v);
              }}
              className={`retro-btn text-xs font-tech flex items-center ${
                showStickyIndex || stickyNotes.length > 0
                  ? 'border-amber-600 text-amber-300'
                  : 'border-zinc-700 text-zinc-300 hover:border-amber-500'
              }`}
              title="View and filter all digital sticky notes placed on this case"
            >
              <StickyNote className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <span className="hidden sm:inline">NOTES</span>
              {stickyNotes.length > 0 && (
                <span className="ml-1 px-1.5 py-0 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] rounded">
                  {stickyNotes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                if (showInteractiveSuite) {
                  setInteractiveSuiteView('documents');
                } else {
                  setShowHighlighter((v) => !v);
                }
              }}
              className={`retro-btn text-xs font-tech flex items-center ${
                showHighlighter || highlightConfig.query.trim() || highlightConfig.pinnedTerms.length > 0
                  ? 'border-amber-500 text-amber-300'
                  : 'border-zinc-700 text-zinc-300 hover:border-amber-500'
              }`}
              title="Search and highlight terms across evidentiary documents and dossier chapters"
            >
              <Highlighter className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <span className="hidden sm:inline">HIGHLIGHT</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setShowWorkBoard((v) => !v);
              }}
              className={`retro-btn text-xs font-tech flex items-center ${
                showWorkBoard || workBoardCount > 0
                  ? 'border-emerald-600 text-emerald-300'
                  : 'border-zinc-700 text-zinc-300 hover:border-emerald-500'
              }`}
              title="Toggle persistent Work Board side panel for pinning & linking evidence fragments"
            >
              <Pin className="w-3.5 h-3.5 mr-1.5 text-red-400" />
              <span className="hidden sm:inline">WORK BOARD</span>
              {workBoardCount > 0 && (
                <span className="ml-1 px-1.5 py-0 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] rounded">
                  {workBoardCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setShowLedger((v) => !v);
              }}
              className={`retro-btn text-xs font-tech flex items-center ${
                showLedger
                  ? 'border-blue-500 text-blue-300'
                  : 'border-zinc-700 text-zinc-300 hover:border-blue-500'
              }`}
              title="Toggle Investigative Ledger sidebar showing persistent activity log and progress"
            >
              <ClipboardList className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              <span className="hidden sm:inline">LEDGER</span>
              {ledgerCount > 0 && (
                <span className="ml-1 px-1.5 py-0 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] rounded">
                  {ledgerCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setIsPrintModalOpen(true);
              }}
              className="retro-btn text-xs font-tech flex items-center border-zinc-500 text-zinc-100 hover:border-amber-500"
              title="Open retro physical document feed printer"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">PRINT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Case Header Hero Banner */}
      <div className="bg-[#090b0e] border-b border-[#2d333b] relative overflow-hidden">
        {caseData.bannerImageUrl && (
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <img
              src={caseData.bannerImageUrl}
              alt=""
              className="w-full h-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#090b0e]/90 via-[#090b0e] to-[#090b0e]" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-wrap items-center gap-2 mb-3 font-tech text-xs">
            <span className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-300 font-pixel text-[10px] uppercase">
              {caseData.caseNumber}
            </span>
            <span
              className={`text-[10px] font-pixel py-0.5 px-2 border ${
                isUnsolved
                  ? 'bg-red-950 text-red-300 border-red-700'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
              }`}
            >
              STATUS: {caseData.status}
            </span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-amber-400 font-semibold">{caseData.category}</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-400 flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-zinc-500" />
              {caseData.year}
            </span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-400 flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-zinc-500" />
              {caseData.location}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-zinc-100 font-editorial mb-2 tracking-tight">
            {caseData.title}
          </h1>

          {caseData.subtitle && (
            <p className="text-sm sm:text-base font-serif italic text-zinc-300 max-w-4xl mb-4 leading-relaxed">
              {caseData.subtitle}
            </p>
          )}

          {/* Content Warnings Banner */}
          {caseData.contentWarnings && caseData.contentWarnings.length > 0 && (
            <div className="p-3 bg-black/60 border border-[#2d333b] max-w-3xl flex items-start space-x-2.5">
              <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs text-zinc-300 font-tech leading-relaxed">
                <span className="font-pixel text-amber-400 mr-2 text-[10px]">NOTICE:</span>
                Factual investigative documentation based on public records and court dockets.
                <span className="text-zinc-400 block mt-0.5">
                  Subjects addressed: {caseData.contentWarnings.join(' &bull; ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main 9-Chapter Investigation Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Interactive Case Experience Quick-Switch Toolbar */}
        <div className="bg-[#10141b] border-2 border-zinc-800 rounded p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xl">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-300 font-pixel text-[10px] tracking-wider uppercase">
              CASE INVESTIGATIVE WORKBENCH
            </span>
            <span className="text-zinc-500 hidden sm:inline">|</span>
            <span className="text-zinc-400 text-xs hidden md:inline">
              Every case features its own evidence pinboard, chrono recon, interviews & documents
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setShowInteractiveSuite(false);
              }}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 border ${
                !showInteractiveSuite
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-zinc-300" />
              <span>9-CHAPTER DOSSIER</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setInteractiveSuiteView('pinboard');
                setShowInteractiveSuite(true);
              }}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 border ${
                showInteractiveSuite && interactiveSuiteView === 'pinboard'
                  ? 'bg-zinc-800 text-phosphor border-zinc-600 font-bold shadow-[0_0_8px_rgba(74,222,128,0.3)]'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Pin className="w-3.5 h-3.5 text-red-500" />
              <span>EVIDENCE PINBOARD</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setInteractiveSuiteView('timeline');
                setShowInteractiveSuite(true);
              }}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 border ${
                showInteractiveSuite && interactiveSuiteView === 'timeline'
                  ? 'bg-zinc-800 text-blue-400 border-zinc-600 font-bold shadow-[0_0_8px_rgba(96,165,250,0.3)]'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>CHRONO RECON</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setInteractiveSuiteView('documents');
                setShowInteractiveSuite(true);
              }}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 border ${
                showInteractiveSuite && interactiveSuiteView === 'documents'
                  ? 'bg-zinc-800 text-indigo-400 border-zinc-600 font-bold shadow-[0_0_8px_rgba(129,140,248,0.3)]'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>DOCUMENTS</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setInteractiveSuiteView('interviews');
                setShowInteractiveSuite(true);
              }}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 border ${
                showInteractiveSuite && interactiveSuiteView === 'interviews'
                  ? 'bg-zinc-800 text-amber-400 border-zinc-600 font-bold shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>INTERVIEWS</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setInteractiveSuiteView('media');
                setShowInteractiveSuite(true);
              }}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 border ${
                showInteractiveSuite && interactiveSuiteView === 'media'
                  ? 'bg-zinc-800 text-amber-300 border-zinc-600 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>MEDIA VAULT</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setInteractiveSuiteView('exercise');
                setShowInteractiveSuite(true);
              }}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 border ${
                showInteractiveSuite && interactiveSuiteView === 'exercise'
                  ? 'bg-zinc-800 text-emerald-400 border-zinc-600 font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>DECISION LAB</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyClick();
                window.dispatchEvent(
                  new CustomEvent('docket_open_studio', {
                    detail: { tab: 'add_media', caseSlug: caseData.slug },
                  })
                );
              }}
              className="px-2.5 py-1 rounded flex items-center space-x-1 border bg-emerald-950/60 text-emerald-200 border-emerald-700 hover:bg-emerald-900/60 font-bold"
              title="Add videos or audio files to this case"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ VIDEO / AUDIO</span>
            </button>
          </div>
        </div>

        {/* Investigator Sticky Notes Index Drawer (accessible in both dossier and suite views) */}
        <StickyNotesIndexDrawer
          isOpen={showStickyIndex}
          onClose={() => setShowStickyIndex(false)}
          caseSlug={caseData.slug}
          notes={stickyNotes}
          onJumpToNote={handleJumpToStickyNote}
        />

        {/* Persistent Split Layout: Main Investigation Area + Side-Panel Work Board */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div ref={mainContentRef} className="flex-1 min-w-0 w-full space-y-6">
            {/* If Interactive Suite is Active, render CaseInteractiveExperience */}
            {showInteractiveSuite ? (
              <CaseInteractiveExperience
                caseData={caseData}
                activeView={interactiveSuiteView}
                initialDocumentId={requestedDocumentId}
                onClose={() => setShowInteractiveSuite(false)}
              />
            ) : (
              <>
            {/* Prosecutorial Case Audit Status Banner */}
            <div className="p-3 bg-red-950/30 border border-red-800/70 rounded flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-md">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-pixel text-[10px] text-red-300 uppercase tracking-wider">
                  PROSECUTION AUDIT DOCKET // CASE RECORD {caseData.caseNumber}
                </span>
                <span className="text-zinc-600 hidden sm:inline">&bull;</span>
                <span className="text-zinc-400 text-[11px] hidden md:inline">
                  GATHERING EVIDENCE & TESTIMONIAL AUDIT FOR PROSECUTION RECORD
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-tech">
                <div className="flex items-center space-x-2">
                  <span className="text-zinc-400">READ:</span>
                  <span className="font-mono text-zinc-200 font-bold">{visitedStages.size}/9</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-zinc-400">LEGAL AUDITS VERIFIED:</span>
                  <span className="font-mono text-phosphor font-bold">{verifiedAudits.size} / 9</span>
                  <div className="w-24 h-1.5 bg-black border border-zinc-700">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(verifiedAudits.size / 9) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Cross-Reference Hint Strip */}
            <div className="px-3 py-1.5 bg-[#0a0d12] border border-zinc-800/80 rounded flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
              <span>
                TIP: Dotted highlights (<span className="border-b border-dotted border-emerald-500 text-emerald-300">Exhibits</span>,{' '}
                <span className="border-b border-dotted border-red-500 text-red-300">Subjects</span>,{' '}
                <span className="border-b border-dotted border-amber-500 text-amber-300">Legal Doctrines</span>) are live cross-references. Highlight any passage &amp; click{' '}
                <strong className="text-amber-300">+ STICKY NOTE</strong> on a section to annotate it.
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playKeyClick();
                    setShowStickyIndex((v) => !v);
                  }}
                  className="text-amber-400 hover:text-amber-200 text-[10px] font-bold flex items-center space-x-1"
                >
                  <StickyNote className="w-3 h-3" />
                  <span>{showStickyIndex ? 'HIDE STICKY NOTES' : `STICKY NOTES (${stickyNotes.length})`}</span>
                </button>
                {activeCrossRef && (
                  <button
                    type="button"
                    onClick={() => setActiveCrossRef(null)}
                    className="text-amber-400 hover:text-amber-200 text-[10px]"
                  >
                    CLEAR INSPECTOR
                  </button>
                )}
              </div>
            </div>

            {/* Cross-reference clear & notes quick-toggle already in strip above */}

            {/* Inline Cross-Reference Quick-Inspect Drawer */}
            {activeCrossRef && (
              <div className="p-4 bg-[#090d14] border-2 border-amber-600/80 rounded shadow-2xl space-y-2 dossier-chapter-enter">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="font-pixel text-[10px] text-amber-400 uppercase">
                      CROSS-REFERENCE INSPECTOR //{' '}
                      {activeCrossRef.kind === 'evidence'
                        ? `EXHIBIT ${activeCrossRef.item.exhibitNumber}`
                        : activeCrossRef.kind === 'poi'
                        ? `SUBJECT: ${activeCrossRef.item.status.toUpperCase()}`
                        : `JUDICIAL DOCTRINE`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyClick();
                      setActiveCrossRef(null);
                    }}
                    className="text-zinc-400 hover:text-zinc-100 p-0.5"
                    aria-label="Close cross-reference inspector"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {activeCrossRef.kind === 'evidence' && (
                  <div className="space-y-1.5 text-xs font-tech">
                    <div className="font-bold text-emerald-300 text-sm">
                      {activeCrossRef.item.title}
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{activeCrossRef.item.description}</p>
                    <div className="text-[11px] text-zinc-400">
                      <strong className="text-zinc-200">Forensic Significance:</strong>{' '}
                      {activeCrossRef.item.significance}
                    </div>
                  </div>
                )}

                {activeCrossRef.kind === 'poi' && (
                  <div className="space-y-1.5 text-xs font-tech">
                    <div className="font-bold text-red-300 text-sm">
                      {activeCrossRef.item.name} &mdash; {activeCrossRef.item.role}
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      {activeCrossRef.item.verifiedFindings || activeCrossRef.item.background}
                    </p>
                    <div className="text-[11px] text-zinc-400">
                      <strong className="text-zinc-200">Legal Disposition:</strong>{' '}
                      {activeCrossRef.item.outcome}
                    </div>
                  </div>
                )}

                {activeCrossRef.kind === 'doctrine' && (
                  <div className="space-y-1.5 text-xs font-tech">
                    <div className="font-bold text-amber-300 text-sm">
                      {activeCrossRef.item.term} &mdash;{' '}
                      <span className="font-mono text-xs text-zinc-400">
                        {activeCrossRef.item.citation}
                      </span>
                    </div>
                    <p className="text-zinc-200 leading-relaxed">{activeCrossRef.item.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Evidence-Dated Chronology Scrubber */}
            <EvidenceTimelineScrubber
              caseData={caseData}
              onInspectEvidence={() => handleChapterChange(3)}
              onOpenEvidenceBoard={() => {
                setInteractiveSuiteView('pinboard');
                setShowInteractiveSuite(true);
              }}
            />

            {/* Dedicated MP3 Audio Evidence Waveform Player */}
            <AudioEvidence caseData={caseData} />

            {/* In-Document Search & Multi-Term Highlighter Bar */}
            {showHighlighter && (
              <DocumentSearchHighlighterBar
                config={highlightConfig}
                onChange={setHighlightConfig}
                containerRef={dossierHighlightRef}
                caseSlug={caseData.slug}
                caseNumber={caseData.caseNumber}
                syncKey={activeChapter}
                placeholder="Search & highlight terms across dossier chapters..."
                chapterHits={chapterMatchCounts}
                activeChapter={activeChapter}
                onSelectChapter={(idx) => handleChapterChange(idx)}
                onClose={() => setShowHighlighter(false)}
              />
            )}

            {/* Horizontal Chapter Navigation Bar */}
            <div className="retro-window p-1 overflow-x-auto">
              <div className="flex items-center min-w-max space-x-1">
            {CHAPTERS.map((ch) => {
              const Icon = ch.icon;
              const isActive = activeChapter === ch.index;
              const isAudited = verifiedAudits.has(ch.index);

              return (
                <button
                  key={ch.id}
                  onClick={() => handleChapterChange(ch.index)}
                  className={`px-3 py-1.5 text-xs font-tech tracking-wide flex items-center space-x-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-950 text-red-200 border border-red-700 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-zinc-600'}`} />
                  <span>{ch.title}</span>
                  {isAudited && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Chapter Container */}
        <DocumentHighlightProvider value={highlightConfig}>
          <div ref={dossierHighlightRef} className="space-y-6">
        <div className="retro-window p-6 sm:p-8">
          {/* Chapter 01: Case Introduction */}
          {activeChapter === 0 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#2d333b] pb-3 flex items-center justify-between">
                <div>
                  <span className="font-pixel text-[11px] text-red-400 font-bold">SECTION 01</span>
                  <h2 className="text-xl font-bold font-editorial text-zinc-100">
                    Case Introduction & Circumstances
                  </h2>
                </div>
                <div className="text-xs font-tech text-zinc-500">
                  DOCKET_SERIAL: {caseData.caseNumber}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div data-sticky-section="ch0-background" className="bg-[#0b0e11] p-4 border border-[#21262d]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="font-pixel text-[11px] text-amber-400 uppercase">
                      Case Background & Setting
                    </h4>
                    {renderSectionStickyControl('ch0-background')}
                  </div>
                  <p className="text-xs font-tech text-zinc-300 leading-relaxed mb-3">
                    <DossierCrossRefText
                      text={caseData.overview.background}
                      caseData={caseData}
                      onInspectRef={setActiveCrossRef}
                    />
                  </p>
                  <div className="pt-2 border-t border-[#21262d] text-xs font-tech text-zinc-400 space-y-1">
                    <div>
                      <strong className="text-zinc-300">Jurisdiction:</strong> {caseData.overview.jurisdiction}
                    </div>
                    <div>
                      <strong className="text-zinc-300">Initial Alert:</strong>{' '}
                      {caseData.overview.initialAlertDate}
                    </div>
                  </div>
                  {renderSectionStickyBody('ch0-background', 'Sec 01 · Case Background & Setting', 0)}
                </div>

                <div data-sticky-section="ch0-victim" className="bg-[#0b0e11] p-4 border border-[#21262d]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="font-pixel text-[11px] text-red-400 uppercase">
                      Victim Profile & Forensic Scope
                    </h4>
                    {renderSectionStickyControl('ch0-victim')}
                  </div>
                  <p className="text-xs font-tech text-zinc-300 leading-relaxed mb-3">
                    <DossierCrossRefText
                      text={caseData.overview.victimInfo}
                      caseData={caseData}
                      onInspectRef={setActiveCrossRef}
                    />
                  </p>
                  <div className="p-2.5 bg-black/60 border border-[#21262d] text-[11px] font-tech text-zinc-400">
                    <span className="font-bold text-emerald-400 block mb-0.5">
                      ACCURACY GUARANTEE:
                    </span>
                    Documented exclusively from public autopsy findings, coroner dockets, and verified investigatory files.
                  </div>
                  {renderSectionStickyBody('ch0-victim', 'Sec 01 · Victim Profile & Forensic Scope', 0)}
                </div>
              </div>

              <div data-sticky-section="ch0-synopsis" className="bg-[#0b0e11] p-5 border border-[#21262d]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-pixel text-xs text-zinc-300 uppercase">
                    Executive Dossier Synopsis
                  </h3>
                  {renderSectionStickyControl('ch0-synopsis')}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-tech whitespace-pre-line">
                  <DossierCrossRefText
                    text={caseData.summary}
                    caseData={caseData}
                    onInspectRef={setActiveCrossRef}
                  />
                </p>
                {renderSectionStickyBody('ch0-synopsis', 'Sec 01 · Executive Dossier Synopsis', 0)}
              </div>
            </div>
          )}

          {/* Chapter 02: The Incident */}
          {activeChapter === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#2d333b] pb-3">
                <span className="font-pixel text-[11px] text-red-400 font-bold">SECTION 02</span>
                <h2 className="text-xl font-bold font-editorial text-zinc-100">
                  The Incident: Chronological Narrative
                </h2>
              </div>

              <div data-sticky-section="ch1-narrative" className="bg-[#0b0e11] p-5 border border-[#21262d]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-pixel text-[11px] text-amber-400 uppercase">
                    Documented Factual Timeline
                  </h3>
                  {renderSectionStickyControl('ch1-narrative')}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-tech whitespace-pre-line">
                  <DossierCrossRefText
                    text={caseData.incident.narrative}
                    caseData={caseData}
                    onInspectRef={setActiveCrossRef}
                  />
                </p>
                {renderSectionStickyBody('ch1-narrative', 'Sec 02 · Documented Factual Timeline', 1)}
              </div>

              {/* Vertical Scanned Retro Timeline with loading animation and expanded reports */}
              <div className="pt-4 border-t border-[#21262d]">
                <CaseTimelineView caseData={caseData} />
              </div>
            </div>
          )}

          {/* Chapter 03: Initial Investigation */}
          {activeChapter === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#2d333b] pb-3">
                <span className="font-pixel text-[11px] text-red-400 font-bold">SECTION 03</span>
                <h2 className="text-xl font-bold font-editorial text-zinc-100">
                  Initial Investigation: Interviews & Procedures
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div data-sticky-section="ch2-developments" className="bg-[#0b0e11] p-4 border border-[#21262d]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="font-pixel text-[11px] text-amber-400 uppercase">
                      Investigative Developments & Field Work
                    </h4>
                    {renderSectionStickyControl('ch2-developments')}
                  </div>
                  <p className="text-xs font-tech text-zinc-300 leading-relaxed whitespace-pre-line">
                    <DossierCrossRefText
                      text={caseData.investigation.narrative}
                      caseData={caseData}
                      onInspectRef={setActiveCrossRef}
                    />
                  </p>
                  {renderSectionStickyBody('ch2-developments', 'Sec 03 · Investigative Developments', 2)}
                </div>

                <div className="space-y-3">
                  <div data-sticky-section="ch2-fd302" className="bg-[#0b0e11] p-4 border border-[#21262d]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-pixel text-[11px] text-red-400 uppercase">
                        FD-302 Interview Memoranda Summary
                      </h4>
                      {renderSectionStickyControl('ch2-fd302')}
                    </div>
                    <p className="text-xs font-tech text-zinc-400 leading-relaxed">
                      <DossierCrossRefText
                        text={caseData.investigation.interviewRecordsSummary}
                        caseData={caseData}
                        onInspectRef={setActiveCrossRef}
                      />
                    </p>
                    {renderSectionStickyBody('ch2-fd302', 'Sec 03 · FD-302 Interview Memoranda', 2)}
                  </div>

                  <div data-sticky-section="ch2-procedure" className="bg-[#0b0e11] p-4 border border-[#21262d]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-pixel text-[11px] text-zinc-400 uppercase">
                        Procedural & Evidence Notes
                      </h4>
                      {renderSectionStickyControl('ch2-procedure')}
                    </div>
                    <p className="text-xs font-tech text-zinc-400 leading-relaxed">
                      <DossierCrossRefText
                        text={caseData.investigation.procedureNotes}
                        caseData={caseData}
                        onInspectRef={setActiveCrossRef}
                      />
                    </p>
                    {renderSectionStickyBody('ch2-procedure', 'Sec 03 · Procedural & Evidence Notes', 2)}
                  </div>
                </div>
              </div>

              {/* Scanned Witness Statements & FD-302 Depositions */}
              <div className="pt-4 border-t border-[#21262d]">
                <CaseWitnessStatementsView caseData={caseData} />
              </div>

              {caseData.investigation.timeline && caseData.investigation.timeline.length > 0 && (
                <div>
                  <h3 className="font-pixel text-xs text-zinc-300 uppercase mb-3 flex items-center">
                    <Search className="w-3.5 h-3.5 mr-2 text-amber-500" />
                    Investigative Phase Milestones
                  </h3>
                  <div className="space-y-3 border-l-2 border-amber-950 ml-2 pl-4">
                    {caseData.investigation.timeline.map((ev, i) => (
                      <div key={i} className="bg-[#0b0e11] p-3.5 border border-[#21262d]">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="font-pixel text-[10px] text-amber-400 font-bold">
                            {ev.date}
                          </span>
                          {ev.source && (
                            <span className="text-[10px] font-tech text-zinc-500">
                              REF: {ev.source}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-zinc-200 mb-1">
                          <HighlightText text={ev.title} />
                        </h4>
                        <p className="text-xs text-zinc-400 font-tech leading-relaxed">
                          <HighlightText text={ev.description} />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chapter 04: Evidence Room */}
          {activeChapter === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <CaseEvidenceView
                caseData={caseData}
                onOpenEvidenceBoard={() => {
                  setInteractiveSuiteView('pinboard');
                  setShowInteractiveSuite(true);
                }}
              />
            </div>
          )}

          {/* Chapter 05: Persons of Interest */}
          {activeChapter === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <CasePersonsOfInterestView caseData={caseData} />
            </div>
          )}

          {/* Chapter 06: Investigative Breakthrough */}
          {activeChapter === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#2d333b] pb-3">
                <span className="font-pixel text-[11px] text-red-400 font-bold">SECTION 06</span>
                <h2 className="text-xl font-bold font-editorial text-zinc-100">
                  Investigative Breakthrough & Pivotal Developments
                </h2>
              </div>

              <div data-sticky-section="ch5-breakthrough" className="bg-[#0b0e11] p-5 border border-[#21262d]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-pixel text-[11px] text-amber-400 uppercase">
                    Turning Point Narrative
                  </h3>
                  {renderSectionStickyControl('ch5-breakthrough')}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-tech whitespace-pre-line">
                  <DossierCrossRefText
                    text={caseData.breakthrough.narrative}
                    caseData={caseData}
                    onInspectRef={setActiveCrossRef}
                  />
                </p>
                {renderSectionStickyBody('ch5-breakthrough', 'Sec 06 · Turning Point Narrative', 5)}
              </div>

              {caseData.breakthrough.turningPoints && caseData.breakthrough.turningPoints.length > 0 && (
                <div>
                  <h3 className="font-pixel text-xs text-zinc-300 uppercase mb-3 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                    Key Breakthrough Milestones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {caseData.breakthrough.turningPoints.map((tp, i) => (
                      <div key={i} className="bg-[#0b0e11] p-4 border border-[#21262d]">
                        <span className="font-pixel text-[10px] text-emerald-400 block mb-1">
                          {tp.date}
                        </span>
                        <h4 className="font-bold text-sm text-zinc-100 mb-1 font-editorial">
                          <HighlightText text={tp.title} />
                        </h4>
                        <p className="text-xs text-zinc-400 font-tech leading-relaxed">
                          <HighlightText text={tp.detail || tp.description} />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formal Investigative Findings Report */}
              <div className="pt-4 border-t border-[#21262d]">
                <CaseFindingsView caseData={caseData} />
              </div>
            </div>
          )}

          {/* Chapter 07: The Courtroom */}
          {activeChapter === 6 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <CaseCourtroomView caseData={caseData} />
            </div>
          )}

          {/* Chapter 08: The Verdict */}
          {activeChapter === 7 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#2d333b] pb-3">
                <span className="font-pixel text-[11px] text-red-400 font-bold">SECTION 08</span>
                <h2 className="text-xl font-bold font-editorial text-zinc-100">
                  The Verdict: Adjudication & Sentencing
                </h2>
              </div>

              <div data-sticky-section="ch7-verdict" className="bg-[#0b0e11] p-5 border border-red-900/60">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs font-tech">
                  <span className="retro-stamp text-[9px] py-0 px-2">JUDICIAL ORDER</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-zinc-400">Date: {caseData.verdict.verdictDate}</span>
                    {renderSectionStickyControl('ch7-verdict')}
                  </div>
                </div>

                <div className="text-base font-bold font-editorial text-zinc-100 mb-1">
                  <HighlightText text={caseData.verdict.pleaOrVerdict} />
                </div>

                <div className="text-xs font-tech text-amber-400 mb-3 font-bold">
                  Sentencing / Outcome: <HighlightText text={caseData.verdict.sentencing} />
                </div>

                <div className="pt-3 border-t border-[#21262d] text-xs text-zinc-300 font-tech leading-relaxed">
                  <span className="font-pixel text-[9px] text-zinc-500 uppercase block mb-1">
                    Appeals & Subsequent Rulings:
                  </span>
                  <DossierCrossRefText
                    text={caseData.verdict.appealsAndRulings}
                    caseData={caseData}
                    onInspectRef={setActiveCrossRef}
                  />
                </div>

                {caseData.verdict.unresolvedLegalQuestions && (
                  <div className="mt-3 p-2.5 bg-black/60 border border-amber-900/50 text-xs text-amber-300 font-tech">
                    <strong>UNRESOLVED QUESTIONS:</strong>{' '}
                    <HighlightText text={caseData.verdict.unresolvedLegalQuestions} />
                  </div>
                )}

                {renderSectionStickyBody('ch7-verdict', 'Sec 08 · Judicial Order & Sentencing', 7)}
              </div>

              {/* Cold Case Working Theory Lab */}
              {(caseData.status === 'Cold Case / Unresolved' || caseData.status === 'Active Investigation') && (
                <div className="pt-4 border-t border-[#21262d]">
                  <CaseColdCaseTheoryLab caseData={caseData} />
                </div>
              )}
            </div>
          )}

          {/* Chapter 09: Aftermath */}
          {activeChapter === 8 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#2d333b] pb-3">
                <span className="font-pixel text-[11px] text-red-400 font-bold">SECTION 09</span>
                <h2 className="text-xl font-bold font-editorial text-zinc-100">
                  Aftermath: Public Impact & Precedent
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div data-sticky-section="ch8-reforms" className="bg-[#0b0e11] p-4 border border-[#21262d]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="font-pixel text-[10px] text-emerald-400 uppercase">
                      Legislative & Procedural Reforms
                    </h4>
                    {renderSectionStickyControl('ch8-reforms')}
                  </div>
                  <ul className="space-y-1.5 text-xs font-tech text-zinc-300">
                    {caseData.aftermath.legalReforms.map((lr, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0 mt-0.5" />
                        <span>
                          <HighlightText text={lr} />
                        </span>
                      </li>
                    ))}
                  </ul>
                  {renderSectionStickyBody('ch8-reforms', 'Sec 09 · Legislative & Procedural Reforms', 8)}
                </div>

                <div data-sticky-section="ch8-legacy" className="bg-[#0b0e11] p-4 border border-[#21262d] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-pixel text-[10px] text-amber-400 uppercase">
                      Institutional & Systemic Legacy
                    </h4>
                    {renderSectionStickyControl('ch8-legacy')}
                  </div>
                  <p className="text-xs text-zinc-300 font-tech leading-relaxed">
                    <HighlightText text={caseData.aftermath.institutionalImpact} />
                  </p>

                  <div>
                    <h4 className="font-pixel text-[10px] text-red-400 uppercase mb-1">
                      Victim Advocacy & Memorialization
                    </h4>
                    <p className="text-xs text-zinc-300 font-tech leading-relaxed">
                      <HighlightText text={caseData.aftermath.victimAdvocacy} />
                    </p>
                  </div>
                  {renderSectionStickyBody('ch8-legacy', 'Sec 09 · Institutional & Systemic Legacy', 8)}
                </div>
              </div>

              <div className="bg-[#0b0e11] p-3 border border-[#21262d] text-xs font-tech text-zinc-400">
                <strong className="text-zinc-200">Current Incarceration / Case Status:</strong>{' '}
                <HighlightText text={caseData.aftermath.currentStatus} />
              </div>
            </div>
          )}

          {/* Active Chapter Legal Reasoning & Evidentiary Audit */}
          <ChapterAuditChallenge
            key={`${caseData.slug}-audit-${activeChapter}`}
            caseData={caseData}
            chapterIndex={activeChapter}
            isVerified={verifiedAudits.has(activeChapter)}
            onVerifyChapter={handleVerifyChapter}
          />

          {/* Bottom Chapter Pagination Controls */}
          <div className="mt-8 pt-4 border-t border-[#2d333b] flex items-center justify-between">
            <button
              onClick={() => handleChapterChange(Math.max(0, activeChapter - 1))}
              disabled={activeChapter === 0}
              className={`retro-btn text-xs font-tech ${
                activeChapter === 0 ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              &larr; PREVIOUS CHAPTER
            </button>

            <span className="text-xs font-pixel text-zinc-500">
              CHAPTER {activeChapter + 1} OF 9
            </span>

            <button
              onClick={() => handleChapterChange(Math.min(8, activeChapter + 1))}
              disabled={activeChapter === 8}
              className={`retro-btn text-xs font-tech ${
                activeChapter === 8
                  ? 'opacity-30 cursor-not-allowed'
                  : 'border-red-700 text-red-200 font-bold'
              }`}
            >
              NEXT CHAPTER &rarr;
            </button>
          </div>
        </div>

        {/* Reader Reflection Questions & Ethical Analysis */}
        {caseData.reflectionPrompts && caseData.reflectionPrompts.length > 0 && (
          <div className="mt-8 retro-window p-6">
            <div className="flex items-center space-x-2 mb-3">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <h3 className="font-pixel text-xs uppercase font-bold text-zinc-200">
                {isUnsolved
                  ? 'COLD CASE INVESTIGATIVE QUESTIONS & THEORY INQUIRY'
                  : 'LEGAL, PROCEDURAL & PRECEDENT ANALYSIS'}
              </h3>
            </div>
            <p className="text-xs font-tech text-zinc-400 mb-4">
              {isUnsolved
                ? 'Review documented unsolved investigative questions from public filings. Any user hypotheses formulated are investigative theories, not judicial findings:'
                : 'Audited legal precedents, constitutional questions, and procedural standards established through this prosecution and subsequent judicial appeals:'}
            </p>

            <div className="space-y-2">
              {caseData.reflectionPrompts.map((rp, i) => {
                const isExpanded = expandedReflectionIndex === i;
                return (
                  <div
                    key={i}
                    className="border border-[#21262d] bg-[#090b0d] overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        soundEngine.playKeyClick();
                        setExpandedReflectionIndex(isExpanded ? null : i);
                      }}
                      className="w-full text-left p-3 flex items-center justify-between text-xs font-tech text-zinc-200 hover:text-amber-400"
                    >
                      <span className="font-bold">PROMPT 0{i + 1}: {rp.question}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-[#21262d] text-xs space-y-1.5 font-tech">
                        <div className="text-zinc-300">
                          <strong className="text-zinc-400 font-pixel text-[10px]">Context:</strong> {rp.context}
                        </div>
                        <div className="text-amber-300">
                          <strong className="text-zinc-400 font-pixel text-[10px]">Legal/Ethical Issue:</strong>{' '}
                          {rp.legalOrEthicalIssue}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Source Citations & References */}
        {caseData.citations && caseData.citations.length > 0 && (
          <div className="mt-6 retro-window p-5 text-xs font-tech">
            <h4 className="text-amber-400 font-pixel text-[10px] uppercase mb-2">
              AUDITED PUBLIC RECORD CITATIONS & TRANSCRIPTS
            </h4>
            <div className="space-y-1.5">
              {caseData.citations.map((cit, i) => (
                <div key={i} className="flex items-start space-x-2 text-zinc-400">
                  <span className="text-zinc-600 font-mono">[{i + 1}]</span>
                  <div className="flex-1">
                    <span className="text-zinc-200 font-semibold">
                      <HighlightText text={cit.title} />
                    </span>{' '}
                    &mdash; <HighlightText text={cit.source} />{' '}
                    {cit.date && <span className="text-zinc-500">({cit.date})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>
        </DocumentHighlightProvider>
          </>
        )}
          </div>

          {(showWorkBoard || showLedger) && (
            <div className="w-full lg:w-[360px] xl:w-[390px] shrink-0 lg:sticky lg:top-16 lg:self-start z-30 space-y-4 lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto pr-0.5">
              {showWorkBoard && (
                <WorkBoardSidePanel
                  caseSlug={caseData.slug}
                  caseNumber={caseData.caseNumber}
                  isOpen={showWorkBoard}
                  onClose={() => setShowWorkBoard(false)}
                  onOpenFullEvidenceBoard={() => {
                    soundEngine.playKeyClick();
                    setInteractiveSuiteView('pinboard');
                    setShowInteractiveSuite(true);
                  }}
                />
              )}

              {showLedger && (
                <InvestigativeLedgerSidebar
                  caseSlug={caseData.slug}
                  caseNumber={caseData.caseNumber}
                  caseTitle={caseData.title}
                  isOpen={showLedger}
                  chaptersReadCount={visitedStages.size}
                  auditsVerifiedCount={verifiedAudits.size}
                  onClose={() => setShowLedger(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Clickable & Draggable 'Pin to Board' Selection Pill */}
      {selectionPinPrompt && (
        <div
          data-pin-selection-popover="true"
          style={{
            top: `${selectionPinPrompt.top}px`,
            left: `${selectionPinPrompt.left}px`,
            transform: 'translateX(-50%)',
          }}
          className="fixed z-50 flex items-center space-x-1.5 bg-[#0b1017] border-2 border-amber-500 rounded px-2 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.85)] font-mono text-[11px]"
        >
          <button
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                DOCKET_PIN_DRAG_MIME,
                JSON.stringify({
                  text: selectionPinPrompt.text,
                  sourceLabel: selectionPinPrompt.sourceLabel,
                  kind: 'fragment',
                  tone: 'amber',
                })
              );
              e.dataTransfer.setData('text/plain', selectionPinPrompt.text);
              e.dataTransfer.effectAllowed = 'copy';
              if (!showWorkBoard) {
                setShowWorkBoard(true);
              }
            }}
            onClick={() => {
              soundEngine.playBootBeep();
              addWorkBoardPin(caseData.slug, {
                caseNumber: caseData.caseNumber,
                text: selectionPinPrompt.text,
                sourceLabel: selectionPinPrompt.sourceLabel,
                kind: 'fragment',
                tone: 'amber',
              });
              setShowWorkBoard(true);
              setSelectionPinPrompt(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="flex items-center space-x-1.5 text-amber-300 hover:text-emerald-300 font-bold cursor-grab active:cursor-grabbing"
            title="Click to pin fragment or drag directly onto Work Board"
          >
            <Pin className="w-3.5 h-3.5 text-red-500" />
            <span>PIN TO BOARD</span>
          </button>
          <span className="text-zinc-600">|</span>
          <span className="text-[10px] text-zinc-400 max-w-[120px] truncate hidden sm:inline">
            &ldquo;{selectionPinPrompt.text}&rdquo;
          </span>
          <button
            type="button"
            onClick={() => setSelectionPinPrompt(null)}
            className="text-zinc-500 hover:text-zinc-200 pl-0.5"
            aria-label="Dismiss Pin to Board"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Minimalist Retro Tractor-Feed Physical Print Dialog */}
      <RetroPrintFeedModal
        caseData={caseData}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
