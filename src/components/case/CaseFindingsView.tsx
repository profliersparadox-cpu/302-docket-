import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Shield,
  Search,
  Scale,
  ExternalLink,
} from 'lucide-react';
import { CaseFile } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface CaseFindingsViewProps {
  caseData: CaseFile;
}

export const CaseFindingsView: React.FC<CaseFindingsViewProps> = ({ caseData }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    confirmed: true,
    disputed: true,
    unanswered: true,
  });

  const toggleSection = (sec: string) => {
    soundEngine.playKeyClick();
    setExpandedSections((prev) => ({
      ...prev,
      [sec]: !prev[sec],
    }));
  };

  // Compile Confirmed Facts from audited records
  const confirmedFacts: string[] = [
    caseData.overview?.background ? `Background circumstances verified: ${caseData.overview.background}` : '',
    caseData.overview?.jurisdiction ? `Primary Investigating Jurisdiction: ${caseData.overview.jurisdiction}` : '',
    ...caseData.breakthrough?.turningPoints?.map(
      (tp) => `[${tp.date}] ${tp.title}: ${tp.detail || tp.description}`
    ) || [],
    ...(caseData.evidence || []).slice(0, 3).map(
      (ev) => `Forensic Exhibit ${ev.exhibitNumber || ev.id} corroborated: ${ev.title} (${ev.significance})`
    ),
    caseData.verdict?.pleaOrVerdict ? `Judicial Adjudication: ${caseData.verdict.pleaOrVerdict}` : '',
  ].filter(Boolean);

  // Compile Disputed Details & Allegations
  const disputedDetails: string[] = [
    caseData.courtroom?.defenseArgument ? `Defense Theory / Motion to Suppress: ${caseData.courtroom.defenseArgument}` : '',
    ...(caseData.personsOfInterest || [])
      .filter((p) => p.allegations)
      .map((p) => `Subject ${p.name} (${p.status}): Documented allegations and competing claims: ${p.allegations}`),
    caseData.courtroom?.prosecutionArgument && caseData.courtroom?.defenseArgument
      ? `Evidentiary Contradiction: Prosecution argued "${caseData.courtroom.prosecutionArgument.slice(0, 140)}..." contested by defense pleadings.`
      : '',
  ].filter(Boolean);

  // Compile Unanswered Questions & Open Inquiries
  const unansweredQuestions: string[] = [
    caseData.verdict?.unresolvedLegalQuestions ? caseData.verdict.unresolvedLegalQuestions : '',
    ...(caseData.reflectionPrompts || []).map(
      (rp) => `Investigative Dilemma: ${rp.question} (Procedural Context: ${rp.context})`
    ),
    caseData.status === 'Cold Case / Unresolved' || caseData.status === 'Active Investigation'
      ? `Open Lead Status: Case classified as ${caseData.status}. Primary perpetrators or institutional co-conspirators remain subject to active leads.`
      : '',
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="retro-window p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-400">
            <FileCheck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-emerald-500 uppercase font-bold">
                FORMAL INVESTIGATIVE FINDINGS REPORT
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1.5">FD-302 FINDINGS</span>
            </div>
            <h3 className="text-base font-bold font-editorial text-zinc-100">
              Audit of Verified Facts, Contested Proof & Open Queries
            </h3>
          </div>
        </div>

        <div className="text-xs font-tech text-zinc-400">
          CASE STATUS: <span className="text-red-400 font-bold">{caseData.status}</span>
        </div>
      </div>

      {/* SECTION 1: CONFIRMED FACTS */}
      <div className="retro-window border-emerald-900/60 overflow-hidden bg-[#07090b]">
        <button
          onClick={() => toggleSection('confirmed')}
          className="w-full p-4 bg-emerald-950/30 hover:bg-emerald-950/50 border-b border-emerald-900/60 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-pixel text-[10px] text-emerald-400 font-bold block">
                SECTION A &bull; ESTABLISHED & CORROBORATED
              </span>
              <h4 className="text-sm font-bold font-editorial text-zinc-100">
                1. Confirmed Factual Findings ({confirmedFacts.length})
              </h4>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-tech text-emerald-400">
            <span>{expandedSections.confirmed ? 'COLLAPSE' : 'EXPAND'}</span>
            {expandedSections.confirmed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {expandedSections.confirmed && (
          <div className="p-5 space-y-3 font-mono text-xs animate-in fade-in duration-150">
            <p className="text-zinc-400 font-tech text-xs leading-relaxed border-b border-zinc-800 pb-2">
              The following points represent judicially substantiated findings, verified forensic analyses, or documented public court judgments that have met evidentiary burdens.
            </p>
            <div className="space-y-2.5">
              {confirmedFacts.map((fact, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#0a0d10] border border-emerald-950/80 rounded flex items-start space-x-2.5"
                >
                  <span className="font-pixel text-[10px] text-emerald-500 font-bold shrink-0 mt-0.5">
                    [FACT 0{idx + 1}]
                  </span>
                  <p className="text-zinc-200 leading-relaxed font-tech text-xs sm:text-sm">
                    {fact}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: DISPUTED DETAILS & ALLEGATIONS */}
      <div className="retro-window border-amber-900/60 overflow-hidden bg-[#07090b]">
        <button
          onClick={() => toggleSection('disputed')}
          className="w-full p-4 bg-amber-950/30 hover:bg-amber-950/50 border-b border-amber-900/60 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-pixel text-[10px] text-amber-400 font-bold block">
                SECTION B &bull; COMPETING THEORIES & DEFENSES
              </span>
              <h4 className="text-sm font-bold font-editorial text-zinc-100">
                2. Disputed Details & Uncorroborated Allegations ({disputedDetails.length})
              </h4>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-tech text-amber-400">
            <span>{expandedSections.disputed ? 'COLLAPSE' : 'EXPAND'}</span>
            {expandedSections.disputed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {expandedSections.disputed && (
          <div className="p-5 space-y-3 font-mono text-xs animate-in fade-in duration-150">
            <p className="text-zinc-400 font-tech text-xs leading-relaxed border-b border-zinc-800 pb-2">
              Statements, claims, or theories that remain contested by opposing counsel, lack unanimous physical corroboration, or represent uncharged allegations.
            </p>
            <div className="space-y-2.5">
              {disputedDetails.map((disp, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#0a0d10] border border-amber-950/80 rounded flex items-start space-x-2.5"
                >
                  <span className="font-pixel text-[10px] text-amber-500 font-bold shrink-0 mt-0.5">
                    [DISPUTE 0{idx + 1}]
                  </span>
                  <p className="text-zinc-300 leading-relaxed font-tech text-xs sm:text-sm">
                    {disp}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: UNANSWERED QUESTIONS */}
      <div className="retro-window border-red-900/60 overflow-hidden bg-[#07090b]">
        <button
          onClick={() => toggleSection('unanswered')}
          className="w-full p-4 bg-red-950/30 hover:bg-red-950/50 border-b border-red-900/60 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-pixel text-[10px] text-red-400 font-bold block">
                SECTION C &bull; ANOMALIES & COLD CASE INQUIRIES
              </span>
              <h4 className="text-sm font-bold font-editorial text-zinc-100">
                3. Unanswered Questions & Open Inquiries ({unansweredQuestions.length})
              </h4>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-tech text-red-400">
            <span>{expandedSections.unanswered ? 'COLLAPSE' : 'EXPAND'}</span>
            {expandedSections.unanswered ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {expandedSections.unanswered && (
          <div className="p-5 space-y-3 font-mono text-xs animate-in fade-in duration-150">
            <p className="text-zinc-400 font-tech text-xs leading-relaxed border-b border-zinc-800 pb-2">
              Key procedural mysteries, unidentified parties, or legal questions that have not been conclusively resolved by historical proceedings or modern review.
            </p>
            <div className="space-y-2.5">
              {unansweredQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#0a0d10] border border-red-950/80 rounded flex items-start space-x-2.5"
                >
                  <span className="font-pixel text-[10px] text-red-500 font-bold shrink-0 mt-0.5">
                    [QUERY 0{idx + 1}]
                  </span>
                  <p className="text-zinc-300 leading-relaxed font-tech text-xs sm:text-sm">
                    {q}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
