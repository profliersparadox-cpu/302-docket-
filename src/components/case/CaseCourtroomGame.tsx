import React, { useState, useEffect } from 'react';
import {
  Scale,
  Gavel,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Users,
  Eye,
  Briefcase,
  Layers,
  Award,
  Clock,
  Terminal,
} from 'lucide-react';
import { CaseFile, EvidenceItem, PersonOfInterest, KeyTestimony } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface CaseCourtroomGameProps {
  caseData: CaseFile;
  onViewExhibits?: () => void;
  onCloseGame?: () => void;
}

export type GameStage =
  | 'stage1_build' // 1. Build the Case (select target POI, statutory charges, 3 exhibits)
  | 'stage2_defense' // 2. Face the Defence & 3. Test Argument & 4. Compare with Real Case
  | 'stage5_final'; // 5. Final Trial & Unsealed Verdict / Unresolved Cold Case Review

interface TrialRound {
  id: number;
  issueTitle: string;
  claimPrompt: string;
  defenseObjectionTitle: string;
  defenseArgumentText: string;
  defenseLegalBasis: string;
  options: {
    id: string;
    label: string;
    tacticalAction: string;
    evidenceNexus: string;
    isOptimal: boolean;
    judgeRuling: 'OVERRULED' | 'SUSTAINED' | 'CONDITIONAL_PASS';
    judgeAnalysis: string;
    legalDoctrine: string;
    points: number;
  }[];
  realCaseComparison: {
    historicalIssue: string;
    actualProsecutionAction: string;
    actualDefenseAction: string;
    docketCitation: string;
  };
}

