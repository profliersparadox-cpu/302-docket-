import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  Clock,
  FileText,
  Mic,
  Award,
  Compass,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Maximize2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  Fingerprint,
  Play,
  Pause,
  ExternalLink,
  Target,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  CaseFile,
  EvidenceItem,
  PersonOfInterest,
  TimelineEvent,
  ArchiveDocument,
  InterviewRecord,
  InvestigativeExercise,
  EvidenceBoardItem,
  EvidenceConnection,
  GeoLocationPoint,
  MediaItem,
} from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { CaseEvidenceBoardView } from './CaseEvidenceBoardView.tsx';
import { CaseTimelineView } from './CaseTimelineView.tsx';
import { RetroAudioPlayer } from '../common/RetroAudioPlayer.tsx';
import { RetroPdfViewer } from '../common/RetroPdfViewer.tsx';
import { CaseMediaVaultView } from './CaseMediaVaultView.tsx';
import { CaseColdCaseTheoryLab } from './CaseColdCaseTheoryLab.tsx';
import { LegalDilemmaBench } from './LegalDilemmaBench.tsx';
import { DossierCrossRefText, CrossRefHit } from './DossierCrossRefText.tsx';
import { RetroPrintFeedModal } from '../common/RetroPrintFeedModal.tsx';
import {
  fetchAllMedia,
  isAudioMedia,
  isVideoMedia,
  isPdfMedia,
  convertMediaToDocument,
  MEDIA_UPDATED_EVENT,
} from '../../utils/mediaVault.ts';
import { Printer, Scale, BookOpen, X, StickyNote } from 'lucide-react';
import {
  DocumentStickyNote,
  loadStickyNotes,
  STICKY_NOTES_UPDATED_EVENT,
} from '../../utils/stickyNotes.ts';
import {
  SectionStickyTrigger,
  SectionStickyListAndComposer,
} from './SectionStickyAnchor.tsx';
import {
  DocumentHighlightProvider,
  DocumentHighlightConfig,
  HighlightText,
} from '../../context/DocumentHighlightContext.tsx';
import { DocumentSearchHighlighterBar } from './DocumentSearchHighlighterBar.tsx';
import { recordLedgerEvent } from '../../utils/investigativeLedger.ts';

interface CaseInteractiveExperienceProps {
  caseData: CaseFile;
  activeView?: 'pinboard' | 'timeline' | 'documents' | 'interviews' | 'exercise' | 'media' | 'radar';
  initialDocumentId?: string;
  onClose?: () => void;
}

