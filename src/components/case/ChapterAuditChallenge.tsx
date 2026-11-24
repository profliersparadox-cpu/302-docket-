import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Scale, Shield } from 'lucide-react';
import { CaseFile } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface ChapterAuditChallengeProps {
  caseData: CaseFile;
  chapterIndex: number;
  isVerified: boolean;
  onVerifyChapter: (chapterIndex: number) => void;
}

interface AuditPrompt {
  question: string;
  options: {
    id: string;
    label: string;
    correct: boolean;
    feedback: string;
  }[];
}

function getAuditPromptForChapter(caseData: CaseFile, chapterIndex: number): AuditPrompt {
  const isUnsolved =
    caseData.status === 'Cold Case / Unresolved' ||
    caseData.status === 'Active Investigation';

  const firstExhibit = caseData.evidence?.[0];
  const firstPoi = caseData.personsOfInterest?.[0];

  switch (chapterIndex) {
    case 0:
      return {
        question: `JURISDICTION & RECORD AUDIT: Under ${caseData.overview.jurisdiction || 'governing law'}, what does initial archival classification ("${caseData.status}") require of investigators?`,
        options: [
          {
            id: 'a',
            label: isUnsolved
              ? 'Maintain presumption of innocence and treat all unconvicted leads strictly as hypotheses.'
              : 'Anchor all public assertions to verified court orders, autopsy records, and sworn dockets.',
            correct: true,
            feedback:
              'Verified: Archival precision requires strict separation between substantiated court findings and uncharged investigative theories.',
          },
          {
            id: 'b',
            label: 'Treat early media speculation as equivalent to sworn grand jury exhibits.',
            correct: false,
            feedback:
              'Audit risk: Secondary press narratives lack chain-of-custody verification and cannot establish legal elements.',
          },
        ],
      };

    case 1:
      return {
        question:
          'CHRONOLOGY AUDIT: Why must investigators verify independent physical timestamps alongside initial incident narratives?',
        options: [
          {
            id: 'a',
            label:
              'Objective time-stamped logs expose alibi gaps and guard against hindsight bias in early witness recollections.',
            correct: true,
            feedback:
              'Verified: Contemporaneous dispatch and telemetry logs anchor sequence reconstruction under Rule 803.',
          },
          {
            id: 'b',
            label: 'Narrative sequence is optional if a suspect later refuses a voluntary interview.',
            correct: false,
            feedback:
              'Constitutional violation: Silence may not replace chronological proof of criminal opportunity.',
          },
        ],
      };

    case 2:
      return {
        question:
          'PROCEDURAL AUDIT: During early field interviews and scene sweeps, what legal hazard most commonly weakens later prosecution?',
        options: [
          {
            id: 'a',
            label:
              'Uncontrolled scene traffic and unrecorded witness prompting taint physical custody and memory reliability.',
            correct: true,
            feedback:
              'Verified: Contamination and suggestive questioning undermine both Rule 901 foundation and witness credibility.',
          },
          {
            id: 'b',
            label: 'Filing written FD-302 summaries within 24 hours violates hearsay prohibitions.',
            correct: false,
            feedback:
              'Incorrect: Contemporaneous FD-302 memoranda preserve fresh recollection and support Rule 803(5) foundation.',
          },
        ],
      };

    case 3:
      return {
        question: `EXHIBIT AUTHENTICATION CHECK (${firstExhibit?.exhibitNumber || 'EX-01'}): Before admitting "${firstExhibit?.title || 'primary forensic evidence'}", what foundation must the proponent establish?`,
        options: [
          {
            id: 'a',
            label:
              'Unbroken chain of custody plus reliable scientific/forensic methodology under Rule 901 and Daubert/Frye.',
            correct: true,
            feedback:
              'Verified: Proper authentication and methodology gatekeeping insulate exhibits from motions to suppress.',
          },
          {
            id: 'b',
            label: 'Relevance alone suffices without establishing who recovered or sealed the item.',
            correct: false,
            feedback:
              'Sustained objection: Without authentication under Rule 901, relevant items remain inadmissible.',
          },
        ],
      };

    case 4:
      return {
        question: `SUBJECT STATUS CHECK (${firstPoi?.name || 'Recorded Subject'}): How does constitutional procedure distinguish a Person of Interest from a Convicted Defendant?`,
        options: [
          {
            id: 'a',
            label:
              'Only a formal plea or trial verdict overcomes the presumption of innocence; uncharged allegations carry zero legal finding of guilt.',
            correct: true,
            feedback:
              'Verified: Maintaining distinct legal classifications protects both constitutional due process and factual accuracy.',
          },
          {
            id: 'b',
            label: 'Any individual named in a preliminary police tip log is legally deemed culpable.',
            correct: false,
            feedback:
              'Due process error: Investigative leads are not adjudications.',
          },
        ],
      };

    case 5:
      return {
        question:
          'BREAKTHROUGH CORROBORATION CHECK: What converts a promising investigative breakthrough into trial-ready proof?',
        options: [
          {
            id: 'a',
            label:
              'Independent convergence—matching scientific/digital hits to verified suspect access, physical custody, or corroborated admissions.',
            correct: true,
            feedback:
              'Verified: Multi-source corroboration satisfies the Jackson v. Virginia sufficiency standard.',
          },
          {
            id: 'b',
            label: 'A single unverified database kinship hint without confirmatory STR or physical testing.',
            correct: false,
            feedback:
              'Protocol error: Database leads must always undergo direct confirmatory testing before charging.',
          },
        ],
      };

    case 6:
      return {
        question:
          'TRIAL ADVOCACY AUDIT: Facing a Defense Rule 29 Motion for Judgment of Acquittal, what standard governs the Judge’s ruling?',
        options: [
          {
            id: 'a',
            label:
              'Whether any rational trier of fact could find every statutory element proven beyond a reasonable doubt from the admitted evidence.',
            correct: true,
            feedback:
              'Verified: Jackson v. Virginia (1979) establishes the controlling constitutional sufficiency threshold.',
          },
          {
            id: 'b',
            label: 'Whether the media consensus supports sending the count to the jury.',
            correct: false,
            feedback:
              'Improper standard: Only admitted evidence in the court record governs Rule 29.',
          },
        ],
      };

    case 7:
      return {
        question: isUnsolved
          ? 'COLD CASE DISPOSITION AUDIT: Why must unresolved records refrain from declaring guilt?'
          : 'VERDICT & SENTENCING AUDIT: What determines whether a conviction withstands direct appellate review?',
        options: [
          {
            id: 'a',
            label: isUnsolved
              ? 'Absent conviction or corroborated admission in court, unresolved biological/procedural questions prohibit attributing guilt.'
              : 'Preservation of constitutional rights, valid charging jurisdiction, and properly admitted evidentiary foundations.',
            correct: true,
            feedback:
              'Verified: Legal integrity depends on respecting both the burden of proof and constitutional appellate safeguards.',
          },
          {
            id: 'b',
            label: 'Closing public inquiry early whenever an informal theory feels persuasive.',
            correct: false,
            feedback:
              'Analytical risk: Premature closure creates wrongful attribution and leaves real perpetrators unidentified.',
          },
        ],
      };

    default:
      return {
        question:
          'INSTITUTIONAL PRECEDENT AUDIT: How do landmark criminal cases produce durable legal reform?',
        options: [
          {
            id: 'a',
            label:
              'By exposing statutory gaps—triggering concrete legislative mandates, forensic standards, and victim-rights protections.',
            correct: true,
            feedback:
              'Verified: Statutory accountability converts tragic casework failures into enforceable systemic safeguards.',
          },
          {
            id: 'b',
            label: 'By eliminating defense evidentiary objections in future high-profile trials.',
            correct: false,
            feedback:
              'Constitutional error: Procedural fairness strengthens—never weakens—durable convictions.',
          },
        ],
      };
  }
}

