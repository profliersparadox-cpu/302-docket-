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
} from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { CaseEvidenceBoardView } from './CaseEvidenceBoardView.tsx';
import { CaseTimelineView } from './CaseTimelineView.tsx';
import { CaseMediaVaultView } from './CaseMediaVaultView.tsx';
import { CaseColdCaseTheoryLab } from './CaseColdCaseTheoryLab.tsx';

interface CaseInteractiveExperienceProps {
  caseData: CaseFile;
  activeView?: 'pinboard' | 'timeline' | 'documents' | 'interviews' | 'exercise' | 'media' | 'radar';
  onClose?: () => void;
}

export const CaseInteractiveExperience: React.FC<CaseInteractiveExperienceProps> = ({
  caseData,
  activeView: initialView = 'pinboard',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pinboard' | 'timeline' | 'documents' | 'interviews' | 'exercise' | 'media' | 'radar'>(initialView);

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
    if (caseData.documents && caseData.documents.length > 0) {
      return caseData.documents;
    }
    // Generate dynamic documents from caseData citations, evidence, and autopsy
    const docs: ArchiveDocument[] = [];

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
  }, [caseData]);

  const [selectedDocId, setSelectedDocId] = useState<string>(caseDocuments[0]?.id || '');
  const [docZoom, setDocZoom] = useState<number>(100);
  const [revealDocRedactions, setRevealDocRedactions] = useState<boolean>(false);
  const activeDocument = caseDocuments.find((d) => d.id === selectedDocId) || caseDocuments[0];

  // --------------------------------------------------------------------------
  // 4. INTERVIEWS & TRANSCRIPTS STATE
  // --------------------------------------------------------------------------
  const caseInterviews: InterviewRecord[] = React.useMemo(() => {
    if (caseData.interviews && caseData.interviews.length > 0) {
      return caseData.interviews;
    }
    // Generate dynamic interviews from keyTestimonies and interviewRecordsSummary
    const interviews: InterviewRecord[] = [];

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
  }, [caseData]);

  const [selectedInterviewId, setSelectedInterviewId] = useState<string>(caseInterviews[0]?.id || '');
  const [isPlayingTape, setIsPlayingTape] = useState(false);
  const activeInterview = caseInterviews.find((i) => i.id === selectedInterviewId) || caseInterviews[0];

  // --------------------------------------------------------------------------
  // 5. INVESTIGATIVE EXERCISE / KNOWLEDGE ASSESSMENT
  // --------------------------------------------------------------------------
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedExerciseOption, setSelectedExerciseOption] = useState<number | null>(null);
  const [showExerciseDebrief, setShowExerciseDebrief] = useState(false);

  const activeReflection = caseData.reflectionPrompts?.[exerciseIndex] || {
    question: `What primary procedural challenge defines the investigation of ${caseData.title}?`,
    context: caseData.summary,
    legalOrEthicalIssue: 'The preservation of constitutional evidence integrity during complex investigative operations.',
  };

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
            <div className="flex-1 p-6 overflow-y-auto bg-zinc-950 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono text-xs">
                <span className="text-amber-400 font-bold">{activeDocument.title}</span>
                <button
                  onClick={() => {
                    soundEngine.playKeyClick();
                    setRevealDocRedactions((prev) => !prev);
                  }}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded flex items-center space-x-1.5"
                >
                  {revealDocRedactions ? <Eye className="w-3.5 h-3.5 text-red-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{revealDocRedactions ? 'REDACTIONS: VISIBLE' : 'REDACTIONS: MASKED'}</span>
                </button>
              </div>

              <div className="bg-[#0b0e12] border border-zinc-800 rounded p-6 font-typewriter text-xs text-zinc-300 leading-relaxed whitespace-pre-line shadow-inner">
                {activeDocument.documentBody}
              </div>

              <div className="text-xs font-mono text-zinc-500 border-t border-zinc-900 pt-2">
                CITING RECORD: {activeDocument.officialCitation}
              </div>
            </div>
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
            <div className="flex-1 p-6 overflow-y-auto bg-zinc-950 space-y-4 font-mono text-xs">
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-100">{activeInterview.title}</h4>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Interviewee: {activeInterview.interviewee} • Medium: {activeInterview.recordingMedium}
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundEngine.playKeyClick();
                    setIsPlayingTape((prev) => !prev);
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 rounded flex items-center space-x-1.5"
                >
                  {isPlayingTape ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{isPlayingTape ? 'PAUSE' : 'PLAY TAPE'}</span>
                </button>
              </div>

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
                      <span className={`px-1.5 py-0.2 rounded font-bold ${line.isDirectQuote ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {line.isDirectQuote ? 'VERIFIED QUOTE' : 'OFFICIAL SUMMARY'}
                      </span>
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
        {/* TAB 5: CASE-SPECIFIC THEORY LAB (COLD CASES) / METHODOLOGICAL LAB */}
        {/* ================================================================= */}
        {activeTab === 'exercise' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 font-mono text-xs">
            {caseData.status === 'Cold Case / Unresolved' || caseData.status === 'Active Investigation' ? (
              <CaseColdCaseTheoryLab caseData={caseData} />
            ) : (
              <div className="space-y-6">
                <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase tracking-widest block">
                      ETHICAL & LEGAL PRECEDENT ANALYSIS // ADJUDICATED CASE
                    </span>
                    <h3 className="text-base sm:text-lg font-bold font-editorial text-zinc-100">
                      {caseData.title}: Legal Principles & Casework Standards
                    </h3>
                  </div>
                  <div className="text-zinc-500 text-[11px]">
                    PRECEDENT {exerciseIndex + 1} OF {caseData.reflectionPrompts?.length || 1}
                  </div>
                </div>

                <div className="p-3 bg-black/60 border border-zinc-800 text-xs font-tech text-zinc-400">
                  <strong className="text-zinc-300">NOTE:</strong> This case was conclusively adjudicated in court. Real guilt was legally determined. The following review analyzes procedural ethics and evidentiary standards established by the prosecution.
                </div>

                {/* Scenario Card */}
                <div className="p-5 bg-zinc-900/90 border-2 border-zinc-800 rounded-lg space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">
                      CASEWORK CONTEXT & EVIDENCE PROBLEM:
                    </span>
                    <p className="text-zinc-200 text-xs sm:text-sm font-typewriter leading-relaxed">
                      {activeReflection.question}
                    </p>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      {activeReflection.context}
                    </p>
                  </div>

                  {/* Multiple Choice Decision Options */}
                  <div className="space-y-2 pt-2">
                    {[
                      {
                        id: 1,
                        text: 'Conduct high-resolution laboratory re-testing and audit physical chain of custody.',
                        isOptimal: true,
                        debrief: 'Optimal protocol: Scientific validation and evidence integrity audits reduce false leads and preserve admissibility under Daubert/Frye judicial standards.',
                      },
                      {
                        id: 2,
                        text: 'Prematurely release unconfirmed leads to public tip lines to accelerate arrest warrants.',
                        isOptimal: false,
                        debrief: 'Cognitive risk: Public disclosures without corroborating forensics risk witness taint and jury pool bias.',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          soundEngine.playKeyClick();
                          setSelectedExerciseOption(opt.id);
                          setShowExerciseDebrief(true);
                          if (opt.isOptimal) soundEngine.playBootBeep();
                          else soundEngine.playWarning();
                        }}
                        className={`w-full p-3.5 text-left rounded border transition-colors flex items-center justify-between ${
                          selectedExerciseOption === opt.id
                            ? opt.isOptimal
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                              : 'bg-red-950 border-red-500 text-red-200'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {selectedExerciseOption === opt.id && (
                          <span className="font-bold">
                            {opt.isOptimal ? '✓ OPTIMAL' : '✕ SUB-OPTIMAL'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Analytical Debriefing */}
                  {showExerciseDebrief && (
                    <div className="p-4 bg-zinc-950 border border-zinc-700 rounded space-y-2 animate-in fade-in">
                      <div className="text-amber-400 font-bold uppercase text-[10px]">
                        METHODOLOGICAL DEBRIEF & ETHICAL PRINCIPLE:
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-xs">
                        {activeReflection.legalOrEthicalIssue}
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
    </div>
  );
};