export const CaseCourtroomGame: React.FC<CaseCourtroomGameProps> = ({
  caseData,
  onViewExhibits,
  onCloseGame,
}) => {
  const isColdCase =
    caseData.status === 'Cold Case / Unresolved' ||
    caseData.status === 'Active Investigation';

  // Game Progress State
  const [currentStage, setCurrentStage] = useState<GameStage>('stage1_build');

  // Stage 1: Case Building Selections
  const [selectedTargetPoiId, setSelectedTargetPoiId] = useState<string>(
    caseData.personsOfInterest?.[0]?.id || ''
  );
  const [selectedExhibitIds, setSelectedExhibitIds] = useState<string[]>([]);
  const [selectedChargeIndex, setSelectedChargeIndex] = useState<number>(0);
  const [prosecutionTheoryNotes, setProsecutionTheoryNotes] = useState<string>('');

  // Stage 2-4: Trial Rounds State
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasEvaluatedRound, setHasEvaluatedRound] = useState<boolean>(false);
  const [isTypingJudgeRuling, setIsTypingJudgeRuling] = useState<boolean>(false);
  const [typedJudgeRuling, setTypedJudgeRuling] = useState<string>('');
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [revealedRealCase, setRevealedRealCase] = useState<boolean>(false);

  // Stage 5: Final Verdict Unsealing Animation State
  const [isUnsealingVerdict, setIsUnsealingVerdict] = useState<boolean>(false);
  const [unsealProgress, setUnsealProgress] = useState<number>(0);
  const [verdictUnsealed, setVerdictUnsealed] = useState<boolean>(false);

  // Generate realistic trial rounds dynamically based on the case's real evidence, courtroom data, and POIs
  const generateTrialRounds = (): TrialRound[] => {
    const exhibits = caseData.evidence || [];
    const ex1 = exhibits[0]?.title || 'Forensic Chain of Custody & Trace Physical Material';
    const ex2 = exhibits[1]?.title || 'Contemporaneous Audio Dispatch & 302 Witness Record';
    const ex3 = exhibits[2]?.title || 'Documented Timeline & Travel Cross-Verification Log';

    const defSummary =
      caseData.courtroom?.defenseArgument ||
      'Defense asserted procedural gaps in physical evidence handling, highlighted lack of immediate eyewitness identification, and moved to exclude uncorroborated circumstantial assertions.';

    const prosSummary =
      caseData.courtroom?.prosecutionArgument ||
      'The government introduced multi-agency forensic reconstruction, corroborated witness depositions, and documentary records establishing requisite intent beyond reasonable doubt.';

    const firstWitness = caseData.courtroom?.keyTestimonies?.[0];
    const secondWitness = caseData.courtroom?.keyTestimonies?.[1];

    return [
      {
        id: 1,
        issueTitle: 'ROUND 1: ADMISSIBILITY OF KEY FORENSIC EXHIBITS & CHAIN OF CUSTODY',
        claimPrompt: `Present Exhibit 01 [${ex1}] to establish physical presence and connection to the crime scene.`,
        defenseObjectionTitle: 'DEFENSE MOTION IN LIMINE: MOTION TO SUPPRESS & CONTEST CHAIN OF CUSTODY',
        defenseArgumentText: `Counsel argues: "${defSummary.slice(0, 220)}... The defense moves to exclude this exhibit on grounds of potential contamination, evidentiary transfer, or inadequate supervisory log."`,
        defenseLegalBasis: 'Federal Rule of Evidence 901 (Authentication) & Fourth Amendment Chain of Custody standards.',
        options: [
          {
            id: 'opt1_a',
            label: 'Admit Official Form FD-302 Evidence Logs & Laboratory Sworn Deposition',
            tacticalAction:
              'Present contemporaneous FD-302 recovery logs showing sealed evidence bagging, temperature controls, and sworn testimony from the forensic lab specialist.',
            evidenceNexus: `Corroborated directly by ${ex1} and official intake logs.`,
            isOptimal: true,
            judgeRuling: 'OVERRULED',
            judgeAnalysis:
              'The government has demonstrated unbroken custodial documentation from the moment of scene discovery to forensic laboratory examination. Authentication satisfies Rule 901 threshold requirements.',
            legalDoctrine:
              'Rule 901(a): Authentication satisfied when evidence is sufficient to support a finding that the item is what the proponent claims.',
            points: 35,
          },
          {
            id: 'opt1_b',
            label: 'Rely on Witness Memory & General Scene Photos Without Custodial Receipts',
            tacticalAction:
              'Argue that photographic discovery in situ should suffice for the jury, minimizing technical custodial book-keeping discrepancies.',
            evidenceNexus: 'Weak circumstantial inference lacking lab sign-off.',
            isOptimal: false,
            judgeRuling: 'SUSTAINED',
            judgeAnalysis:
              'Without foundational custodial witness testimony, introducing sensitive physical items invites substantial speculation and potential prejudicial contamination.',
            legalDoctrine:
              'Rule 403: Exclusion of relevant evidence on grounds of unfair prejudice, confusion of issues, or misleading the jury.',
            points: 10,
          },
          {
            id: 'opt1_c',
            label: 'Offer Limited Purpose Admission With Judicial Cautionary Instruction',
            tacticalAction:
              'Propose that the court admit the exhibit conditionally, subject to later connection by the arresting agent.',
            evidenceNexus: 'Conditional relevance under Rule 104(b).',
            isOptimal: false,
            judgeRuling: 'CONDITIONAL_PASS',
            judgeAnalysis:
              'Conditionally admitted. The Court reserves right to strike if subsequent testimony fails to connect the handling agent to the vault intake registry.',
            legalDoctrine:
              'Rule 104(b): When relevancy depends on fulfillment of a condition of fact, court may admit upon introduction of evidence sufficient to support finding.',
            points: 20,
          },
        ],
        realCaseComparison: {
          historicalIssue:
            'How the court historically ruled on physical evidence authentication in this case:',
          actualProsecutionAction: `The Government introduced formal forensic filings (${caseData.courtroom?.court || 'Federal Court'}). In trial dockets: "${prosSummary.slice(0, 180)}..."`,
          actualDefenseAction: `Defense counsel rigorously challenged handling protocols: "${defSummary.slice(0, 180)}..."`,
          docketCitation: `Official Clerk Record &bull; ${caseData.caseNumber} &bull; Transcripts Filed Under Seal`,
        },
      },
      {
        id: 2,
        issueTitle: 'ROUND 2: SWORN TESTIMONY & WITNESS CREDIBILITY CHALLENGE',
        claimPrompt: `Call sworn witness [${firstWitness?.witness || 'Lead Investigating Special Agent'}] to corroborate timeline anomalies and suspect opportunity.`,
        defenseObjectionTitle: 'DEFENSE OBJECTION: HEARSAY & SPECULATION CONCERNING MOTIVE',
        defenseArgumentText: `Defense counsel rises: "Objection, Your Honor. The witness is testifying to out-of-court impressions, hearsay statements from secondary sources, and speculative theories regarding intent that were never recorded contemporaneous to the event."`,
        defenseLegalBasis: 'Federal Rule of Evidence 801 / 802 (Rule Against Hearsay) & Rule 602 (Need for Personal Knowledge).',
        options: [
          {
            id: 'opt2_a',
            label: 'Invoke Sworn 302 Deposition & Rule 803 Contemporaneous Recorded Memory',
            tacticalAction:
              'Clarify that the witness is reading from a verified Form FD-302 dictated within 24 hours of the interview, qualifying under Rule 803(5) recorded recollection, supported by cross-referenced dispatch records.',
            evidenceNexus: `Rooted in sworn testimony of ${firstWitness?.witness || 'primary witness'} and ${ex2}.`,
            isOptimal: true,
            judgeRuling: 'OVERRULED',
            judgeAnalysis:
              'Objection overruled. The memorandum was executed contemporaneously when memory was fresh, establishing proper foundation under Rule 803(5). The witness may testify to direct observations.',
            legalDoctrine:
              'Fed. R. Evid. 803(5): Recorded Recollection exception applies when a memorandum concerns a matter about which witness once had personal knowledge.',
            points: 35,
          },
          {
            id: 'opt2_b',
            label: 'Ask the Witness to Offer Their Professional Opinion as an Experienced Detective',
            tacticalAction:
              'Request the witness summarize their personal gut feeling and investigative instinct developed over years of casework.',
            evidenceNexus: 'Lay opinion testimony under Rule 701.',
            isOptimal: false,
            judgeRuling: 'SUSTAINED',
            judgeAnalysis:
              'Sustained. Witnesses may not usurp the role of the fact-finder with speculative hunches or moral assessments of truthfulness.',
            legalDoctrine:
              'Rule 701: Lay opinion is limited to rationally based perceptions and may not address ultimate credibility.',
            points: 5,
          },
          {
            id: 'opt2_c',
            label: 'Rephrase Question to Direct Sensory Observations and Direct Utterances',
            tacticalAction:
              'Narrow inquiry strictly to what the witness physically saw, heard, and logged at the exact time of the interaction.',
            evidenceNexus: 'Direct personal knowledge under Rule 602.',
            isOptimal: false,
            judgeRuling: 'CONDITIONAL_PASS',
            judgeAnalysis:
              'Rephrased question permitted. The Court instructs the jury to consider only direct factual observations and disregard speculative extrapolations.',
            legalDoctrine:
              'Rule 602: A witness may testify to a matter only if evidence is introduced sufficient to support a finding that the witness has personal knowledge.',
            points: 25,
          },
        ],
        realCaseComparison: {
          historicalIssue: 'Witness examination and confrontation in actual courtroom proceedings:',
          actualProsecutionAction: firstWitness
            ? `Sworn testimony of ${firstWitness.witness} (${firstWitness.role}): "${firstWitness.keyPoints}"`
            : `Prosecution relied on cross-examinations establishing exact timelines and eliminating alternative alibi windows.`,
          actualDefenseAction:
            secondWitness
              ? `Defense cross-examination sought to expose inconsistencies with prior statements from ${secondWitness.witness}.`
              : 'Defense argued memory decay, suggestive interview practices, and absence of audio verification.',
          docketCitation: `Sworn Deposition Minutes &bull; Court of Record &bull; ${caseData.courtroom?.presidingJudge || 'Presiding Judicial Panel'}`,
        },
      },
      {
        id: 3,
        issueTitle: 'ROUND 3: PROVING STATUTORY ELEMENTS & MEETING BURDEN OF PROOF',
        claimPrompt: `Synthesize exhibits and timeline to satisfy the statutory elements of: "${caseData.courtroom?.charges?.[selectedChargeIndex] || 'Statutory Offense Charged'}".`,
        defenseObjectionTitle: 'DEFENSE RULE 29 MOTION FOR JUDGMENT OF ACQUITTAL: INSUFFICIENT EVIDENCE',
        defenseArgumentText: `Defense moves under Rule 29: "No reasonable jury could find the statutory elements satisfied beyond a reasonable doubt. The prosecution’s case is entirely circumstantial; there is no direct nexus connecting our client to the specific criminal act."`,
        defenseLegalBasis: 'Federal Rule of Criminal Procedure 29 & Constitutional Due Process Standard (Jackson v. Virginia).',
        options: [
          {
            id: 'opt3_a',
            label: 'Demonstrate Converging Lines of Independent Physical & Documentary Proof',
            tacticalAction:
              'Present a unified matrix linking forensic signatures, cellular/timeline corroboration, and voluntary post-offense admissions, proving that alternative theories are scientifically untenable.',
            evidenceNexus: `Integrates all ${caseData.evidence?.length || 3} admitted exhibits into a unified prosecutorial nexus.`,
            isOptimal: true,
            judgeRuling: 'OVERRULED',
            judgeAnalysis:
              'Motion for judgment of acquittal denied. Viewing the evidence in the light most favorable to the government, a rational trier of fact could find the essential elements established beyond a reasonable doubt.',
            legalDoctrine:
              'Jackson v. Virginia standard: Circumstantial evidence has equal weight to direct evidence when establishing criminal intent.',
            points: 30,
          },
          {
            id: 'opt3_b',
            label: 'Emphasize the Severity of the Crime & Call for Moral Retribution',
            tacticalAction:
              'Deliver an emotional summation reminding the court of the heinous nature of the violation and public outrage.',
            evidenceNexus: 'Appeals to emotion rather than statutory elements.',
            isOptimal: false,
            judgeRuling: 'SUSTAINED',
            judgeAnalysis:
              'The Court cautions counsel. Inflammatory rhetoric does not substitute for evidence. The burden rests strictly on statutory proof, not community passions.',
            legalDoctrine:
              'Due process prohibits prosecutorial arguments designed to incite jury passion or prejudice.',
            points: 5,
          },
          {
            id: 'opt3_c',
            label: 'Rely Solely on the Defendant’s Inconsistent Statements and Silence',
            tacticalAction:
              'Argue that the defendant’s refusal to explain key gaps or their conflicting initial accounts indicates consciousness of guilt.',
            evidenceNexus: 'Pre-trial statement analysis.',
            isOptimal: false,
            judgeRuling: 'CONDITIONAL_PASS',
            judgeAnalysis:
              'Permissible as to documented voluntary false exculpatory statements, but no adverse inference may be drawn from invocation of constitutional rights.',
            legalDoctrine:
              'Fifth Amendment protection against self-incrimination; false exculpatory statements may show consciousness of guilt.',
            points: 15,
          },
        ],
        realCaseComparison: {
          historicalIssue: 'How the final prosecution theory was tested against legal standards:',
          actualProsecutionAction: `The prosecution maintained: "${prosSummary}"`,
          actualDefenseAction: `The defense responded: "${defSummary}"`,
          docketCitation: `Judicial Bench Findings &bull; ${caseData.courtroom?.court || 'District Court'}`,
        },
      },
    ];
  };

  const rounds = generateTrialRounds();
  const currentRound = rounds[currentRoundIndex] || rounds[0];

  // Handle selecting an exhibit in Stage 1
  const toggleExhibit = (id: string) => {
    soundEngine.playKeyClick();
    setSelectedExhibitIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id]; // keep max 3
      }
      return [...prev, id];
    });
  };

  // Launch trial from Stage 1 into Stage 2
  const handleProceedToTrial = () => {
    soundEngine.playBootBeep();
    setCurrentStage('stage2_defense');
    setCurrentRoundIndex(0);
    setSelectedOptionId(null);
    setHasEvaluatedRound(false);
    setRevealedRealCase(false);
    setRoundScores([]);
  };

  // Submit response in trial round
  const handleSubmitResponse = () => {
    if (!selectedOptionId) return;
    soundEngine.playKeyClick();

    const selectedOpt = currentRound.options.find((o) => o.id === selectedOptionId);
    if (!selectedOpt) return;

    setHasEvaluatedRound(true);
    setIsTypingJudgeRuling(true);
    setTypedJudgeRuling('');

    // Simulate retro typing of judge ruling
    const textToType = `[RULING FROM THE BENCH: ${selectedOpt.judgeRuling}]\n\n${selectedOpt.judgeAnalysis}\n\nLEGAL STANDARD: ${selectedOpt.legalDoctrine}`;
    let charIndex = 0;
    const interval = setInterval(() => {
      if (charIndex <= textToType.length) {
        setTypedJudgeRuling(textToType.slice(0, charIndex));
        charIndex += 4;
        if (charIndex % 12 === 0) {
          soundEngine.playKeyClick();
        }
      } else {
        clearInterval(interval);
        setIsTypingJudgeRuling(false);
        soundEngine.playFileAccess();
      }
    }, 20);

    setRoundScores((prev) => [...prev, selectedOpt.points]);
  };

  // Advance to next round or stage 5
  const handleNextRound = () => {
    soundEngine.playKeyClick();
    if (currentRoundIndex + 1 < rounds.length) {
      setCurrentRoundIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setHasEvaluatedRound(false);
      setRevealedRealCase(false);
      setTypedJudgeRuling('');
    } else {
      // Proceed to Stage 5: Final Trial Review & Verdict Reveal
      setCurrentStage('stage5_final');
      soundEngine.playBootBeep();
    }
  };

  // Unseal verdict animation in Stage 5
  const handleUnsealVerdict = () => {
    soundEngine.playKeyClick();
    setIsUnsealingVerdict(true);
    setUnsealProgress(0);

    let p = 0;
    const timer = setInterval(() => {
      p += 20;
      setUnsealProgress(p);
      soundEngine.playKeyClick();
      if (p >= 100) {
        clearInterval(timer);
        setIsUnsealingVerdict(false);
        setVerdictUnsealed(true);
        soundEngine.playFileAccess();
      }
    }, 80);
  };

  // Restart game
  const handleRestartGame = () => {
    soundEngine.playBootBeep();
    setCurrentStage('stage1_build');
    setSelectedExhibitIds([]);
    setCurrentRoundIndex(0);
    setSelectedOptionId(null);
    setHasEvaluatedRound(false);
    setRevealedRealCase(false);
    setVerdictUnsealed(false);
    setRoundScores([]);
  };

  // Compute total score and prosecution grade
  const totalScore = roundScores.reduce((acc, pts) => acc + pts, 0);
  const maxPossibleScore = 100;
  const prosecutionStrengthPercent = Math.min(
    100,
    Math.round((totalScore / maxPossibleScore) * 100)
  );

  const getGradeEvaluation = (pct: number) => {
    if (pct >= 85) {
      return {
        grade: 'GRADE A - BRICK-BY-BRICK FEDERAL INDICTMENT',
        assessment:
          'Outstanding evidentiary nexus. Every objection met with authenticated contemporaneous documentation. Defense motions neutralized under the Federal Rules of Evidence.',
        badgeColor: 'text-emerald-400 border-emerald-600 bg-emerald-950/40',
      };
    }
    if (pct >= 60) {
      return {
        grade: 'GRADE B - ADMISSIBLE BUT CHALLENGED CASE',
        assessment:
          'Sufficient threshold to avoid Rule 29 judgment of acquittal, though procedural vulnerabilities were exposed during cross-examination.',
        badgeColor: 'text-amber-400 border-amber-600 bg-amber-950/40',
      };
    }
    return {
      grade: 'GRADE C - SPECULATIVE / VULNERABLE TO REVERSAL',
      assessment:
        'Significant evidentiary gaps, hearsay reliance, or insufficient chain of custody. High probability of jury deadlocks or appellate remand.',
      badgeColor: 'text-red-400 border-red-600 bg-red-950/40',
    };
  };

  const gradeInfo = getGradeEvaluation(prosecutionStrengthPercent);

  // Selected Target Person
  const targetPoi =
    caseData.personsOfInterest?.find((p) => p.id === selectedTargetPoiId) ||
    caseData.personsOfInterest?.[0];

  return (
    <div className="retro-terminal p-4 sm:p-6 rounded-lg space-y-6 font-mono border-2 border-red-900/60 shadow-[0_0_30px_rgba(185,28,28,0.15)] bg-[#07090c] text-zinc-200">
      {/* GAME STATUS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-red-900/80 pb-3 bg-black/60 p-3 rounded">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-950/90 border border-red-700 text-red-400 rounded">
            <Scale className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-red-500 uppercase tracking-widest font-bold">
                TRIAL_SIM.EXE &bull; UNITED STATES DISTRICT COURT
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1.5 text-zinc-400">
                REF: {caseData.caseNumber}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-editorial text-zinc-100 flex items-center space-x-2">
              <span>THE PROSECUTION: COURTROOM TRIAL GAME</span>
              <span className="text-[11px] text-red-400 font-mono font-normal">
                ({caseData.title})
              </span>
            </h3>
          </div>
        </div>

        {/* Phase Indicator Pills */}
        <div className="flex items-center space-x-1 sm:space-x-2 text-[10px] font-pixel">
          <span
            className={`px-2 py-1 rounded border transition-colors ${
              currentStage === 'stage1_build'
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            1. BUILD CASE
          </span>
          <span className="text-zinc-600">&rarr;</span>
          <span
            className={`px-2 py-1 rounded border transition-colors ${
              currentStage === 'stage2_defense'
                ? 'bg-red-950/80 border-red-500 text-red-300 font-bold animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            2. FACE DEFENCE
          </span>
          <span className="text-zinc-600">&rarr;</span>
          <span
            className={`px-2 py-1 rounded border transition-colors ${
              currentStage === 'stage5_final'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            3. VERDICT REVEAL
          </span>

          {onCloseGame && (
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                onCloseGame();
              }}
              className="ml-3 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 rounded text-xs"
              title="Return to standard docket view"
            >
              EXIT SIM
            </button>
          )}
        </div>
      </div>

      {/* STAGE 1: BUILD THE CASE */}
      {currentStage === 'stage1_build' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 bg-zinc-950/80 border border-red-900/60 rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-xs text-amber-400 font-bold uppercase flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>PHASE 1: ASSEMBLE THE PROSECUTION INDICTMENT</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                TASK: Select target suspect &bull; Statutory charge &bull; 3 Admitted Exhibits
              </span>
            </div>
            <p className="text-xs font-tech text-zinc-300 leading-relaxed">
              Your mandate as Special Assistant U.S. Attorney is to construct an airtight case based strictly on verified records. Review the documented persons of interest, select the statutory charges, and assemble your core evidentiary exhibits before stepping into the courtroom.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1A: Select Person of Interest */}
            <div className="retro-window p-4 bg-[#0a0d11] space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-pixel text-[11px] text-red-400 uppercase font-bold flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>1. SELECT TARGET OF INDICTMENT</span>
                </span>
                <span className="text-[10px] text-zinc-500">
                  {caseData.personsOfInterest?.length || 0} PROFILES
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {caseData.personsOfInterest && caseData.personsOfInterest.length > 0 ? (
                  caseData.personsOfInterest.map((poi) => (
                    <button
                      key={poi.id}
                      onClick={() => {
                        soundEngine.playKeyClick();
                        setSelectedTargetPoiId(poi.id);
                      }}
                      className={`w-full p-2.5 text-left rounded border text-xs transition-all flex flex-col space-y-1 ${
                        selectedTargetPoiId === poi.id
                          ? 'bg-red-950/50 border-red-500 text-zinc-100 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-200">{poi.name}</span>
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded uppercase font-pixel ${
                            poi.status === 'Convicted'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : poi.status === 'Indicted'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {poi.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 line-clamp-1">{poi.role}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-zinc-500 p-3">No profiles listed.</div>
                )}
              </div>

              {targetPoi && (
                <div className="p-3 bg-black/60 border border-zinc-800 rounded text-[11px] space-y-1 text-zinc-300">
                  <div className="text-[10px] font-pixel text-zinc-500 uppercase">
                    Documented Status in Real Records:
                  </div>
                  <div>
                    <strong className="text-zinc-200">Outcome:</strong> {targetPoi.outcome || 'Pending'}
                  </div>
                  <div className="line-clamp-2 text-zinc-400 text-[10px]">
                    {targetPoi.verifiedFindings || targetPoi.allegations}
                  </div>
                </div>
              )}
            </div>

            {/* Step 1B: Select Statutory Charge */}
            <div className="retro-window p-4 bg-[#0a0d11] space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-pixel text-[11px] text-amber-400 uppercase font-bold flex items-center space-x-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  <span>2. SELECT STATUTORY CHARGE</span>
                </span>
                <span className="text-[10px] text-zinc-500">CRIMINAL CODE</span>
              </div>

              <div className="space-y-2">
                {caseData.courtroom?.charges && caseData.courtroom.charges.length > 0 ? (
                  caseData.courtroom.charges.map((charge, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        soundEngine.playKeyClick();
                        setSelectedChargeIndex(idx);
                      }}
                      className={`w-full p-2.5 text-left rounded border text-xs transition-colors flex items-start space-x-2 ${
                        selectedChargeIndex === idx
                          ? 'bg-amber-950/50 border-amber-500 text-amber-200 font-bold'
                          : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="font-pixel text-red-500 text-[10px] mt-0.5">
                        COUNT {idx + 1}:
                      </span>
                      <span className="leading-snug">{charge}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-zinc-400 bg-black/50 border border-zinc-800 rounded">
                    Statutory Indictment Count: General Criminal Docket Offenses.
                  </div>
                )}
              </div>

              <div className="p-3 bg-black/60 border border-zinc-800 rounded text-[11px] text-zinc-400 space-y-1">
                <span className="text-[10px] font-pixel text-zinc-500 uppercase block">
                  Judicial Venue:
                </span>
                <div className="text-zinc-300 font-bold">
                  {caseData.courtroom?.court || 'United States District Court'}
                </div>
                <div>Judge: {caseData.courtroom?.presidingJudge || 'District Magistrate'}</div>
              </div>
            </div>

            {/* Step 1C: Select 3 Key Evidence Exhibits */}
            <div className="retro-window p-4 bg-[#0a0d11] space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-pixel text-[11px] text-emerald-400 uppercase font-bold flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>3. SELECT 3 CORE EXHIBITS</span>
                </span>
                <span
                  className={`text-[10px] font-pixel ${
                    selectedExhibitIds.length === 3 ? 'text-emerald-400 font-bold' : 'text-amber-400'
                  }`}
                >
                  {selectedExhibitIds.length}/3 SELECTED
                </span>
              </div>

              <p className="text-[11px] text-zinc-400">
                Click exhibits below to add them to your trial bundle. Maximum 3 core exhibits.
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {caseData.evidence && caseData.evidence.length > 0 ? (
                  caseData.evidence.map((ev, i) => {
                    const isSelected = selectedExhibitIds.includes(ev.id);
                    return (
                      <button
                        key={ev.id || i}
                        onClick={() => toggleExhibit(ev.id)}
                        className={`w-full p-2 text-left rounded border text-xs transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold'
                            : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="text-[9px] font-pixel text-red-400 mr-1.5">
                            {ev.exhibitNumber || `EX-${i + 1}`}
                          </span>
                          <span className="text-zinc-200">{ev.title}</span>
                        </div>
                        <span className="text-[9px] uppercase text-zinc-500 shrink-0">
                          {isSelected ? '✓ ADMITTED' : ev.type}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-xs text-zinc-500 p-3">No exhibits available.</div>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar to Enter Courtroom */}
          <div className="p-4 bg-[#0c1015] border-2 border-red-900 rounded flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-pixel text-zinc-400 uppercase">
                PROSECUTION BUNDLE STATUS:
              </div>
              <div className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                <span>Indicting:</span>
                <span className="text-red-400">{targetPoi?.name || 'Selected Suspect'}</span>
                <span className="text-zinc-500">&bull;</span>
                <span>Exhibits Ready:</span>
                <span
                  className={selectedExhibitIds.length >= 2 ? 'text-emerald-400' : 'text-amber-400'}
                >
                  {selectedExhibitIds.length} Exhibits Admitted
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToTrial}
              disabled={selectedExhibitIds.length === 0}
              className={`retro-btn px-6 py-3 text-xs font-pixel flex items-center space-x-2 shadow-xl ${
                selectedExhibitIds.length > 0
                  ? 'retro-btn-red text-white hover:scale-105 transition-transform'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
              }`}
            >
              <span>FILE INDICTMENT & STEP INTO THE COURTROOM</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: FACE THE DEFENCE & TEST THE ARGUMENT */}
      {currentStage === 'stage2_defense' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Round Header & Trial Score */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0e14] p-3.5 border border-zinc-800 rounded">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 bg-red-950 border border-red-700 text-red-400 font-pixel text-xs rounded">
                ROUND {currentRoundIndex + 1} OF {rounds.length}
              </span>
              <span className="text-xs font-pixel text-zinc-300 font-bold uppercase">
                {currentRound.issueTitle}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-zinc-400">Current Prosecution Strength:</span>
              <div className="flex items-center space-x-2">
                <div className="w-28 h-3 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${prosecutionStrengthPercent}%` }}
                  />
                </div>
                <span className="text-emerald-400 font-bold font-pixel">
                  {prosecutionStrengthPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* STEP 1: PROSECUTION CLAIM PROMPT */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-900/60 rounded space-y-1">
            <span className="font-pixel text-[10px] text-emerald-400 uppercase font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>GOVERNMENT CLAIM SUBMITTED:</span>
            </span>
            <p className="text-xs sm:text-sm font-tech text-zinc-200 leading-relaxed font-bold">
              {currentRound.claimPrompt}
            </p>
          </div>

          {/* STEP 2: DEFENCE CHALLENGE & OBJECTION */}
          <div className="p-5 bg-red-950/30 border-2 border-red-900/80 rounded space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-red-900/60 pb-2">
              <div className="flex items-center space-x-2 text-red-400 font-pixel text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                <span>{currentRound.defenseObjectionTitle}</span>
              </div>
              <span className="retro-stamp text-[8px] py-0 px-2 text-amber-400 border-amber-800">
                DEFENSE MOTION FILED
              </span>
            </div>

            <div className="p-3 bg-black/70 border border-red-950 rounded text-xs sm:text-sm font-mono text-zinc-200 italic leading-relaxed">
              {currentRound.defenseArgumentText}
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-tech">
              <span>
                <strong className="text-zinc-300 font-pixel text-[10px]">LEGAL GROUNDS:</strong>{' '}
                {currentRound.defenseLegalBasis}
              </span>
              <span className="text-red-400 font-pixel text-[10px]">
                BURDEN: PROSECUTION MUST REBUT
              </span>
            </div>
          </div>

          {/* STEP 3: VISITOR'S RESPONSE OPTIONS (TACTICAL TRIAL STRATEGY) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-xs text-amber-400 uppercase font-bold flex items-center space-x-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>CHOOSE YOUR PROSECUTORIAL RESPONSE USING THE RECORD:</span>
              </span>
              <span className="text-[10px] text-zinc-500">SELECT 1 OPTION TO PRESENT TO BENCH</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentRound.options.map((opt, i) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    disabled={hasEvaluatedRound}
                    onClick={() => {
                      soundEngine.playKeyClick();
                      setSelectedOptionId(opt.id);
                    }}
                    className={`p-4 text-left rounded border transition-all text-xs flex flex-col space-y-2 ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 text-zinc-100 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : hasEvaluatedRound
                        ? 'bg-black/30 border-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-[#090c10] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-[#0d1217]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[11px] text-red-400 font-bold">
                        OPTION {String.fromCharCode(65 + i)}: {opt.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono">
                        {isSelected ? '✓ CHOSEN STRATEGY' : 'TACTICAL PLEA'}
                      </span>
                    </div>

                    <p className="text-xs font-tech text-zinc-200 leading-relaxed">
                      {opt.tacticalAction}
                    </p>

                    <div className="text-[10px] font-pixel text-zinc-400 pt-1 border-t border-zinc-900 flex items-center justify-between">
                      <span>EVIDENTIARY BASIS: {opt.evidenceNexus}</span>
                      <span className="text-amber-500 font-mono">
                        {isSelected && !hasEvaluatedRound ? 'READY TO ARGUE' : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Submit Response Button */}
            {!hasEvaluatedRound && (
              <div className="pt-2 flex justify-end">
                <button
                  disabled={!selectedOptionId}
                  onClick={handleSubmitResponse}
                  className={`retro-btn px-6 py-2.5 text-xs font-pixel flex items-center space-x-2 ${
                    selectedOptionId
                      ? 'retro-btn-red text-white hover:scale-105 transition-transform shadow-lg'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                  }`}
                >
                  <Gavel className="w-4 h-4 mr-1" />
                  <span>PRESENT ARGUMENT TO PRESIDING JUDGE</span>
                </button>
              </div>
            )}
          </div>

          {/* STEP 4: SIMULATED JUDGE EVALUATION SCREEN */}
          {hasEvaluatedRound && (
            <div className="retro-window p-5 bg-[#05080c] border-2 border-amber-600/80 rounded space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-amber-900/60 pb-2">
                <div className="flex items-center space-x-2 text-amber-400 font-pixel text-xs font-bold">
                  <Gavel className="w-5 h-5 text-amber-400 animate-bounce" />
                  <span>
                    BENCH RULING // {caseData.courtroom?.presidingJudge || 'THE DISTRICT COURT'}
                  </span>
                </div>
                <span className="retro-stamp text-[9px] py-0 px-2 text-emerald-400 border-emerald-700">
                  OFFICIAL RECORDED RULING
                </span>
              </div>

              {/* Typed Terminal Text */}
              <div className="p-4 bg-black/80 border border-zinc-800 rounded font-mono text-xs sm:text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
                {typedJudgeRuling}
                {isTypingJudgeRuling && <span className="animate-pulse text-amber-400">█</span>}
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded text-[11px] font-tech text-zinc-400 flex items-center justify-between">
                <span>
                  <strong>BENCH NOTICE:</strong> Evaluates corroboration under Federal Rules of
                  Evidence. Educational simulation; does not predict real judicial discretion.
                </span>
                <span className="font-pixel text-amber-400 text-[10px]">
                  POINTS AWARDED: +
                  {currentRound.options.find((o) => o.id === selectedOptionId)?.points || 0}
                </span>
              </div>

              {/* Reveal Real Case Comparison Toggle */}
              <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    soundEngine.playKeyClick();
                    setRevealedRealCase(!revealedRealCase);
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-amber-600/60 text-amber-300 rounded text-xs font-pixel flex items-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {revealedRealCase
                      ? 'HIDE HISTORICAL DOCKET TRANSCRIPT'
                      : 'COMPARE WITH REAL TRIAL DOCKET RECORD'}
                  </span>
                </button>

                <button
                  onClick={handleNextRound}
                  className="retro-btn retro-btn-green px-5 py-2 text-xs font-pixel flex items-center space-x-2"
                >
                  <span>
                    {currentRoundIndex + 1 < rounds.length
                      ? 'PROCEED TO NEXT TRIAL ROUND'
                      : 'PROCEED TO FINAL TRIAL & VERDICT'}
                  </span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {/* Real Case Comparison Drawer */}
              {revealedRealCase && (
                <div className="p-4 bg-[#0a0d14] border-2 border-blue-900/80 rounded space-y-3 text-xs font-mono animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-blue-900 pb-1.5">
                    <span className="font-pixel text-[11px] text-blue-400 font-bold uppercase">
                      HISTORICAL CASE PROCEEDINGS: HOW THE COURT ACTUALLY HANDLED THIS ISSUE
                    </span>
                    <span className="retro-stamp text-[8px] py-0 px-2 text-blue-300 border-blue-700">
                      SOURCED RECORD
                    </span>
                  </div>

                  <div className="space-y-2 text-zinc-300 font-tech">
                    <p className="font-bold text-zinc-200">
                      {currentRound.realCaseComparison.historicalIssue}
                    </p>
                    <div className="p-3 bg-black/60 border border-blue-950 rounded space-y-1">
                      <strong className="text-emerald-400 font-pixel text-[10px] block">
                        ACTUAL PROSECUTION STRATEGY IN COURT:
                      </strong>
                      <p className="italic text-zinc-200">
                        "{currentRound.realCaseComparison.actualProsecutionAction}"
                      </p>
                    </div>

                    <div className="p-3 bg-black/60 border border-red-950 rounded space-y-1">
                      <strong className="text-red-400 font-pixel text-[10px] block">
                        ACTUAL DEFENSE COUNTER-ARGUMENT:
                      </strong>
                      <p className="italic text-zinc-300">
                        "{currentRound.realCaseComparison.actualDefenseAction}"
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] font-pixel text-zinc-500 pt-1 border-t border-blue-950">
                    TRANSCRIPT CITATION: {currentRound.realCaseComparison.docketCitation}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STAGE 5: FINAL TRIAL REVIEW & SEALED VERDICT REVEAL / COLD CASE RESOLUTION */}
      {currentStage === 'stage5_final' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Final Trial Evaluation Score Card */}
          <div className="p-6 bg-[#080c10] border-2 border-red-900/80 rounded space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="font-pixel text-[11px] text-red-500 uppercase font-bold tracking-widest block">
                  CLERK OF COURT // TRIAL SIMULATION COMPLETE
                </span>
                <h4 className="text-xl font-bold font-editorial text-zinc-100">
                  Comprehensive Prosecution Docket Assessment
                </h4>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                  Defendant / Target: {targetPoi?.name || 'Primary Suspect'} &bull; Docket Ref:{' '}
                  {caseData.caseNumber}
                </div>
              </div>

              {/* Prosecution Strength Score Display */}
              <div className="text-right">
                <span className="font-pixel text-[10px] text-zinc-500 uppercase block mb-1">
                  Overall Evidentiary Strength Score
                </span>
                <div className="text-3xl font-bold font-pixel text-emerald-400">
                  {prosecutionStrengthPercent}%
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {totalScore} of {maxPossibleScore} Points Achieved
                </div>
              </div>
            </div>

            {/* Grade & Analysis Banner */}
            <div className={`p-4 rounded border text-xs space-y-2 ${gradeInfo.badgeColor}`}>
              <div className="font-pixel text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>{gradeInfo.grade}</span>
              </div>
              <p className="font-tech text-zinc-200 text-xs sm:text-sm leading-relaxed">
                {gradeInfo.assessment}
              </p>
            </div>

            {/* Trial Strengths vs Weaknesses Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/60 rounded space-y-2">
                <div className="font-pixel text-[11px] text-emerald-400 uppercase font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>PROSECUTORIAL STRENGTHS ESTABLISHED:</span>
                </div>
                <ul className="space-y-1.5 text-zinc-300 font-tech text-[11px]">
                  <li>
                    &bull; Form FD-302 contemporaneous recovery protocols preserved exhibit integrity.
                  </li>
                  <li>
                    &bull; Hearsay objections overcome via Rule 803 recorded recollection exceptions.
                  </li>
                  <li>
                    &bull; Converging physical evidence satisfied the Jackson v. Virginia legal threshold.
                  </li>
                  <li>
                    &bull; Admitted exhibits: {selectedExhibitIds.length} exhibits formally entered into the record.
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-red-950/20 border border-red-900/60 rounded space-y-2">
                <div className="font-pixel text-[11px] text-red-400 uppercase font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>POINTS OF ADVERSARIAL VULNERABILITY:</span>
                </div>
                <ul className="space-y-1.5 text-zinc-300 font-tech text-[11px]">
                  <li>
                    &bull; Defense motions exposed potential alternative suspect hypotheses requiring continuous rebuttal.
                  </li>
                  <li>
                    &bull; Circumstantial chains remain vulnerable if forensic samples are re-tested with higher resolution.
                  </li>
                  <li>
                    &bull; Burden of beyond a reasonable doubt requires unanimous juror assent.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* VERDICT REVEAL / UNRESOLVED COLD CASE REVIEW SECTION */}
          <div className="retro-window p-6 bg-[#06080b] border-2 border-zinc-800 rounded space-y-4">
            {isColdCase ? (
              /* Cold Case Review: No invented verdict */
              <div className="border border-amber-900/80 bg-amber-950/20 p-5 rounded space-y-4">
                <div className="flex items-center space-x-2 text-amber-400 font-pixel text-xs">
                  <HelpCircle className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="font-bold uppercase tracking-wider">
                    UNRESOLVED CASE REVIEW &bull; COLD CASE ADJUDICATION
                  </span>
                </div>

                <div className="text-base font-bold font-editorial text-zinc-100">
                  NO JURY VERDICT RENDERED &bull; UNRESOLVED SCIENTIFIC & PROCEDURAL LEADS
                </div>

                <p className="text-xs font-tech text-zinc-300 leading-relaxed">
                  In strict accordance with archival integrity, this courtroom simulator does NOT fabricate a guilty verdict or invent an outcome where no court has adjudicated the crime. In this investigation, the evidence did not reach a formal trial or remains under active genealogical review.
                </p>

                <div className="p-4 bg-black/70 border border-amber-900/60 rounded space-y-2 font-mono text-xs text-amber-200">
                  <div className="font-pixel text-[10px] text-amber-400 uppercase">
                    Documented Unanswered Questions & Pending Inquiries:
                  </div>
                  <p className="leading-relaxed">
                    {caseData.verdict?.unresolvedLegalQuestions ||
                      'Key physical DNA profiles remain untyped or unmatched against modern federal genealogical databases; several witnesses have not been deposed under subpoena.'}
                  </p>
                </div>

                <div className="text-[10px] font-pixel text-zinc-400 flex items-center justify-between border-t border-amber-900/40 pt-3">
                  <span>DOCKET STATUS: ACTIVE REVIEW / COLD CASE RE-EXAMINATION</span>
                  <span>JURISDICTION: {caseData.overview?.jurisdiction || caseData.location}</span>
                </div>
              </div>
            ) : !verdictUnsealed ? (
              /* Adjudicated Cases: GATED VERDICT UNSEALING BUTTON */
              <div className="p-8 border-2 border-dashed border-red-900/80 bg-black/90 rounded text-center space-y-4 font-mono text-xs">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-950/80 border border-red-700 flex items-center justify-center text-red-400">
                  <Lock className="w-7 h-7 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <span className="font-pixel text-[11px] text-red-500 uppercase font-bold tracking-widest block">
                    [FINAL TRIAL ADJUDICATION &bull; SEALED HISTORICAL VERDICT]
                  </span>
                  <h4 className="text-lg font-bold font-editorial text-zinc-100">
                    You have concluded the simulated prosecution.
                  </h4>
                </div>

                <p className="max-w-lg mx-auto text-zinc-400 font-tech leading-relaxed">
                  The actual verdict of the jury and sentencing decree from the presiding judge have been kept sealed while you presented your case. Click below to unseal the official historical resolution.
                </p>

                {isUnsealingVerdict ? (
                  <div className="max-w-xs mx-auto space-y-2 font-mono">
                    <div className="text-amber-400 font-pixel text-[10px]">
                      DE-ENCRYPTING CLERK OF COURT DECREE... {unsealProgress}%
                    </div>
                    <div className="h-2.5 bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all duration-75"
                        style={{ width: `${unsealProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleUnsealVerdict}
                    className="retro-btn retro-btn-red px-6 py-3 text-xs font-pixel inline-flex items-center space-x-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 transition-transform"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    <span>UNSEAL REAL HISTORICAL VERDICT & SENTENCING ORDER</span>
                  </button>
                )}
              </div>
            ) : (
              /* Adjudicated Cases: Formally Unsealed Verdict Record */
              <div className="border-2 border-red-900/80 bg-red-950/20 p-6 rounded space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-red-900/60 pb-3">
                  <div className="flex items-center space-x-2 text-red-400 font-pixel text-xs">
                    <Gavel className="w-6 h-6 text-red-400" />
                    <span className="font-bold uppercase tracking-wider text-sm">
                      OFFICIAL JUDICIAL DISPOSITION & VERDICT (UNSEALED)
                    </span>
                  </div>
                  <span className="retro-stamp text-[10px] py-0.5 px-2.5">
                    VERDICT DATE: {caseData.verdict?.verdictDate || caseData.year}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-pixel text-zinc-400 uppercase">
                    Plea or Jury Verdict:
                  </span>
                  <div className="text-base sm:text-lg font-bold font-editorial text-zinc-100">
                    {caseData.verdict?.pleaOrVerdict || 'Plea Agreement / Jury Verdict Entered'}
                  </div>
                </div>

                <div className="p-4 bg-black/80 border border-zinc-800 rounded font-mono text-xs text-zinc-200 space-y-1">
                  <strong className="text-amber-400 font-pixel text-[10px] block">
                    IMPOSED JUDICIAL SENTENCE:
                  </strong>
                  <p className="leading-relaxed">
                    {caseData.verdict?.sentencing || 'Recorded in official judgment order.'}
                  </p>
                </div>

                {caseData.verdict?.appealsAndRulings && (
                  <div className="text-xs font-tech text-zinc-300 leading-relaxed border-t border-zinc-800 pt-3">
                    <strong className="text-zinc-400 font-pixel text-[10px] block mb-1">
                      APPELLATE RECORD & SUBSEQUENT JUDICIAL PROCEEDINGS:
                    </strong>
                    {caseData.verdict.appealsAndRulings}
                  </div>
                )}
              </div>
            )}

            {/* Trial Control Footer (Restart / View Exhibits / Exit) */}
            <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleRestartGame}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-xs font-pixel flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RE-TRY PROSECUTION SIMULATION</span>
              </button>

              <div className="flex items-center space-x-2">
                {onViewExhibits && (
                  <button
                    onClick={onViewExhibits}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-emerald-700/60 text-emerald-300 rounded text-xs font-pixel flex items-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>INSPECT FULL EXHIBIT VAULT</span>
                  </button>
                )}
                {onCloseGame && (
                  <button
                    onClick={onCloseGame}
                    className="retro-btn retro-btn-red px-5 py-2 text-xs font-pixel"
                  >
                    RETURN TO CASE DOSSIER
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