export const ChapterAuditChallenge: React.FC<ChapterAuditChallengeProps> = ({
  caseData,
  chapterIndex,
  isVerified,
  onVerifyChapter,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const prompt = getAuditPromptForChapter(caseData, chapterIndex);
  const pickedOpt = prompt.options.find((o) => o.id === selectedId);

  return (
    <div
      className={`mt-6 p-4 border rounded font-mono text-xs transition-colors ${
        isVerified
          ? 'bg-emerald-950/20 border-emerald-700/70'
          : 'bg-[#090d14] border-amber-800/70'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-zinc-800">
        <div className="flex items-center space-x-2">
          <Scale className={`w-4 h-4 ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="font-pixel text-[10px] uppercase tracking-wider text-amber-400">
            ACTIVE CHAPTER LEGAL AUDIT // CHAPTER 0{chapterIndex + 1}
          </span>
        </div>
        <span
          className={`text-[9px] font-pixel px-2 py-0.5 border ${
            isVerified
              ? 'border-emerald-600 text-emerald-300 bg-emerald-950/50'
              : 'border-zinc-700 text-zinc-400 bg-black/60'
          }`}
        >
          {isVerified ? 'AUDIT VERIFIED ✓' : 'VERIFY CHAPTER TO RECORD'}
        </span>
      </div>

      <p className="text-zinc-200 font-tech text-xs sm:text-sm mb-3 leading-relaxed">
        {prompt.question}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {prompt.options.map((opt) => {
          const isPicked = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setSelectedId(opt.id);
                if (opt.correct) {
                  soundEngine.playStampThud();
                  onVerifyChapter(chapterIndex);
                } else {
                  soundEngine.playWarning();
                }
              }}
              className={`p-3 text-left rounded border transition-all flex items-start space-x-2 ${
                isPicked
                  ? opt.correct
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : 'bg-red-950/60 border-red-500 text-red-200'
                  : 'bg-black/60 border-zinc-800 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-75" />
              <span className="font-tech text-xs leading-snug">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {pickedOpt && (
        <div
          className={`mt-3 p-2.5 rounded border text-[11px] font-tech flex items-start space-x-2 ${
            pickedOpt.correct
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              : 'bg-red-950/40 border-red-800 text-red-200'
          }`}
        >
          {pickedOpt.correct ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <span>{pickedOpt.feedback}</span>
        </div>
      )}
    </div>
  );
};
