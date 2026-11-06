import React, { useState, useEffect } from 'react';
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
    soundEngine.playKeyClick();
    setActiveChapter(index);
    setVisitedStages((prev) => new Set(prev).add(index));
    if (caseData) {
      markChapterRead(caseData.id, index);
    }
    window.scrollTo({ top: 280, behavior: 'smooth' });
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
                window.print();
              }}
              className="retro-btn text-xs font-tech flex items-center"
              title="Print dossier summary"
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
          </div>
        </div>

        {/* If Interactive Suite is Active, render CaseInteractiveExperience */}
        {showInteractiveSuite ? (
          <CaseInteractiveExperience
            caseData={caseData}
            activeView={interactiveSuiteView}
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
              <div className="flex items-center space-x-3 text-xs font-tech">
                <span className="text-zinc-400">STAGES AUDITED:</span>
                <span className="font-mono text-phosphor font-bold">{visitedStages.size} / 9</span>
                <div className="w-24 h-1.5 bg-black border border-zinc-700">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(visitedStages.size / 9) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Horizontal Chapter Navigation Bar */}
            <div className="retro-window p-1 overflow-x-auto">
              <div className="flex items-center min-w-max space-x-1">
            {CHAPTERS.map((ch) => {
              const Icon = ch.icon;
              const isActive = activeChapter === ch.index;

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
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Chapter Container */}
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
                <div className="bg-[#0b0e11] p-4 border border-[#21262d]">
                  <h4 className="font-pixel text-[11px] text-amber-400 uppercase mb-2">
                    Case Background & Setting
                  </h4>
                  <p className="text-xs font-tech text-zinc-300 leading-relaxed mb-3">
                    {caseData.overview.background}
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
                </div>

                <div className="bg-[#0b0e11] p-4 border border-[#21262d]">
                  <h4 className="font-pixel text-[11px] text-red-400 uppercase mb-2">
                    Victim Profile & Forensic Scope
                  </h4>
                  <p className="text-xs font-tech text-zinc-300 leading-relaxed mb-3">
                    {caseData.overview.victimInfo}
                  </p>
                  <div className="p-2.5 bg-black/60 border border-[#21262d] text-[11px] font-tech text-zinc-400">
                    <span className="font-bold text-emerald-400 block mb-0.5">
                      ACCURACY GUARANTEE:
                    </span>
                    Documented exclusively from public autopsy findings, coroner dockets, and verified investigatory files.
                  </div>
                </div>
              </div>

              <div className="bg-[#0b0e11] p-5 border border-[#21262d]">
                <h3 className="font-pixel text-xs text-zinc-300 uppercase mb-2">
                  Executive Dossier Synopsis
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-tech whitespace-pre-line">
                  {caseData.summary}
                </p>
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

              <div className="bg-[#0b0e11] p-5 border border-[#21262d]">
                <h3 className="font-pixel text-[11px] text-amber-400 uppercase mb-2">
                  Documented Factual Timeline
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-tech whitespace-pre-line">
                  {caseData.incident.narrative}
                </p>
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
                <div className="bg-[#0b0e11] p-4 border border-[#21262d]">
                  <h4 className="font-pixel text-[11px] text-amber-400 uppercase mb-2">
                    Investigative Developments & Field Work
                  </h4>
                  <p className="text-xs font-tech text-zinc-300 leading-relaxed whitespace-pre-line">
                    {caseData.investigation.narrative}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#0b0e11] p-4 border border-[#21262d]">
                    <h4 className="font-pixel text-[11px] text-red-400 uppercase mb-1">
                      FD-302 Interview Memoranda Summary
                    </h4>
                    <p className="text-xs font-tech text-zinc-400 leading-relaxed">
                      {caseData.investigation.interviewRecordsSummary}
                    </p>
                  </div>

                  <div className="bg-[#0b0e11] p-4 border border-[#21262d]">
                    <h4 className="font-pixel text-[11px] text-zinc-400 uppercase mb-1">
                      Procedural & Evidence Notes
                    </h4>
                    <p className="text-xs font-tech text-zinc-400 leading-relaxed">
                      {caseData.investigation.procedureNotes}
                    </p>
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
                        <h4 className="font-bold text-sm text-zinc-200 mb-1">{ev.title}</h4>
                        <p className="text-xs text-zinc-400 font-tech leading-relaxed">
                          {ev.description}
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

              <div className="bg-[#0b0e11] p-5 border border-[#21262d]">
                <h3 className="font-pixel text-[11px] text-amber-400 uppercase mb-2">
                  Turning Point Narrative
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-tech whitespace-pre-line">
                  {caseData.breakthrough.narrative}
                </p>
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
                          {tp.title}
                        </h4>
                        <p className="text-xs text-zinc-400 font-tech leading-relaxed">
                          {tp.detail || tp.description}
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

              <div className="bg-[#0b0e11] p-5 border border-red-900/60">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs font-tech">
                  <span className="retro-stamp text-[9px] py-0 px-2">JUDICIAL ORDER</span>
                  <span className="text-zinc-400">Date: {caseData.verdict.verdictDate}</span>
                </div>

                <div className="text-base font-bold font-editorial text-zinc-100 mb-1">
                  {caseData.verdict.pleaOrVerdict}
                </div>

                <div className="text-xs font-tech text-amber-400 mb-3 font-bold">
                  Sentencing / Outcome: {caseData.verdict.sentencing}
                </div>

                <div className="pt-3 border-t border-[#21262d] text-xs text-zinc-300 font-tech leading-relaxed">
                  <span className="font-pixel text-[9px] text-zinc-500 uppercase block mb-1">
                    Appeals & Subsequent Rulings:
                  </span>
                  {caseData.verdict.appealsAndRulings}
                </div>

                {caseData.verdict.unresolvedLegalQuestions && (
                  <div className="mt-3 p-2.5 bg-black/60 border border-amber-900/50 text-xs text-amber-300 font-tech">
                    <strong>UNRESOLVED QUESTIONS:</strong> {caseData.verdict.unresolvedLegalQuestions}
                  </div>
                )}
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
                <div className="bg-[#0b0e11] p-4 border border-[#21262d]">
                  <h4 className="font-pixel text-[10px] text-emerald-400 uppercase mb-2">
                    Legislative & Procedural Reforms
                  </h4>
                  <ul className="space-y-1.5 text-xs font-tech text-zinc-300">
                    {caseData.aftermath.legalReforms.map((lr, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0 mt-0.5" />
                        <span>{lr}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#0b0e11] p-4 border border-[#21262d] space-y-3">
                  <div>
                    <h4 className="font-pixel text-[10px] text-amber-400 uppercase mb-1">
                      Institutional & Systemic Legacy
                    </h4>
                    <p className="text-xs text-zinc-300 font-tech leading-relaxed">
                      {caseData.aftermath.institutionalImpact}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-pixel text-[10px] text-red-400 uppercase mb-1">
                      Victim Advocacy & Memorialization
                    </h4>
                    <p className="text-xs text-zinc-300 font-tech leading-relaxed">
                      {caseData.aftermath.victimAdvocacy}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0b0e11] p-3 border border-[#21262d] text-xs font-tech text-zinc-400">
                <strong className="text-zinc-200">Current Incarceration / Case Status:</strong>{' '}
                {caseData.aftermath.currentStatus}
              </div>
            </div>
          )}

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
                    <span className="text-zinc-200 font-semibold">{cit.title}</span> &mdash; {cit.source}{' '}
                    {cit.date && <span className="text-zinc-500">({cit.date})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