export const CaseInteractiveExperience: React.FC<CaseInteractiveExperienceProps> = ({
  caseData,
  activeView: initialView = 'pinboard',
  initialDocumentId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pinboard' | 'timeline' | 'documents' | 'interviews' | 'exercise' | 'media' | 'radar'>(initialView);
  const [uploadedCaseMedia, setUploadedCaseMedia] = useState<MediaItem[]>([]);
  const [docStickyNotes, setDocStickyNotes] = useState<DocumentStickyNote[]>(() =>
    loadStickyNotes(caseData.slug)
  );
  const [openDocSectionComposer, setOpenDocSectionComposer] = useState<string | null>(null);
  const [docComposerExcerpt, setDocComposerExcerpt] = useState<string>('');
  const [docHighlightConfig, setDocHighlightConfig] = useState<DocumentHighlightConfig>({
    query: '',
    caseSensitive: false,
    wholeWord: false,
    pinnedTerms: [],
  });
  const docReadingPaneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(initialView);
  }, [initialView]);

  useEffect(() => {
    const tabLabels: Record<string, string> = {
      pinboard: 'Evidence Pinboard',
      timeline: 'Chrono Recon Timeline',
      documents: 'Case Documents Room',
      interviews: 'Interview & Testimony Tapes',
      exercise: 'Investigative Decision Lab',
      media: 'Media Vault',
      radar: 'Spatial Radar',
    };
    recordLedgerEvent(caseData.slug, {
      caseNumber: caseData.caseNumber,
      category: 'document_view',
      action: 'Opened Workspace View',
      subject: tabLabels[activeTab] || activeTab,
      dedupeKey: `suite-tab-${activeTab}`,
    });
  }, [activeTab, caseData.slug, caseData.caseNumber]);

  useEffect(() => {
    setDocStickyNotes(loadStickyNotes(caseData.slug));
    const onStickyUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.caseSlug === caseData.slug) {
        setDocStickyNotes(loadStickyNotes(caseData.slug));
      }
    };
    window.addEventListener(STICKY_NOTES_UPDATED_EVENT, onStickyUpdate);
    return () => window.removeEventListener(STICKY_NOTES_UPDATED_EVENT, onStickyUpdate);
  }, [caseData.slug]);

  useEffect(() => {
    const loadCaseMedia = async () => {
      try {
        const items = await fetchAllMedia(caseData.slug);
        setUploadedCaseMedia(items);
      } catch (err) {
        console.warn('Failed to fetch case uploaded media:', err);
      }
    };
    loadCaseMedia();
    window.addEventListener(MEDIA_UPDATED_EVENT, loadCaseMedia);
    return () => window.removeEventListener(MEDIA_UPDATED_EVENT, loadCaseMedia);
  }, [caseData.slug]);

  // --------------------------------------------------------------------------
  // 1. PINBOARD CANVAS STATE
  // --------------------------------------------------------------------------
  const [boardItems, setBoardItems] = useState<EvidenceBoardItem[]>(() => {
    // Generate board items dynamically from caseData.evidence and caseData.personsOfInterest
    const items: EvidenceBoardItem[] = [];
    let startX = 60;
    let startY = 50;

    // Map evidence items
    caseData.evidence.forEach((ev, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      items.push({
        id: `ev-${caseData.slug}-${ev.id || idx}`,
        title: ev.title,
        itemType: ev.type as any || 'physical',
        status: ev.classification === 'Confidential' ? 'Forensic Theory' : 'Established Fact',
        x: startX + col * 260,
        y: startY + row * 190,
        snippet: ev.description,
        source: ev.significance,
        date: ev.recoveredAt,
        caseSlug: caseData.slug,
        caseNumber: caseData.caseNumber,
        tags: [ev.type, ev.classification],
      });
    });

    // Map top persons of interest onto board as well
    caseData.personsOfInterest.slice(0, 3).forEach((poi, idx) => {
      items.push({
        id: `poi-${caseData.slug}-${poi.id || idx}`,
        title: `${poi.name} (${poi.role})`,
        itemType: 'suspect',
        status: poi.status === 'Convicted' || poi.status === 'Exonerated' ? 'Established Fact' : 'Documented Allegation',
        x: startX + idx * 260,
        y: startY + 400,
        snippet: poi.verifiedFindings || poi.background,
        source: poi.allegations || poi.outcome,
        caseSlug: caseData.slug,
        caseNumber: caseData.caseNumber,
        tags: [poi.role, poi.status],
      });
    });

    return items;
  });

  const [connections, setConnections] = useState<EvidenceConnection[]>(() => {
    if (caseData.evidenceConnections && caseData.evidenceConnections.length > 0) {
      return caseData.evidenceConnections;
    }
    // Default connecting lines between first few elements
    const conns: EvidenceConnection[] = [];
    if (boardItems.length >= 2) {
      conns.push({
        fromId: boardItems[0].id,
        toId: boardItems[1].id,
        label: 'Evidentiary Relationship',
        type: 'forensic_link',
      });
    }
    if (boardItems.length >= 3) {
      conns.push({
        fromId: boardItems[1].id,
        toId: boardItems[2].id,
        label: 'Investigation Sequence',
        type: 'timeline_sequence',
      });
    }
    return conns;
  });

  const [selectedBoardItem, setSelectedBoardItem] = useState<EvidenceBoardItem | null>(null);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const boardCanvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDownItem = (e: React.MouseEvent, item: EvidenceBoardItem) => {
    if (connectFromId) {
      if (connectFromId !== item.id) {
        soundEngine.playKeyClick();
        const exists = connections.some(
          (c) =>
            (c.fromId === connectFromId && c.toId === item.id) ||
            (c.fromId === item.id && c.toId === connectFromId)
        );
        let nextConns: EvidenceConnection[];
        if (exists) {
          nextConns = connections.filter(
            (c) =>
              !(
                (c.fromId === connectFromId && c.toId === item.id) ||
                (c.fromId === item.id && c.toId === connectFromId)
              )
          );
        } else {
          nextConns = [
            ...connections,
            {
              fromId: connectFromId,
              toId: item.id,
              label: 'Case Linkage',
              type: 'forensic_link',
            },
          ];
        }
        setConnections(nextConns);
      }
      setConnectFromId(null);
      return;
    }

    soundEngine.playKeyClick();
    setDraggingId(item.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMoveBoard = (e: React.MouseEvent) => {
    if (!draggingId || !boardCanvasRef.current) return;
    const canvasRect = boardCanvasRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(canvasRect.width - 240, e.clientX - canvasRect.left - dragOffset.x));
    const newY = Math.max(10, Math.min(canvasRect.height - 180, e.clientY - canvasRect.top - dragOffset.y));

    setBoardItems((prev) =>
      prev.map((it) => (it.id === draggingId ? { ...it, x: newX, y: newY } : it))
    );
  };

  const handleMouseUpBoard = () => {
    if (draggingId) setDraggingId(null);
  };

  // --------------------------------------------------------------------------
  // 2. TIMELINE RECONSTRUCTION STATE
  // --------------------------------------------------------------------------
  const allTimelineEvents = React.useMemo(() => {
    const list: {
      date: string;
      title: string;
      description: string;
      source?: string;
      classification: 'Confirmed Event' | 'Disputed Account' | 'Cold / Unknown Period';
    }[] = [];

    // Incident timeline
    caseData.incident.timeline?.forEach((ev) => {
      list.push({
        date: ev.date,
        title: ev.title,
        description: ev.description,
        source: ev.source || 'Incident Police Record',
        classification: 'Confirmed Event',
      });
    });

    // Investigation timeline
    caseData.investigation.timeline?.forEach((ev, idx) => {
      list.push({
        date: ev.date,
        title: ev.title,
        description: ev.description,
        source: ev.source || 'Investigative Log',
        classification: idx % 2 === 0 ? 'Confirmed Event' : 'Disputed Account',
      });
    });

    // Breakthrough turning points
    caseData.breakthrough.turningPoints?.forEach((tp) => {
      list.push({
        date: tp.date,
        title: tp.title,
        description: tp.detail || tp.description || '',
        source: 'Investigative Breakthrough Record',
        classification: 'Confirmed Event',
      });
    });

    // Courtroom timeline
    caseData.courtroom.trialTimeline?.forEach((tr) => {
      list.push({
        date: tr.date,
        title: tr.title,
        description: tr.description,
        source: caseData.courtroom.court,
        classification: 'Confirmed Event',
      });
    });

    return list;
  }, [caseData]);

  const [timelineIndex, setTimelineIndex] = useState(0);

  // --------------------------------------------------------------------------
  // 3. CASE DOCUMENTS STATE
  // --------------------------------------------------------------------------
  const caseDocuments: ArchiveDocument[] = React.useMemo(() => {
    const uploadedDocs = uploadedCaseMedia
      .filter((m) => isPdfMedia(m) || (!isAudioMedia(m) && !isVideoMedia(m) && !m.mimeType?.startsWith('image/')))
      .map((m) => convertMediaToDocument(m));

    if (caseData.documents && caseData.documents.length > 0) {
      return [...uploadedDocs, ...caseData.documents];
    }
    // Generate dynamic documents from caseData citations, evidence, and autopsy
    const docs: ArchiveDocument[] = [...uploadedDocs];

    docs.push({
      id: `doc-${caseData.slug}-01`,
      caseSlug: caseData.slug,
      caseNumber: caseData.caseNumber,
      title: `${caseData.caseNumber} // OFFICIAL INVESTIGATIVE OVERVIEW DOSSIER`,
      category: 'FD-302 Reports',
      date: `${caseData.year}`,
      classification: 'DOJ Investigative Summary',
      authorOrAgency: caseData.overview.jurisdiction || 'Primary Law Enforcement Agency',
      pageCount: 6,
      summary: caseData.summary,
      documentBody: `OFFICIAL CASE RECORD: ${caseData.caseNumber}
SUBJECT: ${caseData.title}
LOCATION: ${caseData.location} | YEAR: ${caseData.year}
STATUS: ${caseData.status}

I. CASE BACKGROUND:
${caseData.overview.background}

II. VICTIM INFORMATION & SCOPE:
${caseData.overview.victimInfo}

III. DOCUMENTED INCIDENT NARRATIVE:
${caseData.incident.narrative}

IV. INVESTIGATIVE SUMMARY & INTERVIEWS:
${caseData.investigation.interviewRecordsSummary}
${caseData.investigation.procedureNotes}

AUTHENTICATED DOCUMENT RECORD FILED UNDER BUREAU ARCHIVE PROTOCOLS.`,
      redactions: [
        {
          id: 'red-gen-01',
          label: 'ANONYMIZED WITNESS ID',
          redactedText: '[WITNESS PERSONAL CONTACT DETAILS MASKED PURSUANT TO PRIVACY DIRECTIVES]',
          reason: 'Witness privacy protection under judicial records confidentiality rules.',
        },
      ],
      officialCitation: caseData.citations?.[0]?.title || `${caseData.title} Judicial Records`,
    });

    if (caseData.citations && caseData.citations.length > 0) {
      caseData.citations.forEach((cit, i) => {
        docs.push({
          id: `doc-${caseData.slug}-cit-${i}`,
          caseSlug: caseData.slug,
          caseNumber: caseData.caseNumber,
          title: cit.title,
          category: 'Court Records',
          date: cit.date || `${caseData.year}`,
          classification: 'Official Court Record',
          authorOrAgency: cit.source,
          pageCount: 4,
          summary: `Primary judicial citation and public legal document filed in ${cit.source}.`,
          documentBody: `RECORD TITLE: ${cit.title}
SOURCE REPOSITORY: ${cit.source}
FILING DATE: ${cit.date || 'Historical Public Docket'}

OFFICIAL TRANSCRIPT EXCERPT:
${caseData.courtroom.prosecutionArgument || caseData.breakthrough.narrative}

VERDICT DISPOSITION:
${caseData.verdict.pleaOrVerdict} - ${caseData.verdict.sentencing}

APPELLATE RECORD:
${caseData.verdict.appealsAndRulings}`,
          redactions: [],
          officialCitation: `${cit.title} (${cit.source})`,
        });
      });
    }

    return docs;
  }, [caseData, uploadedCaseMedia]);

  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId || caseDocuments[0]?.id || '');
  const [docZoom, setDocZoom] = useState<number>(100);
  const [revealDocRedactions, setRevealDocRedactions] = useState<boolean>(false);
  const activeDocument = caseDocuments.find((d) => d.id === selectedDocId) || caseDocuments[0];

  useEffect(() => {
    if (initialDocumentId) {
      setSelectedDocId(initialDocumentId);
    }
  }, [initialDocumentId]);

  const toggleDocSectionSticky = (sectionId: string) => {
    if (openDocSectionComposer === sectionId) {
      setOpenDocSectionComposer(null);
      setDocComposerExcerpt('');
      return;
    }
    const sel = window.getSelection()?.toString().trim() || '';
    setDocComposerExcerpt(sel.slice(0, 240));
    setOpenDocSectionComposer(sectionId);
  };

  // --------------------------------------------------------------------------
  // 4. INTERVIEWS & TRANSCRIPTS STATE
  // --------------------------------------------------------------------------
  const uploadedAudioUrls = React.useMemo(() => {
    const map: Record<string, string> = {};
    uploadedCaseMedia
      .filter((m) => isAudioMedia(m) || isVideoMedia(m))
      .forEach((m) => {
        map[`int-upl-${m.id}`] = m.url;
      });
    return map;
  }, [uploadedCaseMedia]);

  const caseInterviews: InterviewRecord[] = React.useMemo(() => {
    const uploadedInterviews: InterviewRecord[] = uploadedCaseMedia
      .filter((m) => isAudioMedia(m) || isVideoMedia(m))
      .map((m) => ({
        id: `int-upl-${m.id}`,
        caseSlug: caseData.slug,
        caseNumber: caseData.caseNumber,
        title: m.title || m.originalName,
        interviewee: m.title || m.originalName,
        interviewer: 'Uploaded Case Audio Exhibit',
        date: m.uploadedAt.split('T')[0],
        location: m.originalName,
        recordingMedium: 'Magnetic Reel Audio',
        classification: 'Declassified FD-302',
        summary: m.description || `Uploaded MP3/Audio Recording (${m.originalName})`,
        transcripts: m.transcript
          ? m.transcript.split(/\n+/).filter(Boolean).map((line, i) => ({
              timestamp: `00:${(i * 15).toString().padStart(2, '0')}`,
              speaker: 'TRANSCRIPT LOG',
              speakerRole: 'Audio Recording',
              text: line,
              isDirectQuote: true,
            }))
          : [
              {
                timestamp: '00:00:00',
                speaker: 'ARCHIVE LOG',
                speakerRole: 'Uploaded Audio',
                text: m.description || `Audio recording (${m.originalName}) ready for playback.`,
                isDirectQuote: false,
              },
            ],
        sourceCitation: `Uploaded Archive Audio • ${m.originalName}`,
      }));

    if (caseData.interviews && caseData.interviews.length > 0) {
      return [...uploadedInterviews, ...caseData.interviews];
    }
    // Generate dynamic interviews from keyTestimonies and interviewRecordsSummary
    const interviews: InterviewRecord[] = [...uploadedInterviews];

    if (caseData.courtroom.keyTestimonies && caseData.courtroom.keyTestimonies.length > 0) {
      caseData.courtroom.keyTestimonies.forEach((t, idx) => {
        interviews.push({
          id: `int-${caseData.slug}-${idx}`,
          caseSlug: caseData.slug,
          caseNumber: caseData.caseNumber,
          title: `SWORN TESTIMONY & DEPOSITION // ${t.witness.toUpperCase()}`,
          interviewee: t.witness,
          interviewer: 'Examining Counsel / Investigator',
          date: caseData.courtroom.trialTimeline?.[0]?.date || `${caseData.year}`,
          location: caseData.courtroom.court,
          recordingMedium: 'Stenographic Deposition',
          classification: 'Judicial Deposition',
          summary: t.keyPoints,
          transcripts: [
            {
              timestamp: '00:10:00',
              speaker: 'COUNSEL',
              speakerRole: 'Examining Counsel',
              text: `State your name and role in the matter of ${caseData.title}.`,
              isDirectQuote: true,
            },
            {
              timestamp: '00:10:30',
              speaker: t.witness.toUpperCase(),
              speakerRole: t.role,
              text: t.keyPoints,
              isDirectQuote: true,
            },
            {
              timestamp: '00:25:00',
              speaker: 'INVESTIGATIVE NOTE',
              speakerRole: 'Official Transcript Record',
              text: `[SUMMARY] Witness ${t.witness} testified regarding pivotal forensic observations corroborating case documentation.`,
              isDirectQuote: false,
              editorialNote: 'Contemporaneous sworn courtroom transcript record.',
            },
          ],
          sourceCitation: `${caseData.courtroom.court} Stenographic Record Transcript`,
        });
      });
    } else {
      interviews.push({
        id: `int-${caseData.slug}-default`,
        caseSlug: caseData.slug,
        caseNumber: caseData.caseNumber,
        title: `FD-302 INTERVIEW MEMORANDUM // INVESTIGATIVE REVIEWS`,
        interviewee: 'Lead Field Investigator',
        interviewer: 'Supervisory Special Agent',
        date: caseData.overview.initialAlertDate || `${caseData.year}`,
        location: caseData.location,
        recordingMedium: 'Standard Cassette Tape',
        classification: 'Declassified FD-302',
        summary: caseData.investigation.interviewRecordsSummary,
        transcripts: [
          {
            timestamp: '09:00:00',
            speaker: 'LEAD DETECTIVE',
            speakerRole: 'Field Investigator',
            text: caseData.investigation.interviewRecordsSummary,
            isDirectQuote: true,
          },
        ],
        sourceCitation: `${caseData.overview.jurisdiction} Official Case Record`,
      });
    }

    return interviews;
  }, [caseData, uploadedCaseMedia]);

  const [selectedInterviewId, setSelectedInterviewId] = useState<string>(caseInterviews[0]?.id || '');
  const [isPlayingTape, setIsPlayingTape] = useState(false);
  const activeInterview = caseInterviews.find((i) => i.id === selectedInterviewId) || caseInterviews[0];

  // --------------------------------------------------------------------------
  // 5. INVESTIGATIVE EXERCISE / DECISION LAB STATE
  // --------------------------------------------------------------------------
  const [coldCaseLabMode, setColdCaseLabMode] = useState<'theory' | 'precedent'>('precedent');
  const [docCrossRef, setDocCrossRef] = useState<CrossRefHit | null>(null);
  const [printDocOpen, setPrintDocOpen] = useState(false);

  const printDocumentOverride = React.useMemo(() => {
    if (!activeDocument) return null;
    return {
      title: activeDocument.title,
      classification: activeDocument.classification,
      date: activeDocument.date,
      agency: activeDocument.authorOrAgency,
      body: activeDocument.documentBody,
      citation: activeDocument.officialCitation,
    };
  }, [activeDocument]);

  return (
    <div className="w-full bg-[#0a0d12] border-2 border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden text-zinc-300 font-tech">
      {/* Top Experience Navigation Toolbar */}
      <div className="bg-[#11141c] border-b border-[#2d3444] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-300 font-pixel text-[10px] tracking-wider uppercase">
            IMMERSIVE SUITE // {caseData.caseNumber}
          </div>
          <span className="text-zinc-500 hidden sm:inline">|</span>
          <span className="text-amber-400 font-bold font-mono text-xs truncate max-w-xs sm:max-w-md">
            {caseData.title}
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1 bg-zinc-950 p-1 border border-zinc-800 rounded text-xs font-mono">
          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setActiveTab('pinboard');
            }}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'pinboard'
                ? 'bg-zinc-800 text-phosphor border border-zinc-700 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EVIDENCE PINBOARD</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setActiveTab('timeline');
            }}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'timeline'
                ? 'bg-zinc-800 text-blue-400 border border-zinc-700 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CHRONO RECON</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setActiveTab('documents');
            }}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'documents'
                ? 'bg-zinc-800 text-indigo-400 border border-zinc-700 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DOCUMENTS</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setActiveTab('interviews');
            }}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'interviews'
                ? 'bg-zinc-800 text-amber-400 border border-zinc-700 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">INTERVIEWS</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setActiveTab('exercise');
            }}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'exercise'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {caseData.status === 'Cold Case / Unresolved' || caseData.status === 'Active Investigation'
                ? 'THEORY LAB'
                : 'ANALYSIS'}
            </span>
          </button>

          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setActiveTab('media');
            }}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'media'
                ? 'bg-zinc-800 text-amber-400 border border-zinc-700 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MEDIA VAULT</span>
          </button>
        </div>
      </div>

      {/* Main Tab Viewport */}
      <div className="min-h-[540px] flex flex-col bg-[#080b0f] relative overflow-hidden">
        {/* ================================================================= */}
        {/* TAB 1: INTERACTIVE EVIDENCE PINBOARD CANVAS FOR THIS CASE */}
        {/* ================================================================= */}
        {activeTab === 'pinboard' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <CaseEvidenceBoardView caseData={caseData} />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: CHRONOLOGICAL RECONSTRUCTION TIMELINE FOR THIS CASE */}
        {/* ================================================================= */}
        {activeTab === 'timeline' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <CaseTimelineView caseData={caseData} />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: CASE-SPECIFIC DOCUMENT ROOM */}
        {/* ================================================================= */}
        {activeTab === 'documents' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Doc Sidebar */}
            <div className="w-full md:w-72 bg-[#0e1116] border-r border-[#262c36] p-3 space-y-2 overflow-y-auto">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                CASE DOCUMENTS ({caseDocuments.length})
              </span>
              {caseDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    soundEngine.playFileAccess();
                    setSelectedDocId(doc.id);
                    recordLedgerEvent(caseData.slug, {
                      caseNumber: caseData.caseNumber,
                      category: 'document_view',
                      action: 'Viewed Document',
                      subject: doc.title,
                      detail: doc.classification,
                      dedupeKey: `doc-view-${doc.id}`,
                    });
                  }}
                  className={`w-full p-2.5 text-left rounded border font-mono text-xs transition-colors flex flex-col space-y-1 ${
                    doc.id === activeDocument.id
                      ? 'bg-zinc-800 border-red-500 text-zinc-100 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-[10px] text-amber-500 truncate">{doc.classification}</span>
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}
            </div>

            {/* Document Reading View */}
            <DocumentHighlightProvider value={docHighlightConfig}>
              <div
                ref={docReadingPaneRef}
                className="flex-1 p-6 overflow-y-auto bg-zinc-950 flex flex-col space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3 font-mono text-xs">
                  <span className="text-amber-400 font-bold">{activeDocument.title}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playKeyClick();
                        setPrintDocOpen(true);
                      }}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded flex items-center space-x-1.5"
                      title="Print document on retro physical feed"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>FEED PRINT</span>
                    </button>
                    <button
                      onClick={() => {
                        soundEngine.playKeyClick();
                        setRevealDocRedactions((prev) => {
                          const next = !prev;
                          if (next) {
                            recordLedgerEvent(caseData.slug, {
                              caseNumber: caseData.caseNumber,
                              category: 'milestone',
                              action: 'Unsealed Redactions',
                              subject: activeDocument.title,
                              dedupeKey: `unseal-doc-${activeDocument.id}`,
                            });
                          }
                          return next;
                        });
                      }}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded flex items-center space-x-1.5"
                    >
                      {revealDocRedactions ? <Eye className="w-3.5 h-3.5 text-red-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{revealDocRedactions ? 'REDACTIONS: VISIBLE' : 'REDACTIONS: MASKED'}</span>
                    </button>
                  </div>
                </div>

                {/* In-Document Search & Multi-Term Highlighter */}
                <DocumentSearchHighlighterBar
                  config={docHighlightConfig}
                  onChange={setDocHighlightConfig}
                  containerRef={docReadingPaneRef}
                  caseSlug={caseData.slug}
                  caseNumber={caseData.caseNumber}
                  syncKey={`${activeDocument.id}-${revealDocRedactions}`}
                  placeholder={`Search & highlight terms inside ${activeDocument.title}...`}
                />

              {docCrossRef && (
                <div className="p-3.5 bg-[#0a0f16] border border-amber-600/80 rounded space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                    <span className="text-[10px] font-pixel text-amber-400 flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>DOCUMENT CROSS-REFERENCE</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDocCrossRef(null)}
                      className="text-zinc-400 hover:text-zinc-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {docCrossRef.kind === 'evidence' && (
                    <div className="text-zinc-200 font-tech">
                      <strong className="text-emerald-300">{docCrossRef.item.title}:</strong>{' '}
                      {docCrossRef.item.description}
                    </div>
                  )}
                  {docCrossRef.kind === 'poi' && (
                    <div className="text-zinc-200 font-tech">
                      <strong className="text-red-300">{docCrossRef.item.name} ({docCrossRef.item.status}):</strong>{' '}
                      {docCrossRef.item.verifiedFindings || docCrossRef.item.background}
                    </div>
                  )}
                  {docCrossRef.kind === 'doctrine' && (
                    <div className="text-zinc-200 font-tech">
                      <strong className="text-amber-300">{docCrossRef.item.term} ({docCrossRef.item.citation}):</strong>{' '}
                      {docCrossRef.item.summary}
                    </div>
                  )}
                </div>
              )}

              {activeDocument.downloadUrl && isPdfMedia({ url: activeDocument.downloadUrl, originalName: activeDocument.title }) ? (
                <div className="space-y-4">
                  <RetroPdfViewer
                    key={activeDocument.id}
                    url={activeDocument.downloadUrl}
                    title={activeDocument.title}
                    caseNumber={activeDocument.caseNumber}
                    classification={activeDocument.classification}
                    date={activeDocument.date}
                    authorOrAgency={activeDocument.authorOrAgency}
                    description={activeDocument.summary}
                    transcript={activeDocument.documentBody}
                  />
                  {(() => {
                    const pdfSectionId = `doc-${activeDocument.id}-pdf`;
                    const pdfSectionLabel = `${activeDocument.title} (PDF Record)`;
                    const pdfNotes = docStickyNotes.filter((n) => n.sectionId === pdfSectionId);
                    return (
                      <div data-sticky-section={pdfSectionId} className="bg-[#0b0e12] border border-zinc-800 rounded p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-pixel text-[10px] text-amber-400 uppercase flex items-center space-x-1.5">
                            <StickyNote className="w-3.5 h-3.5" />
                            <span>DOCUMENT STICKY NOTES &amp; ANNOTATIONS</span>
                          </span>
                          <SectionStickyTrigger
                            count={pdfNotes.length}
                            isComposerOpen={openDocSectionComposer === pdfSectionId}
                            onToggleComposer={() => toggleDocSectionSticky(pdfSectionId)}
                          />
                        </div>
                        <SectionStickyListAndComposer
                          caseSlug={caseData.slug}
                          caseNumber={caseData.caseNumber}
                          targetType="document_section"
                          documentId={activeDocument.id}
                          sectionId={pdfSectionId}
                          sectionLabel={pdfSectionLabel}
                          notes={pdfNotes}
                          isComposerOpen={openDocSectionComposer === pdfSectionId}
                          onCloseComposer={() => setOpenDocSectionComposer(null)}
                          initialExcerpt={docComposerExcerpt}
                        />
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <>
                  <div className="bg-[#0b0e12] border border-zinc-800 rounded p-5 font-typewriter text-xs text-zinc-300 leading-relaxed shadow-inner space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80 text-[10px] font-mono text-zinc-400">
                      <span>
                        Highlight text or click <strong className="text-amber-300">+ STICKY NOTE</strong> on any document section below to place an annotation.
                      </span>
                      <span className="text-amber-400">
                        {docStickyNotes.filter((n) => n.documentId === activeDocument.id).length} notes on this document
                      </span>
                    </div>

                    {activeDocument.documentBody
                      .split(/\n{2,}/)
                      .map((chunk) => chunk.trim())
                      .filter(Boolean)
                      .map((sectionText, idx) => {
                        const secId = `doc-${activeDocument.id}-sec-${idx}`;
                        const firstLine = sectionText.split('\n')[0].slice(0, 48);
                        const secLabel = `${activeDocument.title.slice(0, 32)} · Sec ${idx + 1} (${firstLine})`;
                        const secNotes = docStickyNotes.filter((n) => n.sectionId === secId);

                        return (
                          <div
                            key={secId}
                            data-sticky-section={secId}
                            className="p-3 bg-black/35 border border-zinc-800/70 hover:border-zinc-700 rounded transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <span className="font-mono text-[10px] text-zinc-500 uppercase">
                                SECTION {String(idx + 1).padStart(2, '0')}
                              </span>
                              <SectionStickyTrigger
                                count={secNotes.length}
                                isComposerOpen={openDocSectionComposer === secId}
                                onToggleComposer={() => toggleDocSectionSticky(secId)}
                              />
                            </div>
                            <div className="whitespace-pre-line">
                              <DossierCrossRefText
                                text={sectionText}
                                caseData={caseData}
                                onInspectRef={setDocCrossRef}
                              />
                            </div>
                            <SectionStickyListAndComposer
                              caseSlug={caseData.slug}
                              caseNumber={caseData.caseNumber}
                              targetType="document_section"
                              documentId={activeDocument.id}
                              sectionId={secId}
                              sectionLabel={secLabel}
                              notes={secNotes}
                              isComposerOpen={openDocSectionComposer === secId}
                              onCloseComposer={() => setOpenDocSectionComposer(null)}
                              initialExcerpt={docComposerExcerpt}
                            />
                          </div>
                        );
                      })}
                  </div>

                  {activeDocument.redactions && activeDocument.redactions.length > 0 && (
                    <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded text-xs font-mono space-y-1">
                      {activeDocument.redactions.map((red) => (
                        <div key={red.id} className="text-zinc-400">
                          <span className="text-red-400 font-bold">[{red.label}]</span>{' '}
                          <HighlightText text={red.reason} />
                          {revealDocRedactions && (
                            <span className="block text-red-300 italic mt-0.5">
                              <HighlightText text={red.redactedText} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs font-mono text-zinc-500 border-t border-zinc-900 pt-2">
                    CITING RECORD: <HighlightText text={activeDocument.officialCitation} />
                  </div>
                </>
              )}
              </div>
            </DocumentHighlightProvider>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: CASE-SPECIFIC INTERVIEW VAULT */}
        {/* ================================================================= */}
        {activeTab === 'interviews' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Interview Reel Sidebar */}
            <div className="w-full md:w-72 bg-[#0e1116] border-r border-[#262c36] p-3 space-y-2 overflow-y-auto">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                RECORDED SESSIONS ({caseInterviews.length})
              </span>
              {caseInterviews.map((int) => (
                <button
                  key={int.id}
                  onClick={() => {
                    soundEngine.playFileAccess();
                    setSelectedInterviewId(int.id);
                  }}
                  className={`w-full p-2.5 text-left rounded border font-mono text-xs transition-colors flex flex-col space-y-1 ${
                    int.id === activeInterview.id
                      ? 'bg-zinc-800 border-amber-500 text-zinc-100 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-[10px] text-red-400 font-bold truncate">{int.interviewee}</span>
                  <span className="text-[10px] text-zinc-500 truncate">{int.recordingMedium}</span>
                </button>
              ))}
            </div>

            {/* Transcript & Reel View */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-zinc-950 space-y-4 font-mono text-xs">
              {/* Full Featured Audio Player for Interview Reel */}
              <RetroAudioPlayer
                key={activeInterview.id}
                url={uploadedAudioUrls[activeInterview.id] || ''}
                title={activeInterview.title}
                caseNumber={caseData.caseNumber}
                transcript={activeInterview.transcripts?.map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`).join('\n') || activeInterview.summary}
                mediaType="audio"
                defaultDuration={240}
                compact
              />

              {/* Transcript Lines */}
              <div className="space-y-3">
                {activeInterview.transcripts.map((line, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border ${
                      line.isDirectQuote ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-950/20 border-amber-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-zinc-500 font-bold">[{line.timestamp}] {line.speaker}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => soundEngine.speakTranscriptLine(line.text, line.speaker)}
                          title="Listen to this line via speech synthesizer"
                          className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 rounded text-[9px] flex items-center space-x-1"
                        >
                          <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                          <span>LISTEN</span>
                        </button>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${line.isDirectQuote ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {line.isDirectQuote ? 'VERIFIED QUOTE' : 'OFFICIAL SUMMARY'}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs ${line.isDirectQuote ? 'font-typewriter text-zinc-200' : 'text-zinc-300 italic'}`}>
                      {line.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: LEGAL DILEMMA BENCH & COLD CASE THEORY LAB */}
        {/* ================================================================= */}
        {activeTab === 'exercise' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 font-mono text-xs">
            {caseData.status === 'Cold Case / Unresolved' || caseData.status === 'Active Investigation' ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUnsealChord();
                      setColdCaseLabMode('precedent');
                    }}
                    className={`px-3 py-1.5 rounded border text-xs font-pixel flex items-center space-x-1.5 ${
                      coldCaseLabMode === 'precedent'
                        ? 'bg-amber-950/70 border-amber-500 text-amber-200 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>1. CONSTITUTIONAL &amp; EVIDENTIARY DILEMMAS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyClick();
                      setColdCaseLabMode('theory');
                    }}
                    className={`px-3 py-1.5 rounded border text-xs font-pixel flex items-center space-x-1.5 ${
                      coldCaseLabMode === 'theory'
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2. COLD CASE WORKING THEORY LAB</span>
                  </button>
                </div>

                {coldCaseLabMode === 'precedent' ? (
                  <LegalDilemmaBench caseData={caseData} />
                ) : (
                  <CaseColdCaseTheoryLab caseData={caseData} />
                )}
              </div>
            ) : (
              <LegalDilemmaBench caseData={caseData} />
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: PROSECUTORIAL AUDIO & MEDIA VAULT */}
        {/* ================================================================= */}
        {activeTab === 'media' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <CaseMediaVaultView caseData={caseData} />
          </div>
        )}
      </div>

      {/* Physical Document Feed Modal for Active Document */}
      {activeDocument && (
        <RetroPrintFeedModal
          caseData={caseData}
          isOpen={printDocOpen}
          onClose={() => setPrintDocOpen(false)}
          documentOverride={printDocumentOverride}
        />
      )}
    </div>
  );
};
