import React, { useState, useEffect, useRef } from 'react';
import {
  Scale,
  Gavel,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Send,
  Eye,
  Briefcase,
  Layers,
  Terminal,
  User,
  Users,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  Printer,
  Compass,
  Cpu,
  Clock,
  Lock,
} from 'lucide-react';
import { CaseFile, EvidenceItem, PersonOfInterest, KeyTestimony } from '../types.ts';
import { soundEngine } from '../utils/soundEngine.ts';

export interface CourtroomSimProps {
  caseData?: CaseFile;
  cases?: CaseFile[];
  onSelectCase?: (slug: string) => void;
  onClose?: () => void;
}

interface TranscriptEntry {
  id: string;
  speaker: 'PROSECUTOR' | 'DEFENCE_BOT' | 'JUDGE' | 'CLERK';
  text: string;
  timestamp: string;
  rulingType?: 'OVERRULED' | 'SUSTAINED' | 'CAUTION' | 'ADMITTED';
  evidenceRef?: string;
}

export const CourtroomSim: React.FC<CourtroomSimProps> = ({
  caseData: initialCaseData,
  cases = [],
  onSelectCase,
  onClose,
}) => {
  // Active case state
  const [activeCase, setActiveCase] = useState<CaseFile>(() => {
    if (initialCaseData) return initialCaseData;
    if (cases.length > 0) return cases[0];
    return {
      id: 'default-sim-case',
      slug: 'default-case',
      caseNumber: 'FD-302-SIM-001',
      title: 'FEDERAL SIMULATION TRIAL DOCKET',
      subtitle: 'Simulated Evidence & Adversarial Proceeding',
      category: 'Homicide',
      location: 'United States District Court',
      year: 1996,
      status: 'Convicted',
      isPublished: true,
      isFeatured: false,
      contentWarnings: [],
      summary: 'Adversarial simulation environment testing evidentiary proof.',
      overview: {
        background: 'Simulated federal criminal proceedings.',
        victimInfo: 'Preserved under court order.',
        jurisdiction: 'United States District Court',
        initialAlertDate: '1996-12-26',
      },
      incident: { narrative: 'Incident facts recorded in court docket.', timeline: [] },
      investigation: { narrative: '', procedureNotes: '', interviewRecordsSummary: '', timeline: [] },
      evidence: [
        {
          id: 'ev-01',
          exhibitNumber: 'EX-01',
          title: 'Forensic DNA Typing & Touch Sample Analysis',
          type: 'forensic',
          description: 'Nuclear DNA profile extracted from material recovered at the primary scene.',
          significance: 'Excludes 99.8% of general population; requires chain-of-custody verification.',
          classification: 'Grand Jury Exhibit',
        },
        {
          id: 'ev-02',
          exhibitNumber: 'EX-02',
          title: 'Form FD-302 Contemporaneous Witness Interview Record',
          type: 'document',
          description: 'Dictated statement by observing witness within 18 hours of reported movement.',
          significance: 'Direct sensory observation qualifying under Rule 803 recorded recollection.',
          classification: 'FD-302 Record',
        },
        {
          id: 'ev-03',
          exhibitNumber: 'EX-03',
          title: 'Cellular Tower & Telemetry Dispatch Logs',
          type: 'digital',
          description: 'Time-stamped sector transmissions establishing proximity within 1.2 mile radius.',
          significance: 'Rebuts defendant alibi window between 23:15 and 01:45 hours.',
          classification: 'Public Record',
        },
      ],
      personsOfInterest: [
        {
          id: 'poi-01',
          name: 'Primary Suspect',
          role: 'Named Defendant',
          status: 'Indicted',
          background: 'Subject of grand jury true bill indictment.',
          verifiedFindings: 'Circumstantial nexus established through physical exhibits.',
          allegations: 'Present at scene without verifiable alibi.',
          outcome: 'Plead not guilty; pending jury trial.',
        },
      ],
      breakthrough: { narrative: '', turningPoints: [] },
      courtroom: {
        court: 'United States District Court',
        presidingJudge: 'The Honorable Federal District Judge',
        charges: ['Count 1: Statutory Felony Offense', 'Count 2: Obstruction of Federal Justice'],
        prosecutionArgument:
          'The Government proves continuous chain of custody, corroborated forensic markers, and lack of credible alibi beyond reasonable doubt.',
        defenseArgument:
          'Defense argues contamination of evidence, procedural gaps in search warrant execution, and alternative suspect hypotheses.',
        keyTestimonies: [
          { witness: 'Special Agent in Charge', role: 'Lead Investigator', keyPoints: 'Logged exhibits into evidence locker within 4 hours.' },
        ],
        trialTimeline: [],
      },
      verdict: {
        verdictDate: '1998-05-14',
        pleaOrVerdict: 'Guilty on Count 1 and Count 2',
        sentencing: 'Life imprisonment without parole.',
        appealsAndRulings: 'Affirmed on direct appeal.',
      },
      aftermath: { legalReforms: [], institutionalImpact: '', victimAdvocacy: '', currentStatus: '' },
      reflectionPrompts: [],
      citations: [],
      createdAt: '1996-01-01',
      updatedAt: '1996-01-01',
    };
  });

  // Sync if initialCaseData changes
  useEffect(() => {
    if (initialCaseData) {
      setActiveCase(initialCaseData);
    }
  }, [initialCaseData]);

  // Courtroom Simulation States
  const [displayedEvidence, setDisplayedEvidence] = useState<EvidenceItem | null>(
    activeCase.evidence?.[0] || null
  );
  const [caseStrength, setCaseStrength] = useState<number>(65); // 0 to 100
  const [defenceObjectionActive, setDefenceObjectionActive] = useState<boolean>(false);
  const [currentObjection, setCurrentObjection] = useState<{
    grounds: string;
    description: string;
    rule: string;
  } | null>(null);

  // Transcript of trial proceedings
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    {
      id: 'init-clerk',
      speaker: 'CLERK',
      text: `Oyez, oyez, oyez. All persons having business before the United States District Court in re: ${activeCase.title} (${activeCase.caseNumber}), draw near. The Court is now in session. Presiding: ${activeCase.courtroom?.presidingJudge || 'The Honorable District Judge'}.`,
      timestamp: '10:00:00',
    },
    {
      id: 'init-judge',
      speaker: 'JUDGE',
      text: `The Government may proceed with its presentation of evidence against the defense. Counsel are reminded that all assertions must be grounded strictly in admitted exhibits and substantiated facts.`,
      timestamp: '10:00:15',
    },
  ]);

  // User input / claim
  const [userClaimInput, setUserClaimInput] = useState<string>('');
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [isJudgeEvaluating, setIsJudgeEvaluating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'evidence' | 'rebuttal' | 'poi' | 'charges'>('evidence');

  // Gavel animation trigger
  const [gavelStrike, setGavelStrike] = useState<boolean>(false);

  // Auto-scroll transcript to bottom
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, isBotThinking, isJudgeEvaluating]);

  const nowTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  // Switch active case
  const handleCaseChange = (slug: string) => {
    soundEngine.playKeyClick();
    const found = cases.find((c) => c.slug === slug);
    if (found) {
      setActiveCase(found);
      setDisplayedEvidence(found.evidence?.[0] || null);
      setCaseStrength(65);
      setDefenceObjectionActive(false);
      setCurrentObjection(null);
      setTranscript([
        {
          id: `case-switch-${Date.now()}`,
          speaker: 'CLERK',
          text: `DOCKET SWITCHED: Calling Case ${found.caseNumber} - "${found.title}". Presiding: ${found.courtroom?.presidingJudge || 'The District Court'}.`,
          timestamp: nowTime(),
        },
        {
          id: `case-switch-judge-${Date.now()}`,
          speaker: 'JUDGE',
          text: `Counsel, state your appearances. The Government may tender its primary exhibits for judicial scrutiny.`,
          timestamp: nowTime(),
        },
      ]);
      if (onSelectCase) onSelectCase(slug);
    }
  };

  // Action 1: Display Evidence onto the Courtroom Screen
  const handleDisplayEvidence = (ev: EvidenceItem) => {
    soundEngine.playFileAccess();
    setDisplayedEvidence(ev);

    // Append to transcript
    const userEntry: TranscriptEntry = {
      id: `ev-disp-${Date.now()}`,
      speaker: 'PROSECUTOR',
      text: `Your Honor, the Government displays into the record Exhibit ${ev.exhibitNumber || 'EX'}: "${ev.title}" [${ev.classification || 'Public Record'}]. Description: ${ev.description}`,
      timestamp: nowTime(),
      evidenceRef: ev.exhibitNumber,
    };

    setTranscript((prev) => [...prev, userEntry]);
    triggerDefenceEvaluationOnEvidence(ev);
  };

  // Helper: Trigger Defence Counsel bot response to newly displayed evidence
  const triggerDefenceEvaluationOnEvidence = (ev: EvidenceItem) => {
    setIsBotThinking(true);
    setTimeout(() => {
      soundEngine.playKeyClick();
      setIsBotThinking(false);

      const defArg = activeCase.courtroom?.defenseArgument || '';
      let objectionGrounds = 'Fed. R. Evid. 901 (Chain of Custody & Authentication)';
      let objectionText = `Objection, Your Honor! The defense moves to strike Exhibit ${ev.exhibitNumber || 'EX'}. The prosecution has not demonstrated an unbroken custodial receipt from scene intake to laboratory analysis. Potential contamination cannot be eliminated.`;

      if (ev.type === 'document' || ev.type === 'testimony') {
        objectionGrounds = 'Fed. R. Evid. 802 (Rule Against Hearsay)';
        objectionText = `Objection! Exhibit ${ev.exhibitNumber || 'EX'} contains out-of-court assertions tendered for the truth of the matter asserted. Unless a sworn contemporaneous exception is substantiated, this is inadmissible hearsay!`;
      } else if (ev.type === 'digital' || ev.type === 'audio') {
        objectionGrounds = 'Fed. R. Evid. 403 (Unfair Prejudice vs. Probative Value)';
        objectionText = `Objection! The timestamps on Exhibit ${ev.exhibitNumber || 'EX'} reflect ambient device telemetry, not deliberate human conduct. Introducing this misleads the jury and creates undue prejudice under Rule 403!`;
      }

      setDefenceObjectionActive(true);
      setCurrentObjection({
        grounds: objectionGrounds,
        description: objectionText,
        rule: objectionGrounds,
      });

      const defEntry: TranscriptEntry = {
        id: `def-obj-${Date.now()}`,
        speaker: 'DEFENCE_BOT',
        text: objectionText,
        timestamp: nowTime(),
        rulingType: 'CAUTION',
        evidenceRef: ev.exhibitNumber,
      };

      setTranscript((prev) => [...prev, defEntry]);

      // Judge asks for prosecution rebuttal or rules conditionally
      setTimeout(() => {
        const judgePrompt: TranscriptEntry = {
          id: `judge-prompt-${Date.now()}`,
          speaker: 'JUDGE',
          text: `Defence objection noted under ${objectionGrounds}. The Court will hear the Government's proffer or legal rebuttal before ruling on admissibility.`,
          timestamp: nowTime(),
        };
        setTranscript((prev) => [...prev, judgePrompt]);
      }, 700);
    }, 900);
  };

  // Action 2: User responds to Defence Counsel or presents factual claim
  const handleSendProsecutionClaim = (predefinedClaim?: string) => {
    const claim = predefinedClaim || userClaimInput.trim();
    if (!claim) return;

    soundEngine.playKeyClick();
    setUserClaimInput('');

    const claimEntry: TranscriptEntry = {
      id: `pros-claim-${Date.now()}`,
      speaker: 'PROSECUTOR',
      text: claim,
      timestamp: nowTime(),
      evidenceRef: displayedEvidence?.exhibitNumber,
    };

    setTranscript((prev) => [...prev, claimEntry]);

    // Judge evaluates the argument & Defence Counsel responds
    setIsJudgeEvaluating(true);

    setTimeout(() => {
      soundEngine.playBootBeep();
      setIsJudgeEvaluating(false);

      // Strike gavel visual
      setGavelStrike(true);
      setTimeout(() => setGavelStrike(false), 600);

      const isEvidenceCorroborated =
        displayedEvidence &&
        (claim.toLowerCase().includes('custody') ||
          claim.toLowerCase().includes('fd-302') ||
          claim.toLowerCase().includes('302') ||
          claim.toLowerCase().includes('corroborat') ||
          claim.toLowerCase().includes('forensic') ||
          claim.toLowerCase().includes('timeline') ||
          claim.toLowerCase().includes('sworn') ||
          claim.toLowerCase().includes('rule'));

      let rulingDecision: 'OVERRULED' | 'SUSTAINED' | 'ADMITTED';
      let judgeText = '';
      let scoreDelta = 0;

      if (isEvidenceCorroborated || !defenceObjectionActive) {
        rulingDecision = 'OVERRULED';
        judgeText = `RULING FROM THE BENCH: Objection OVERRULED. The Government has demonstrated sufficient foundational authentication and contemporaneous corroboration under Federal Rule of Evidence 901/803. Exhibit ${
          displayedEvidence?.exhibitNumber || 'submitted'
        } is formally admitted into evidence.`;
        scoreDelta = 12;
        setDefenceObjectionActive(false);
        setCurrentObjection(null);
      } else {
        rulingDecision = 'CAUTION' as any;
        judgeText = `BENCH EVALUATION: The Government's proffer is partially sustained, but counsel must avoid speculative inferences. The jury is instructed to consider the exhibit only for the limited purpose of establishing investigative sequence, not unconditional truth.`;
        scoreDelta = -5;
      }

      setCaseStrength((prev) => Math.min(100, Math.max(10, prev + scoreDelta)));

      const judgeEntry: TranscriptEntry = {
        id: `judge-eval-${Date.now()}`,
        speaker: 'JUDGE',
        text: judgeText,
        timestamp: nowTime(),
        rulingType: rulingDecision,
        evidenceRef: displayedEvidence?.exhibitNumber,
      };

      setTranscript((prev) => [...prev, judgeEntry]);

      // Defence Counsel Bot follow-up response
      setTimeout(() => {
        setIsBotThinking(true);
        setTimeout(() => {
          setIsBotThinking(false);
          soundEngine.playKeyClick();

          let defFollowUp = '';
          if (rulingDecision === 'OVERRULED') {
            defFollowUp = `Defence counsel notes an exception for the record. We reserve the right to cross-examine the handling technician regarding temperature logs and ambient humidity during transit.`;
          } else {
            defFollowUp = `We renew our motion to strike under Rule 403. The prejudice substantially outweighs any marginal probative value.`;
          }

          const defFollowUpEntry: TranscriptEntry = {
            id: `def-resp-${Date.now()}`,
            speaker: 'DEFENCE_BOT',
            text: defFollowUp,
            timestamp: nowTime(),
          };

          setTranscript((prev) => [...prev, defFollowUpEntry]);
        }, 800);
      }, 500);
    }, 1100);
  };

  // Clear or restart simulation
  const handleResetSession = () => {
    soundEngine.playBootBeep();
    setCaseStrength(65);
    setDefenceObjectionActive(false);
    setCurrentObjection(null);
    setDisplayedEvidence(activeCase.evidence?.[0] || null);
    setTranscript([
      {
        id: `reset-clerk-${Date.now()}`,
        speaker: 'CLERK',
        text: `COURT RECONVENED: Session reset. All prior motions purged from temporary buffer. Presiding: ${activeCase.courtroom?.presidingJudge || 'Federal Bench'}.`,
        timestamp: nowTime(),
      },
      {
        id: `reset-judge-${Date.now()}`,
        speaker: 'JUDGE',
        text: `Counsel may re-tender exhibits or state a new factual opening. Proceed.`,
        timestamp: nowTime(),
      },
    ]);
  };

  // Pre-configured tactical legal responses for quick selection
  const tacticalResponses = [
    {
      title: 'Tender Sealed FD-302 Custodial Log',
      text: `Your Honor, the Government submits the contemporaneous FD-302 recovery log signed by Special Agents in situ, satisfying Rule 901 authentication.`,
      icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      title: 'Invoke Rule 803(5) Recorded Recollection',
      text: `The witness statement was transcribed within 24 hours of observation when memory was fresh, qualifying under the Rule 803(5) hearsay exception.`,
      icon: <Scale className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      title: 'Corroborate with Independent Forensic Nexus',
      text: `This exhibit converges with independent forensic laboratory typing and timeline telemetry, establishing relevance under Rule 401.`,
      icon: <Shield className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      title: 'Move for Limited Purpose Admission',
      text: `The Government requests admission for the limited purpose of proving investigative timeline and notice, subject to a cautionary instruction.`,
      icon: <Gavel className="w-3.5 h-3.5 text-purple-400" />,
    },
  ];

  return (
    <div className="retro-terminal rounded-lg border-2 border-[#3d475a] bg-[#070a0e] text-zinc-200 font-mono shadow-2xl flex flex-col h-[750px] max-h-[90vh] overflow-hidden">
      {/* 90s OS WINDOW HEADER */}
      <div className="bg-gradient-to-r from-[#18202d] via-[#121924] to-[#0c1017] border-b-2 border-[#2b3545] p-2.5 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-red-950/80 border border-red-700 text-red-400 rounded">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-red-400 uppercase tracking-widest font-bold">
                COURTROOM_SIM.EXE &bull; v3.2
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1 text-emerald-400 border-emerald-800">
                ACTIVE BENCH
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-zinc-100 font-editorial truncate">
              {activeCase.courtroom?.court || 'United States District Court'} &bull;{' '}
              {activeCase.caseNumber}
            </h2>
          </div>
        </div>

        {/* Case Switcher & Controls */}
        <div className="flex items-center space-x-2">
          {cases.length > 1 && (
            <div className="hidden sm:flex items-center space-x-1">
              <span className="text-[10px] font-pixel text-zinc-400">DOCKET:</span>
              <select
                value={activeCase.slug}
                onChange={(e) => handleCaseChange(e.target.value)}
                className="bg-black/80 border border-zinc-700 text-zinc-200 text-xs px-2 py-1 rounded font-mono focus:border-red-500 focus:outline-none"
              >
                {cases.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.caseNumber} ({c.title})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleResetSession}
            title="Reset Courtroom Session"
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 rounded text-xs flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[10px] font-pixel hidden md:inline">RESET</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close Simulator"
              className="p-1.5 bg-red-950 hover:bg-red-800 text-red-200 border border-red-700 rounded text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* TOP COURTROOM STATUS BENCH (JUDGE / DEFENCE BOT / PROSECUTOR METER) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-[#0a0e14] border-b border-zinc-800 text-xs shrink-0">
        {/* Judge Simulator Panel */}
        <div
          className={`p-2.5 rounded border transition-all ${
            gavelStrike
              ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] scale-[1.01]'
              : 'bg-[#0f141d] border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[10px] text-amber-400 uppercase font-bold flex items-center space-x-1.5">
              <Gavel className={`w-3.5 h-3.5 ${gavelStrike ? 'animate-bounce text-amber-300' : 'text-amber-500'}`} />
              <span>JUDGE SIMULATOR</span>
            </span>
            <span className="text-[9px] font-mono text-zinc-400">
              {isJudgeEvaluating ? 'BENCH RULING...' : 'IN SESSION'}
            </span>
          </div>
          <div className="font-bold text-zinc-200 text-xs truncate">
            {activeCase.courtroom?.presidingJudge || 'Federal District Judge'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
            Venue: {activeCase.courtroom?.court || 'U.S. District Court'}
          </div>
        </div>

        {/* Defence Counsel Bot Panel */}
        <div
          className={`p-2.5 rounded border transition-all ${
            defenceObjectionActive
              ? 'bg-red-950/70 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
              : 'bg-[#0f141d] border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[10px] text-red-400 uppercase font-bold flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-red-400" />
              <span>DEFENCE COUNSEL BOT</span>
            </span>
            <span
              className={`text-[9px] font-pixel px-1 rounded ${
                defenceObjectionActive
                  ? 'bg-red-900 text-red-100 font-bold'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {defenceObjectionActive ? 'OBJECTION ACTIVE' : 'MONITORING'}
            </span>
          </div>
          <div className="font-bold text-zinc-200 text-xs truncate">
            {currentObjection ? currentObjection.rule : 'Adversarial Examination Engine'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
            {isBotThinking ? 'Formulating counter-motion...' : 'Ready to challenge uncorroborated assertions'}
          </div>
        </div>

        {/* Prosecution Case Strength Meter */}
        <div className="p-2.5 bg-[#0f141d] border border-zinc-800 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] text-emerald-400 uppercase font-bold flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>PROSECUTION CASE STRENGTH</span>
            </span>
            <span className="font-pixel text-xs font-bold text-emerald-400">{caseStrength}%</span>
          </div>
          <div className="w-full bg-zinc-900 h-2.5 rounded border border-zinc-700 overflow-hidden my-1">
            <div
              className={`h-full transition-all duration-500 ${
                caseStrength >= 75
                  ? 'bg-emerald-500'
                  : caseStrength >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${caseStrength}%` }}
            />
          </div>
          <div className="text-[9px] text-zinc-400 flex items-center justify-between">
            <span>STANDARD: Beyond a reasonable doubt</span>
            <span className="text-zinc-500 font-pixel">BURDEN ON GOV</span>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE: SPLIT PANE (CENTRAL TRANSCRIPT / EVIDENCE PROJECTOR) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden bg-[#05070a]">
        {/* LEFT / CENTER: TRIAL TRANSCRIPT DOCKET (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col border-r border-zinc-800/80 overflow-hidden h-full">
          {/* Transcript Subheader */}
          <div className="bg-[#090d14] px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400 shrink-0">
            <span className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-pixel text-[10px] text-zinc-300 uppercase">
                OFFICIAL RECORD OF PROCEEDINGS &bull; STENOGRAPHIC DOCKET
              </span>
            </span>
            <span className="text-[9px] text-zinc-500">REAL-TIME TRANSCRIPTION</span>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs font-mono bg-black/60">
            {transcript.map((entry) => {
              const isPros = entry.speaker === 'PROSECUTOR';
              const isDef = entry.speaker === 'DEFENCE_BOT';
              const isJudge = entry.speaker === 'JUDGE';
              const isClerk = entry.speaker === 'CLERK';

              return (
                <div
                  key={entry.id}
                  className={`p-2.5 rounded border text-xs leading-relaxed space-y-1 transition-all ${
                    isPros
                      ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-200'
                      : isDef
                      ? 'bg-red-950/30 border-red-900/80 text-red-200'
                      : isJudge
                      ? 'bg-amber-950/25 border-amber-900/80 text-amber-200 font-bold'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-pixel">
                    <span
                      className={`font-bold uppercase tracking-wider ${
                        isPros
                          ? 'text-emerald-400'
                          : isDef
                          ? 'text-red-400'
                          : isJudge
                          ? 'text-amber-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      {entry.speaker === 'DEFENCE_BOT'
                        ? 'DEFENCE COUNSEL BOT'
                        : entry.speaker === 'PROSECUTOR'
                        ? 'ASSISTANT U.S. ATTORNEY (YOU)'
                        : entry.speaker === 'JUDGE'
                        ? 'PRESIDING JUDICIAL BENCH'
                        : 'COURT CLERK'}
                    </span>
                    <div className="flex items-center space-x-2 text-zinc-500 font-mono">
                      {entry.evidenceRef && (
                        <span className="px-1 py-0.5 bg-black/50 border border-zinc-700 text-zinc-300 rounded text-[9px]">
                          REF: {entry.evidenceRef}
                        </span>
                      )}
                      <span>{entry.timestamp}</span>
                    </div>
                  </div>

                  <p className="text-zinc-200 font-tech leading-relaxed whitespace-pre-line text-xs sm:text-[13px]">
                    {entry.text}
                  </p>
                </div>
              );
            })}

            {/* Typing Indicator for Bot / Judge */}
            {isBotThinking && (
              <div className="p-2 bg-red-950/20 border border-red-900/40 rounded text-red-300 text-xs font-pixel flex items-center space-x-2">
                <span className="animate-spin text-red-400">&bull;</span>
                <span>DEFENCE COUNSEL BOT IS SEARCHING DOCKET FOR PROCEDURAL MOTIONS...</span>
              </div>
            )}
            {isJudgeEvaluating && (
              <div className="p-2 bg-amber-950/20 border border-amber-900/40 rounded text-amber-300 text-xs font-pixel flex items-center space-x-2">
                <Gavel className="w-3.5 h-3.5 animate-bounce text-amber-400" />
                <span>JUDGE SIMULATOR EVALUATING ADMISSIBILITY UNDER FEDERAL RULES OF EVIDENCE...</span>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* User Input & Action Console at Bottom of Transcript */}
          <div className="p-2.5 bg-[#0a0e14] border-t border-zinc-800 space-y-2 shrink-0">
            {/* Quick Tactical Responses (Click to send) */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-[10px] font-pixel text-zinc-500 shrink-0">TACTICAL PROFFERS:</span>
              {tacticalResponses.map((tr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendProsecutionClaim(tr.text)}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500 rounded text-[11px] text-zinc-300 flex items-center space-x-1.5 shrink-0 transition-colors"
                >
                  {tr.icon}
                  <span className="truncate max-w-[140px]">{tr.title}</span>
                </button>
              ))}
            </div>

            {/* Custom Input Form */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={userClaimInput}
                onChange={(e) => setUserClaimInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendProsecutionClaim();
                }}
                placeholder="Enter argument, cite corroborating exhibits, or rebut the defence objection..."
                className="flex-1 bg-black/80 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 font-mono"
              />
              <button
                onClick={() => handleSendProsecutionClaim()}
                disabled={!userClaimInput.trim()}
                className={`retro-btn px-4 py-1.5 text-xs font-pixel flex items-center space-x-1 ${
                  userClaimInput.trim()
                    ? 'retro-btn-red text-white'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                }`}
              >
                <span>ARGUE</span>
                <Send className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: EVIDENCE PROJECTOR & CASE FACTS EXPLORER (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col overflow-hidden h-full bg-[#080b0f]">
          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-zinc-800 bg-[#0a0d13] text-[10px] font-pixel shrink-0">
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setActiveTab('evidence');
              }}
              className={`flex-1 py-2 px-2 text-center transition-colors border-r border-zinc-800 ${
                activeTab === 'evidence'
                  ? 'bg-zinc-800 text-red-400 font-bold border-b-2 border-red-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1. EXHIBITS ({activeCase.evidence?.length || 0})
            </button>
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setActiveTab('poi');
              }}
              className={`flex-1 py-2 px-2 text-center transition-colors border-r border-zinc-800 ${
                activeTab === 'poi'
                  ? 'bg-zinc-800 text-amber-400 font-bold border-b-2 border-amber-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              2. DEFENDANTS ({activeCase.personsOfInterest?.length || 0})
            </button>
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setActiveTab('charges');
              }}
              className={`flex-1 py-2 px-2 text-center transition-colors ${
                activeTab === 'charges'
                  ? 'bg-zinc-800 text-emerald-400 font-bold border-b-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              3. CHARGES
            </button>
          </div>

          {/* TAB 1: EVIDENCE PROJECTOR */}
          {activeTab === 'evidence' && (
            <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
              {/* CURRENTLY DISPLAYED EXHIBIT PROJECTION SCREEN */}
              <div className="p-3 bg-black/80 border-2 border-red-900/80 rounded space-y-2 relative shadow-inner shrink-0">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                  <span className="font-pixel text-[10px] text-red-400 uppercase font-bold flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>CENTRAL COURT SCREEN // ADMITTED EXHIBIT</span>
                  </span>
                  <span className="retro-stamp text-[8px] py-0 px-1.5 text-emerald-400 border-emerald-800">
                    PROJECTOR ACTIVE
                  </span>
                </div>

                {displayedEvidence ? (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-red-400 font-bold">
                        {displayedEvidence.exhibitNumber || 'EXHIBIT'}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono">
                        TYPE: {displayedEvidence.type}
                      </span>
                    </div>

                    <h4 className="font-bold text-zinc-100 text-xs sm:text-sm font-editorial">
                      {displayedEvidence.title}
                    </h4>

                    <p className="text-[11px] font-tech text-zinc-300 leading-relaxed bg-[#0b0f15] p-2 rounded border border-zinc-800">
                      {displayedEvidence.description}
                    </p>

                    <div className="text-[10px] font-mono text-zinc-400 space-y-0.5">
                      <div>
                        <strong className="text-zinc-300">Forensic Significance:</strong>{' '}
                        {displayedEvidence.significance}
                      </div>
                      <div className="text-[9px] text-zinc-500">
                        Classification: {displayedEvidence.classification} &bull; Recovered:{' '}
                        {displayedEvidence.recoveredAt || 'Investigative Scene'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-zinc-500 font-tech text-xs">
                    No exhibit currently projected on court screen. Select an exhibit below.
                  </div>
                )}
              </div>

              {/* LIST OF ADMISSIBLE EXHIBITS (CLICK TO PROJECT) */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between text-[10px] font-pixel text-zinc-400 mb-1">
                  <span>SELECT EXHIBIT TO TENDER INTO EVIDENCE:</span>
                  <span className="text-emerald-400">CLICK TO DISPLAY</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {activeCase.evidence?.map((ev, i) => {
                    const isSelected = displayedEvidence?.id === ev.id;
                    return (
                      <button
                        key={ev.id || i}
                        onClick={() => handleDisplayEvidence(ev)}
                        className={`w-full p-2 text-left rounded border transition-all text-xs flex flex-col space-y-1 ${
                          isSelected
                            ? 'bg-red-950/40 border-red-500 text-zinc-100 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                            : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-pixel text-[10px] text-red-400 font-bold">
                            {ev.exhibitNumber || `EX-0${i + 1}`}
                          </span>
                          <span className="text-[9px] uppercase text-zinc-500 font-mono">
                            {ev.type}
                          </span>
                        </div>
                        <div className="font-bold text-zinc-200 truncate">{ev.title}</div>
                        <div className="text-[10px] text-zinc-400 line-clamp-1 font-tech">
                          {ev.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONS OF INTEREST / DEFENDANTS */}
          {activeTab === 'poi' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs font-mono">
              <span className="font-pixel text-[10px] text-zinc-400 uppercase block mb-1">
                PERSONS OF INTEREST & DOCUMENTED DEFENDANTS
              </span>
              {activeCase.personsOfInterest?.map((poi) => (
                <div
                  key={poi.id}
                  className="p-3 bg-black/60 border border-zinc-800 rounded space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-100 font-editorial text-sm">
                      {poi.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-pixel uppercase ${
                        poi.status === 'Convicted'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : poi.status === 'Indicted'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {poi.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-tech">
                    <strong className="text-zinc-300">Role:</strong> {poi.role}
                  </div>
                  <div className="text-[11px] text-zinc-300 font-tech leading-relaxed">
                    {poi.verifiedFindings || poi.allegations}
                  </div>
                  <div className="pt-1 border-t border-zinc-900 text-[10px] text-zinc-400">
                    <strong className="text-zinc-300">Documented Outcome:</strong>{' '}
                    {poi.outcome || 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: STATUTORY CHARGES & INDICTMENT */}
          {activeTab === 'charges' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs font-mono">
              <span className="font-pixel text-[10px] text-emerald-400 uppercase block">
                GRAND JURY INDICTMENT COUNTS
              </span>

              <div className="space-y-2">
                {activeCase.courtroom?.charges?.map((ch, idx) => (
                  <div key={idx} className="p-2.5 bg-black/60 border border-zinc-800 rounded space-y-1">
                    <span className="text-[10px] font-pixel text-red-400 font-bold block">
                      COUNT {idx + 1}:
                    </span>
                    <p className="text-xs font-tech text-zinc-200 leading-snug">{ch}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-400 space-y-1 font-tech">
                <span className="text-[10px] font-pixel text-zinc-300 uppercase block">
                  GOVERNMENT PROSECUTION THEORY:
                </span>
                <p className="leading-relaxed">
                  {activeCase.courtroom?.prosecutionArgument ||
                    'Proof beyond reasonable doubt via independent corroborated scientific forensic proof and timeline elimination of alternative hypotheses.'}
                </p>
              </div>

              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded text-[11px] text-zinc-400 space-y-1 font-tech">
                <span className="text-[10px] font-pixel text-red-400 uppercase block">
                  DOCUMENTED DEFENCE THEORY:
                </span>
                <p className="leading-relaxed">
                  {activeCase.courtroom?.defenseArgument ||
                    'Contesting custody logs, chain of handling, and circumstantial inferences.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 90s OS STATUS BAR */}
      <div className="bg-[#0b0e14] border-t border-zinc-800 px-3 py-1.5 flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-zinc-400">
            DOCKET: <strong className="text-zinc-200">{activeCase.caseNumber}</strong>
          </span>
          <span>&bull;</span>
          <span>
            EXHIBITS LOGGED: <strong className="text-zinc-300">{activeCase.evidence?.length || 0}</strong>
          </span>
          <span>&bull;</span>
          <span className="text-emerald-500">
            BENCH: {activeCase.courtroom?.presidingJudge ? 'PRESIDING' : 'MAGISTRATE'}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[9px] font-pixel">
          <span>COURTROOM_SIM v3.2</span>
          <span>&bull;</span>
          <span className="text-amber-400">EDUCATIONAL LEGAL SIMULATION</span>
        </div>
      </div>
    </div>
  );
};
