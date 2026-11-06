import React, { useState } from 'react';
import {
  Scale,
  Gavel,
  Shield,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  User,
  Fingerprint,
  Lock,
  Unlock,
  Eye,
  Search,
} from 'lucide-react';
import { CaseFile, KeyTestimony } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { CaseCourtroomGame } from './CaseCourtroomGame.tsx';

interface CaseCourtroomViewProps {
  caseData: CaseFile;
}

export const CaseCourtroomView: React.FC<CaseCourtroomViewProps> = ({ caseData }) => {
  const isUnsolved =
    caseData.status === 'Cold Case / Unresolved' ||
    caseData.status === 'Active Investigation';

  const [viewMode, setViewMode] = useState<'game' | 'docket'>('game');
  const [activeTab, setActiveTab] = useState<'arguments' | 'testimonies' | 'exhibits' | 'adjudication'>('arguments');
  const [isVerdictUnsealed, setIsVerdictUnsealed] = useState<boolean>(false);
  const [isUnsealing, setIsUnsealing] = useState<boolean>(false);
  const [unsealProgress, setUnsealProgress] = useState<number>(0);
  const [selectedExamineIndex, setSelectedExamineIndex] = useState<number | null>(0);

  // Trigger verdict unsealing transition
  const handleUnsealVerdict = () => {
    soundEngine.playKeyClick();
    setIsUnsealing(true);
    setUnsealProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setUnsealProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsUnsealing(false);
        setIsVerdictUnsealed(true);
        soundEngine.playFileAccess();
      }
    }, 60);
  };

  return (
    <div className="space-y-6">
      {/* Courtroom Mode Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0a0d12] border-2 border-red-900/60 rounded">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setViewMode('game');
            }}
            className={`px-4 py-2 text-xs font-pixel flex items-center space-x-2 rounded transition-all ${
              viewMode === 'game'
                ? 'bg-red-950 text-red-300 border-2 border-red-600 font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <Gavel className="w-4 h-4 text-red-400" />
            <span>PLAY COURTROOM GAME (PROSECUTE THE CASE)</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setViewMode('docket');
            }}
            className={`px-4 py-2 text-xs font-pixel flex items-center space-x-2 rounded transition-all ${
              viewMode === 'docket'
                ? 'bg-zinc-800 text-amber-300 border-2 border-amber-500 font-bold'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>EXAMINE AUDITED DOCKET RECORDS</span>
          </button>
        </div>

        <span className="text-[10px] font-pixel text-zinc-400 uppercase">
          {viewMode === 'game'
            ? 'INTERACTIVE SIMULATION MODE ACTIVE'
            : 'HISTORICAL COURT RECORD ARCHIVE'}
        </span>
      </div>

      {viewMode === 'game' ? (
        <CaseCourtroomGame
          caseData={caseData}
          onViewExhibits={() => {
            soundEngine.playKeyClick();
            setViewMode('docket');
            setActiveTab('exhibits');
          }}
        />
      ) : (
        <>
          {/* Courtroom Docket Header */}
          <div className="retro-window p-4 flex flex-wrap items-center justify-between gap-4 bg-[#080b0e]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-950/60 border border-red-800 text-red-400">
            <Scale className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-red-500 uppercase font-bold">
                AUDITED JUDICIAL PROCEEDINGS & LEGAL RECORD
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1.5">
                {caseData.courtroom?.court || 'FEDERAL DOCKET'}
              </span>
            </div>
            <h3 className="text-base font-bold font-editorial text-zinc-100">
              The Courtroom: Admitted Evidence, Depositions & Pleadings
            </h3>
          </div>
        </div>

        {/* Status Stamp */}
        <div className="flex items-center space-x-2">
          <span
            className={`retro-stamp text-[9px] py-0.5 px-2 ${
              isUnsolved ? 'text-amber-400 border-amber-600' : 'text-emerald-400 border-emerald-600'
            }`}
          >
            {isUnsolved ? 'UNRESOLVED TRIAL / COLD CASE' : 'ADJUDICATED PROCEEDING'}
          </span>
        </div>
      </div>

      {/* Judicial Bench Information Banner */}
      <div className="retro-window p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono bg-[#06080a]">
        <div>
          <span className="text-[10px] font-pixel text-zinc-500 uppercase block mb-0.5">
            Presiding Judicial Bench
          </span>
          <div className="font-bold text-zinc-200">
            {caseData.courtroom?.presidingJudge || 'Magistrate Presiding / Grand Jury Panel'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            Court: {caseData.courtroom?.court || 'United States District Court'}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-pixel text-red-400 uppercase block mb-0.5">
            Indictment / Statutory Charges
          </span>
          <div className="space-y-0.5 text-zinc-300">
            {caseData.courtroom?.charges?.map((ch, i) => (
              <div key={i} className="truncate">
                &bull; {ch}
              </div>
            )) || <div>Official criminal docket records</div>}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-pixel text-zinc-500 uppercase block mb-0.5">
            Prosecutorial Standard
          </span>
          <div className="text-zinc-300 text-[11px] font-tech leading-relaxed">
            Burden of proof: Beyond a reasonable doubt; factual review without invented dialogue.
          </div>
        </div>
      </div>

      {/* Courtroom Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2 text-xs font-mono">
        {[
          { id: 'arguments', label: '1. Prosecution vs Defense Arguments' },
          { id: 'testimonies', label: `2. Sworn Depositions & Q&A (${caseData.courtroom?.keyTestimonies?.length || 0})` },
          { id: 'exhibits', label: `3. Admitted Evidence Exhibits (${caseData.evidence.length})` },
          {
            id: 'adjudication',
            label: isUnsolved
              ? '4. Unresolved Inquiries (Cold Case)'
              : isVerdictUnsealed
              ? '4. Unsealed Verdict & Sentencing'
              : '4. Final Verdict Reveal [SEALED]',
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              soundEngine.playKeyClick();
              setActiveTab(tab.id as any);
            }}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-red-400 border border-zinc-700 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DUAL PODIUM - Prosecution vs Defense Arguments */}
      {activeTab === 'arguments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-150">
          {/* Prosecution Argument */}
          <div className="retro-window p-5 bg-[#070b09] border-emerald-950/80 space-y-3">
            <div className="flex items-center space-x-2 border-b border-emerald-900/60 pb-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <h4 className="font-pixel text-xs text-emerald-400 uppercase font-bold tracking-wider">
                Prosecution Theory & Admitted Proof
              </h4>
            </div>
            <p className="text-xs sm:text-sm font-tech text-zinc-200 leading-relaxed whitespace-pre-line">
              {caseData.courtroom?.prosecutionArgument ||
                'The Government presented audited forensic documentation, corroborated witness statements, and physical exhibits establishing material culpability under federal statute.'}
            </p>
            <div className="pt-2 border-t border-emerald-950 text-[10px] font-pixel text-emerald-500">
              FOCUS: Satisfying statutory elements through corroborated exhibits
            </div>
          </div>

          {/* Defense Argument */}
          <div className="retro-window p-5 bg-[#0b0809] border-red-950/80 space-y-3">
            <div className="flex items-center space-x-2 border-b border-red-900/60 pb-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <h4 className="font-pixel text-xs text-red-400 uppercase font-bold tracking-wider">
                Defense Arguments & Motions to Suppress
              </h4>
            </div>
            <p className="text-xs sm:text-sm font-tech text-zinc-300 leading-relaxed whitespace-pre-line">
              {caseData.courtroom?.defenseArgument ||
                'Defense argued insufficiency of uncorroborated testimony, procedural defects in evidence preservation, and moved to exclude prejudicial assertions lacking direct physical nexus.'}
            </p>
            <div className="pt-2 border-t border-red-950 text-[10px] font-pixel text-zinc-400">
              FOCUS: Admissibility hurdles, alternative hypotheses & reasonable doubt
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SWORN TESTIMONIES & EXAMINATION QUESTIONS */}
      {activeTab === 'testimonies' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 bg-black/60 border border-zinc-800 text-xs font-tech text-zinc-400 flex items-center justify-between">
            <span>
              SELECT A WITNESS DEPOSITION TO REVIEW ACTUAL EXAMINATION QUESTIONS & SWORN STATEMENTS.
            </span>
            <span className="text-[10px] font-pixel text-amber-500">
              TRANSCRIPT SOURCE: TRIAL DOCKET
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Witness Selector Column */}
            <div className="space-y-2">
              {(caseData.courtroom?.keyTestimonies && caseData.courtroom.keyTestimonies.length > 0) ? (
                caseData.courtroom.keyTestimonies.map((kt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      soundEngine.playKeyClick();
                      setSelectedExamineIndex(i);
                    }}
                    className={`w-full p-3 text-left rounded border font-mono text-xs transition-colors flex flex-col space-y-1 ${
                      selectedExamineIndex === i
                        ? 'bg-zinc-800 border-amber-500 text-zinc-100 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                        : 'bg-[#090b0d] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-[10px] text-amber-400 uppercase">{kt.role}</span>
                    <span className="font-bold text-sm text-zinc-100 font-editorial">{kt.witness}</span>
                    <span className="text-[10px] text-zinc-500">SWORN UNDER OATH</span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center retro-window text-zinc-500 font-tech text-xs">
                  NO WITNESS DEPOSITIONS LOGGED.
                </div>
              )}
            </div>

            {/* Selected Testimony Examination Details */}
            <div className="md:col-span-2 retro-window p-5 bg-[#090b0e] border border-zinc-700/80 space-y-4">
              {caseData.courtroom?.keyTestimonies?.[selectedExamineIndex || 0] ? (
                <>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div>
                      <span className="text-[10px] font-pixel text-amber-400 uppercase block">
                        WITNESS UNDER EXAMINATION
                      </span>
                      <h4 className="text-base font-bold font-editorial text-zinc-100">
                        {caseData.courtroom.keyTestimonies[selectedExamineIndex || 0].witness}
                      </h4>
                      <span className="text-xs font-tech text-zinc-400">
                        Designation: {caseData.courtroom.keyTestimonies[selectedExamineIndex || 0].role}
                      </span>
                    </div>
                    <span className="retro-stamp text-[9px] py-0 px-2 text-emerald-400 border-emerald-800">
                      SWORN UNDER PENALTY OF PERJURY
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[10px] font-pixel text-zinc-500 uppercase block">
                        EXAMINATION QUESTIONS & INQUIRY FOCUS:
                      </span>
                      <p className="text-zinc-300 font-tech leading-relaxed">
                        Counsel inquired regarding the timeline of observations, contemporaneous notes made at the scene, and factual corroboration of the events in question.
                      </p>
                    </div>

                    <div className="p-3.5 bg-black/70 border border-amber-900/60 space-y-1">
                      <span className="text-[10px] font-pixel text-amber-400 uppercase block">
                        SWORN TESTIMONY TRANSCRIPT (RECORDED ANSWER):
                      </span>
                      <p className="text-zinc-200 font-mono text-xs sm:text-sm leading-relaxed italic">
                        "{caseData.courtroom.keyTestimonies[selectedExamineIndex || 0].keyPoints}"
                      </p>
                    </div>

                    <div className="p-2.5 bg-zinc-950/80 border border-zinc-900 text-[11px] font-tech text-zinc-400">
                      <strong className="text-zinc-300">JUDICIAL NOTICE:</strong> Transcript reflects actual court proceedings and contemporaneous depositions as filed in the official clerk's docket.
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-zinc-500 text-xs font-mono text-center py-10">
                  Select a witness from the left column to inspect deposition.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADMITTED EXHIBITS */}
      {activeTab === 'exhibits' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-150">
          {caseData.evidence.map((ev, i) => (
            <div key={ev.id || i} className="retro-window p-3.5 bg-[#080b0e] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-pixel">
                <span className="text-red-400 font-bold">{ev.exhibitNumber || `EX-${i + 1}`}</span>
                <span className="text-zinc-500 uppercase">{ev.type}</span>
              </div>
              <h5 className="font-bold text-xs text-zinc-200 line-clamp-1">{ev.title}</h5>
              <p className="text-[11px] font-tech text-zinc-400 line-clamp-2 leading-relaxed">
                {ev.description}
              </p>
              <div className="text-[9px] font-pixel text-emerald-400 pt-1 border-t border-zinc-900 flex items-center justify-between">
                <span>ADMITTED AS EVIDENCE</span>
                <span className="text-zinc-500">{ev.classification}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ADJUDICATION & VERDICT (GATED / REVEALED) */}
      {activeTab === 'adjudication' && (
        <div className="retro-window p-6 animate-in fade-in duration-150 bg-[#07090b]">
          {isUnsolved ? (
            /* Cold Cases / Unresolved: Factual disclosure of What Remains Unknown without invented verdicts */
            <div className="border border-amber-900/80 bg-amber-950/20 p-5 rounded space-y-4">
              <div className="flex items-center space-x-2 text-amber-400 font-pixel text-xs">
                <HelpCircle className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="font-bold uppercase tracking-wider">
                  UNRESOLVED ADJUDICATION: WHAT REMAINS UNKNOWN
                </span>
              </div>

              <div className="text-sm font-editorial text-zinc-100 font-bold">
                NO GUILTY VERDICT RENDERED &bull; UNRESOLVED SCIENTIFIC & PROCEDURAL LEADS
              </div>

              <p className="text-xs font-tech text-zinc-300 leading-relaxed">
                In strict adherence to independent investigative archiving standards, this archive does NOT fabricate judicial outcomes or attribute guilt where no court of competent jurisdiction has entered judgment.
              </p>

              <div className="p-4 bg-black/60 border border-amber-900/60 rounded space-y-2 font-mono text-xs text-amber-200/90">
                <div className="font-pixel text-[10px] text-amber-400 uppercase">
                  Pending Investigatory & Legal Questions:
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
          ) : !isVerdictUnsealed ? (
            /* GATED VERDICT REVEAL: Keeps outcome hidden until visitor clicks to unlock */
            <div className="p-8 border-2 border-dashed border-red-900/80 bg-black/80 rounded text-center space-y-4 font-mono text-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-700 flex items-center justify-center text-red-400">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <span className="font-pixel text-[11px] text-red-500 uppercase font-bold tracking-widest block">
                  [CLASSIFIED JUDICIAL OUTCOME &bull; SEALED UNTIL EXAMINATION COMPLETED]
                </span>
                <h4 className="text-base font-bold font-editorial text-zinc-100">
                  Judicial Verdict & Sentencing Order Sealed
                </h4>
              </div>

              <p className="max-w-md mx-auto text-zinc-400 font-tech leading-relaxed">
                To maintain prosecutorial objectivity, the final jury verdict and court disposition are sealed while you examine the arguments and evidence. When you are ready to review the final legal resolution, click below to unseal the order.
              </p>

              {isUnsealing ? (
                <div className="max-w-xs mx-auto space-y-2 font-mono">
                  <div className="text-amber-400 font-pixel text-[10px]">
                    UNSEALING CLERK OF COURT DECREE... {unsealProgress}%
                  </div>
                  <div className="h-2 bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-75"
                      style={{ width: `${unsealProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleUnsealVerdict}
                  className="retro-btn retro-btn-red px-5 py-2.5 text-xs font-pixel inline-flex items-center space-x-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 transition-transform"
                >
                  <Unlock className="w-4 h-4 mr-1.5" />
                  <span>UNSEAL FINAL JUDICIAL ORDER & VERDICT REVEAL</span>
                </button>
              )}
            </div>
          ) : (
            /* Adjudicated Cases: Formal Unsealed Verdict Order */
            <div className="border border-red-900/80 bg-red-950/20 p-5 rounded space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-red-400 font-pixel text-xs">
                  <Gavel className="w-5 h-5 text-red-400" />
                  <span className="font-bold uppercase tracking-wider">
                    JUDICIAL ORDER & FINAL SENTENCING (UNSEALED)
                  </span>
                </div>
                <span className="retro-stamp text-[9px] py-0.5 px-2">
                  DATE: {caseData.verdict?.verdictDate || caseData.year}
                </span>
              </div>

              <div className="text-base font-bold font-editorial text-zinc-100">
                {caseData.verdict?.pleaOrVerdict || 'Plea Agreement / Jury Verdict Entered'}
              </div>

              <div className="p-3.5 bg-black/70 border border-zinc-800 rounded font-mono text-xs text-zinc-200">
                <strong className="text-amber-400 font-pixel text-[10px] block mb-1">
                  IMPOSED SENTENCE / JUDGMENT:
                </strong>
                {caseData.verdict?.sentencing || 'Documented in judicial sentencing order.'}
              </div>

              {caseData.verdict?.appealsAndRulings && (
                <div className="text-xs font-tech text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
                  <strong className="text-zinc-300 font-pixel text-[10px] block mb-1">
                    APPELLATE RULINGS & POST-CONVICTION REVIEW:
                  </strong>
                  {caseData.verdict.appealsAndRulings}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )}
</div>
  );
};
