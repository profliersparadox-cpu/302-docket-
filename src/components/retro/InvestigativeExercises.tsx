import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Shield,
  Layers,
  FileQuestion,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { InvestigativeExercise, InvestigativeExerciseOption } from '../../types.ts';
import { fictionalExercises } from '../../data/archiveVaultData.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

export const InvestigativeExercises: React.FC = () => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(fictionalExercises[0].id);
  const [selectedOption, setSelectedOption] = useState<InvestigativeExerciseOption | null>(null);
  const [showDebrief, setShowDebrief] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<Record<string, boolean>>({});

  const activeExercise = fictionalExercises.find((e) => e.id === selectedExerciseId) || fictionalExercises[0];

  const handleSelectOption = (opt: InvestigativeExerciseOption) => {
    soundEngine.playKeyClick();
    setSelectedOption(opt);
    setShowDebrief(true);

    if (opt.isRecommended) {
      soundEngine.playBootBeep();
      setCompletedScenarios((prev) => ({ ...prev, [activeExercise.id]: true }));
    } else {
      soundEngine.playWarning();
    }
  };

  const handleResetCurrent = () => {
    soundEngine.playKeyClick();
    setSelectedOption(null);
    setShowDebrief(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0a0c10] text-zinc-300 font-tech select-none overflow-hidden">
      {/* Sidebar: Scenario Selector */}
      <div className="w-full md:w-80 bg-[#0f1217] border-b md:border-b-0 md:border-r border-[#262c36] flex flex-col">
        <div className="p-3 border-b border-[#262c36] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-emerald-400">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">INVESTIGATIVE LAB</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            FICTIONAL SIMULATION
          </span>
        </div>

        {/* Ethical Warning Banner */}
        <div className="p-3 bg-zinc-950 border-b border-zinc-900 text-[10px] font-mono text-zinc-400 space-y-1">
          <div className="text-amber-400 font-bold flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5" />
            <span>ACADEMIC TRAINING DISCLAIMER:</span>
          </div>
          <p className="text-zinc-500 leading-normal">
            Scenarios are 100% fictional teaching exercises. They do not model real individuals, active criminal investigations, or determine guilt in any historical case.
          </p>
        </div>

        {/* Exercises List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
          {fictionalExercises.map((ex) => {
            const isSelected = ex.id === activeExercise.id;
            const isPassed = completedScenarios[ex.id];

            return (
              <button
                key={ex.id}
                onClick={() => {
                  soundEngine.playKeyClick();
                  setSelectedExerciseId(ex.id);
                  setSelectedOption(null);
                  setShowDebrief(false);
                }}
                className={`w-full p-3 text-left transition-colors flex flex-col space-y-1 ${
                  isSelected
                    ? 'bg-zinc-800/90 border-l-4 border-emerald-500'
                    : 'hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">{ex.code}</span>
                  {isPassed && (
                    <span className="text-emerald-400 font-bold flex items-center space-x-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>COMPLETED</span>
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-zinc-200 line-clamp-1 font-mono">
                  {ex.title}
                </div>
                <div className="text-[10px] text-zinc-500">
                  Tier: {ex.difficulty}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Simulation Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="border-b border-zinc-800 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">
                {activeExercise.code} // LEVEL: {activeExercise.difficulty}
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-editorial text-zinc-100">
                {activeExercise.title}
              </h2>
            </div>
            {selectedOption && (
              <button
                onClick={handleResetCurrent}
                className="px-2.5 py-1 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET EXERCISE</span>
              </button>
            )}
          </div>

          {/* Scenario Briefing Card */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-3 font-mono text-xs">
            <div className="text-amber-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <FileQuestion className="w-4 h-4" />
              <span>INCIDENT BRIEFING & BACKGROUND:</span>
            </div>
            <p className="text-zinc-300 leading-relaxed font-typewriter">
              {activeExercise.briefing}
            </p>
            <p className="text-zinc-400 leading-relaxed">
              {activeExercise.scenarioDescription}
            </p>
          </div>

          {/* Available Evidence */}
          <div className="space-y-2 font-mono text-xs">
            <span className="text-zinc-500 uppercase text-[10px] block">
              LOGGED EVIDENCE IN REPOSITORY:
            </span>
            <div className="space-y-1.5">
              {activeExercise.availableEvidence.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-zinc-900 border border-zinc-800/80 rounded text-zinc-300 flex items-start space-x-2"
                >
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question Prompt */}
          <div className="p-4 bg-zinc-900 border-2 border-zinc-700 rounded-lg space-y-3">
            <div className="text-zinc-100 font-bold text-sm font-mono">
              {activeExercise.questionPrompt}
            </div>

            {/* Options */}
            <div className="space-y-2 pt-2">
              {activeExercise.options.map((opt) => {
                const isPicked = selectedOption?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-3 text-left rounded border transition-all text-xs font-mono flex items-start justify-between space-x-2 ${
                      isPicked
                        ? opt.isRecommended
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                          : 'bg-red-950/80 border-red-500 text-red-200'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 text-zinc-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isPicked && (
                      <span className="mt-0.5">
                        {opt.isRecommended ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Analytical Debriefing Section (Revealed upon Selection) */}
          {showDebrief && selectedOption && (
            <div
              className={`p-5 rounded-lg border-2 space-y-3 font-mono text-xs animate-in fade-in duration-300 ${
                selectedOption.isRecommended
                  ? 'bg-emerald-950/40 border-emerald-700 text-zinc-200'
                  : 'bg-amber-950/40 border-amber-700 text-zinc-200'
              }`}
            >
              <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800">
                {selectedOption.isRecommended ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <span className="font-bold text-sm">
                  {selectedOption.isRecommended
                    ? 'OPTIMAL INVESTIGATIVE PROTOCOL IDENTIFIED'
                    : 'SUB-OPTIMAL PROTOCOL // COGNITIVE RISK IDENTIFIED'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase block">
                  APPLIED INVESTIGATIVE PRINCIPLE:
                </span>
                <p className="text-amber-300 font-bold mt-0.5">
                  {selectedOption.investigativePrinciple}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase block">
                  METHODOLOGICAL REASONING:
                </span>
                <p className="text-zinc-300 leading-relaxed mt-0.5">
                  {selectedOption.reasoning}
                </p>
              </div>

              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded text-zinc-400 text-[11px] leading-relaxed">
                <span className="text-zinc-200 font-bold block mb-1">
                  HISTORICAL CASEWORK CONTEXT:
                </span>
                {activeExercise.debriefingAnalysis}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
