import React, { useState, useMemo } from 'react';
import {
  Scale,
  Gavel,
  BookOpen,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  RotateCcw,
  ChevronRight,
  Award,
  Layers,
} from 'lucide-react';
import { CaseFile } from '../../types.ts';
import { getDilemmasForCase, LegalDilemmaChoice } from '../../data/legalDilemmasData.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface LegalDilemmaBenchProps {
  caseData: CaseFile;
}

interface ScenarioResult {
  scenarioId: string;
  precedentCorrect: boolean;
  exhibitAligned: boolean;
  choice: LegalDilemmaChoice;
  totalDelta: number;
}

export const LegalDilemmaBench: React.FC<LegalDilemmaBenchProps> = ({ caseData }) => {
  const scenarios = useMemo(() => getDilemmasForCase(caseData), [caseData]);

  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedPrecedentId, setSelectedPrecedentId] = useState<string>('');
  const [selectedExhibitId, setSelectedExhibitId] = useState<string>(
    caseData.evidence?.[0]?.id || ''
  );
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('');
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [showHistorical, setShowHistorical] = useState(false);

  // 3-Axis Judicial & Constitutional Balancing Meters (start at 60 baseline)
  const [constitutionalScore, setConstitutionalScore] = useState(60);
  const [evidentiaryScore, setEvidentiaryScore] = useState(60);
  const [appellateScore, setAppellateScore] = useState(60);

  const activeScenario = scenarios[scenarioIdx] || scenarios[0];
  const currentResult = results[activeScenario.id];
  const completedCount = Object.keys(results).length;
  const allCompleted = completedCount === scenarios.length;

  const clampMeter = (val: number) => Math.max(15, Math.min(100, val));

  const handleSelectScenario = (idx: number) => {
    soundEngine.playKeyClick();
    setScenarioIdx(idx);
    const sc = scenarios[idx];
    const existing = results[sc.id];
    if (existing) {
      setSelectedPrecedentId(sc.requiredPrecedentId);
      setSelectedChoiceId(existing.choice.id);
    } else {
      setSelectedPrecedentId('');
      setSelectedChoiceId('');
    }
    setShowHistorical(false);
  };

  const handleSubmitRuling = () => {
    if (!selectedPrecedentId || !selectedChoiceId || currentResult) return;

    const choice = activeScenario.choices.find((c) => c.id === selectedChoiceId);
    if (!choice) return;

    const precedentCorrect = selectedPrecedentId === activeScenario.requiredPrecedentId;
    const chosenEvidence = caseData.evidence.find((e) => e.id === selectedExhibitId);
    const keyword = activeScenario.preferredExhibitKeyword.toLowerCase();
    const exhibitAligned = Boolean(
      chosenEvidence &&
        (`${chosenEvidence.title} ${chosenEvidence.description} ${chosenEvidence.exhibitNumber}`
          .toLowerCase()
          .includes(keyword) ||
          caseData.evidence.length <= 1)
    );

    const precBonus = precedentCorrect ? 10 : -10;
    const exBonus = exhibitAligned ? 5 : 0;

    setConstitutionalScore((v) => clampMeter(v + choice.constitutionalDelta + precBonus));
    setEvidentiaryScore((v) => clampMeter(v + choice.evidentiaryDelta + exBonus));
    setAppellateScore((v) => clampMeter(v + choice.appellateDelta + (precedentCorrect ? 5 : -8)));

    setResults((prev) => ({
      ...prev,
      [activeScenario.id]: {
        scenarioId: activeScenario.id,
        precedentCorrect,
        exhibitAligned,
        choice,
        totalDelta:
          choice.constitutionalDelta +
          choice.evidentiaryDelta +
          choice.appellateDelta +
          precBonus +
          exBonus,
      },
    }));

    if (choice.isOptimalStrategy && precedentCorrect) {
      soundEngine.playGavelStrike();
      setTimeout(() => soundEngine.playStampThud(), 160);
    } else {
      soundEngine.playWarning();
    }
  };

  const handleResetBench = () => {
    soundEngine.playBootBeep();
    setScenarioIdx(0);
    setSelectedPrecedentId('');
    setSelectedExhibitId(caseData.evidence?.[0]?.id || '');
    setSelectedChoiceId('');
    setResults({});
    setShowHistorical(false);
    setConstitutionalScore(60);
    setEvidentiaryScore(60);
    setAppellateScore(60);
  };

  const avgIntegrity = Math.round((constitutionalScore + evidentiaryScore + appellateScore) / 3);

  return (
    <div className="space-y-5 font-mono text-xs text-zinc-200">
      {/* Header + 3-Axis Legal Meters */}
      <div className="bg-[#090d13] border-2 border-amber-900/60 rounded p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-950/70 border border-amber-700 text-amber-400 rounded">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="font-pixel text-[10px] text-amber-400 uppercase tracking-widest block">
                IN CHAMBERS // PRECEDENT &amp; CONSTITUTIONAL DILEMMA DESK
              </span>
              <h3 className="text-sm sm:text-base font-bold font-editorial text-zinc-100">
                Legal Reasoning Engine &mdash; {caseData.caseNumber}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-black/70 border border-zinc-700 text-emerald-400 font-pixel text-[10px]">
              RESOLVED: {completedCount} / {scenarios.length}
            </span>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleResetBench}
                className="retro-btn px-2.5 py-1 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET BENCH</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Real-Time Balancing Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: 'CONSTITUTIONAL INTEGRITY',
              val: constitutionalScore,
              sub: '4th / 5th / 6th Amend. Compliance',
              color: constitutionalScore >= 70 ? 'bg-emerald-500' : constitutionalScore >= 45 ? 'bg-amber-500' : 'bg-red-500',
            },
            {
              label: 'EVIDENTIARY WEIGHT',
              val: evidentiaryScore,
              sub: 'Fed. R. Evid. Admissibility & Nexus',
              color: evidentiaryScore >= 70 ? 'bg-blue-500' : evidentiaryScore >= 45 ? 'bg-amber-500' : 'bg-red-500',
            },
            {
              label: 'APPELLATE DURABILITY',
              val: appellateScore,
              sub: 'Resistance to Reversal / Remand',
              color: appellateScore >= 70 ? 'bg-emerald-400' : appellateScore >= 45 ? 'bg-amber-500' : 'bg-red-500',
            },
          ].map((m) => (
            <div key={m.label} className="p-2.5 bg-black/60 border border-zinc-800 rounded space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-pixel text-zinc-400">{m.label}</span>
                <span className="font-bold text-zinc-100">{m.val}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 border border-zinc-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${m.color}`}
                  style={{ width: `${m.val}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 font-tech">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {scenarios.map((sc, idx) => {
          const done = results[sc.id];
          const active = idx === scenarioIdx;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSelectScenario(idx)}
              className={`px-3 py-2 border text-left transition-all flex items-center space-x-2 ${
                active
                  ? 'bg-zinc-800 border-amber-500 text-zinc-100 font-bold'
                  : 'bg-[#0b0e14] border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <span className="font-pixel text-[10px] text-amber-400">{sc.code}</span>
              <span className="truncate max-w-[220px]">{sc.title}</span>
              {done && (
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    done.choice.isOptimalStrategy && done.precedentCorrect
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Dilemma Stage */}
      <div className="retro-window p-5 bg-[#070a0f] space-y-5 dossier-chapter-enter" key={activeScenario.id}>
        {/* Legal Posture & Dilemma Briefing */}
        <div className="border-b border-zinc-800 pb-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-pixel text-red-400 uppercase tracking-wider">
              {activeScenario.posture}
            </span>
            <span className="retro-stamp-amber text-[9px] py-0 px-1.5">
              ACTIVE BENCH BRIEFING
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-bold font-editorial text-zinc-100">
            {activeScenario.title}
          </h4>
          <p className="text-xs sm:text-sm font-tech text-zinc-200 leading-relaxed bg-black/60 p-3.5 border border-zinc-800 rounded">
            {activeScenario.dilemmaPrompt}
          </p>
          <div className="text-[11px] font-tech text-amber-300/90 flex items-start space-x-2">
            <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
            <span>
              <strong>CONSTITUTIONAL STAKES:</strong> {activeScenario.realWorldStakes}
            </span>
          </div>
        </div>

        {/* 3-Step Interactive Legal Synthesis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Step 1: Select Governing Precedent Card */}
          <div className="space-y-2.5 bg-[#0a0d14] p-4 border border-zinc-800 rounded">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[10px] text-amber-400 uppercase font-bold flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>STEP 1: CITE CONTROLLING PRECEDENT</span>
              </span>
              <span className="text-[10px] text-zinc-500">REQUIRED</span>
            </div>

            <div className="space-y-2">
              {activeScenario.precedentCards.map((card) => {
                const picked = selectedPrecedentId === card.id;
                const isTarget = card.id === activeScenario.requiredPrecedentId;
                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={Boolean(currentResult)}
                    onClick={() => {
                      soundEngine.playCrossRefLink();
                      setSelectedPrecedentId(card.id);
                    }}
                    className={`w-full p-3 text-left rounded border transition-all space-y-1 ${
                      currentResult
                        ? isTarget
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                          : picked
                          ? 'bg-red-950/50 border-red-500 text-red-200'
                          : 'bg-zinc-950/50 border-zinc-900 text-zinc-500'
                        : picked
                        ? 'bg-amber-950/50 border-amber-500 text-zinc-100'
                        : 'bg-black/50 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-amber-300 text-[11px]">{card.citation}</span>
                      {picked && !currentResult && (
                        <span className="text-[9px] font-pixel text-amber-400">[CITED]</span>
                      )}
                    </div>
                    <div className="font-bold text-zinc-100 text-xs">{card.ruleName}</div>
                    <p className="text-[11px] font-tech text-zinc-400 leading-snug">
                      {card.holding}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 & 3: Link Exhibit + Commit Strategy */}
          <div className="space-y-4">
            {/* Step 2: Anchor to Case Exhibit */}
            <div className="bg-[#0a0d14] p-4 border border-zinc-800 rounded space-y-2">
              <span className="font-pixel text-[10px] text-emerald-400 uppercase font-bold flex items-center space-x-1.5">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>STEP 2: ANCHOR TO ADMITTED RECORD EXHIBIT</span>
              </span>
              <select
                value={selectedExhibitId}
                disabled={Boolean(currentResult)}
                onChange={(e) => {
                  soundEngine.playKeyClick();
                  setSelectedExhibitId(e.target.value);
                }}
                className="w-full bg-black/80 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              >
                {caseData.evidence.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    [{ev.exhibitNumber}] {ev.title} ({ev.classification})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Select Judicial / Prosecutorial Action */}
            <div className="bg-[#0a0d14] p-4 border border-zinc-800 rounded space-y-2.5">
              <span className="font-pixel text-[10px] text-red-400 uppercase font-bold flex items-center space-x-1.5">
                <Gavel className="w-3.5 h-3.5" />
                <span>STEP 3: RENDER LEGAL DETERMINATION</span>
              </span>

              <div className="space-y-2">
                {activeScenario.choices.map((ch) => {
                  const picked = selectedChoiceId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      disabled={Boolean(currentResult)}
                      onClick={() => {
                        soundEngine.playKeyClick();
                        setSelectedChoiceId(ch.id);
                      }}
                      className={`w-full p-3 text-left rounded border transition-all space-y-1 ${
                        currentResult
                          ? ch.isOptimalStrategy
                            ? 'bg-emerald-950/40 border-emerald-600 text-emerald-100'
                            : picked
                            ? 'bg-red-950/50 border-red-600 text-red-200'
                            : 'bg-zinc-950/40 border-zinc-900 text-zinc-500'
                          : picked
                          ? 'bg-red-950/40 border-red-500 text-zinc-100'
                          : 'bg-black/50 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      <div className="font-bold text-xs text-zinc-100">{ch.label}</div>
                      <p className="text-[11px] font-tech text-zinc-400 leading-relaxed">
                        {ch.legalAction}
                      </p>
                    </button>
                  );
                })}
              </div>

              {!currentResult && (
                <button
                  type="button"
                  disabled={!selectedPrecedentId || !selectedChoiceId}
                  onClick={handleSubmitRuling}
                  className="w-full retro-btn retro-btn-red py-2.5 text-xs font-pixel font-bold flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Gavel className="w-4 h-4" />
                  <span>ENTER RULING INTO JUDICIAL RECORD</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bench Consequence & Real-World Comparison */}
        {currentResult && (
          <div className="p-4 bg-black/80 border-2 border-amber-700/70 rounded space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center space-x-2">
                {currentResult.choice.isOptimalStrategy && currentResult.precedentCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <span className="font-pixel text-xs text-amber-300">
                  CHAMBERS BENCH EVALUATION
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`retro-stamp text-[9px] py-0 px-2 animate-stamp-slam ${
                    currentResult.precedentCorrect
                      ? 'text-emerald-400 border-emerald-600'
                      : 'text-red-400 border-red-600'
                  }`}
                >
                  PRECEDENT: {currentResult.precedentCorrect ? 'ACCURATE' : 'MISAPPLIED'}
                </span>
                {currentResult.exhibitAligned && (
                  <span className="retro-stamp-green text-[9px] py-0 px-2">
                    EXHIBIT NEXUS +5
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm font-tech text-zinc-100 leading-relaxed">
              {currentResult.choice.benchOutcome}
            </p>
            <p className="text-[11px] font-tech text-zinc-400 leading-relaxed">
              <strong className="text-amber-400">DOCTRINAL PRINCIPLE:</strong>{' '}
              {currentResult.choice.doctrineNote}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUnsealChord();
                  setShowHistorical((s) => !s);
                }}
                className="retro-btn px-3 py-1.5 text-amber-300 border-amber-700 flex items-center space-x-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {showHistorical ? 'HIDE HISTORICAL RESOLUTION' : 'INSPECT ACTUAL COURT RESOLUTION'}
                </span>
              </button>

              {scenarioIdx + 1 < scenarios.length && (
                <button
                  type="button"
                  onClick={() => handleSelectScenario(scenarioIdx + 1)}
                  className="retro-btn retro-btn-green px-4 py-1.5 font-bold flex items-center space-x-1"
                >
                  <span>NEXT LEGAL DILEMMA</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {showHistorical && (
              <div className="p-3 bg-[#0c1118] border border-blue-900/70 rounded text-xs font-tech text-zinc-200 leading-relaxed">
                <span className="font-pixel text-[10px] text-blue-400 block mb-1">
                  HISTORICAL JUDICIAL RECORD:
                </span>
                {activeScenario.historicalResolution}
              </div>
            )}
          </div>
        )}

        {/* Chambers Completion Summary */}
        {allCompleted && (
          <div className="p-4 bg-emerald-950/25 border border-emerald-700 rounded flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="font-pixel text-[10px] text-emerald-400 uppercase">
                  CHAMBERS AUDIT COMPLETE &bull; COMPOSITE JUDICIAL INTEGRITY: {avgIntegrity}%
                </div>
                <p className="text-xs font-tech text-zinc-300">
                  {avgIntegrity >= 75
                    ? 'High appellate durability: constitutional thresholds and statutory burdens upheld across dilemmas.'
                    : 'Mixed appellate posture: review precedent alignments to avoid suppression or due-process vulnerabilities.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetBench}
              className="retro-btn px-3 py-1.5 text-xs"
            >
              REPLAY DILEMMAS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
