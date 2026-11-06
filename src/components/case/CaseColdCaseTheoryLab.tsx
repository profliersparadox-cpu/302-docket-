import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  AlertTriangle,
  Fingerprint,
  Users,
  Search,
  CheckCircle2,
  Save,
  RotateCcw,
  Shield,
  FileText,
  Info,
} from 'lucide-react';
import { CaseFile, PersonOfInterest, EvidenceItem } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface CaseColdCaseTheoryLabProps {
  caseData: CaseFile;
}

interface SavedTheory {
  id: string;
  targetPoiId: string;
  targetPoiName: string;
  selectedEvidenceIds: string[];
  rationale: string;
  timestamp: string;
}

export const CaseColdCaseTheoryLab: React.FC<CaseColdCaseTheoryLabProps> = ({ caseData }) => {
  const isColdCase =
    caseData.status === 'Cold Case / Unresolved' ||
    caseData.status === 'Active Investigation';

  // Only allowed on cold cases
  if (!isColdCase) {
    return null;
  }

  const storageKey = `theories_${caseData.slug}`;

  const [selectedPoiId, setSelectedPoiId] = useState<string>(
    caseData.personsOfInterest?.[0]?.id || ''
  );
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [workingHypothesis, setWorkingHypothesis] = useState<string>('');
  const [savedTheories, setSavedTheories] = useState<SavedTheory[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toggleEvidence = (evId: string) => {
    soundEngine.playKeyClick();
    setSelectedEvidenceIds((prev) =>
      prev.includes(evId) ? prev.filter((id) => id !== evId) : [...prev, evId]
    );
  };

  const handleSaveTheory = () => {
    if (!workingHypothesis.trim()) return;
    soundEngine.playKeyClick();

    const targetPoi = caseData.personsOfInterest.find((p) => p.id === selectedPoiId);
    const newTheory: SavedTheory = {
      id: 'theory-' + Date.now(),
      targetPoiId: selectedPoiId,
      targetPoiName: targetPoi ? targetPoi.name : 'Unknown Subject / Multiple Parties',
      selectedEvidenceIds: [...selectedEvidenceIds],
      rationale: workingHypothesis,
      timestamp: new Date().toLocaleDateString(),
    };

    const updated = [newTheory, ...savedTheories];
    setSavedTheories(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {}

    setWorkingHypothesis('');
    setToastMsg('WORKING THEORY RECORDED TO DOCKET NOTES');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDeleteTheory = (id: string) => {
    soundEngine.playKeyClick();
    const updated = savedTheories.filter((t) => t.id !== id);
    setSavedTheories(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="retro-window p-4 flex flex-wrap items-center justify-between gap-4 bg-[#090b0e] border-amber-900/60">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-950/60 border border-amber-800 text-amber-400">
            <HelpCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-amber-500 uppercase font-bold">
                COLD CASE INVESTIGATIVE LAB
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1 text-amber-400 border-amber-700">
                UNRESOLVED DOCKET
              </span>
            </div>
            <h3 className="text-base font-bold font-editorial text-zinc-100">
              Formulate Working Investigative Theories
            </h3>
          </div>
        </div>

        <div className="text-xs font-tech text-amber-400">
          STATUS: <span className="font-bold uppercase">{caseData.status}</span>
        </div>
      </div>

      {/* Mandatory Legal & Ethical Notice */}
      <div className="p-4 bg-black/70 border-2 border-dashed border-amber-700/80 rounded space-y-1.5 font-mono text-xs text-amber-200/90">
        <div className="flex items-center space-x-2 text-amber-400 font-pixel text-[11px] font-bold">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>LEGAL CLASSIFICATION: HYPOTHETICAL THEORIES ONLY &bull; NOT JUDICIAL CONCLUSIONS</span>
        </div>
        <p className="font-tech text-xs leading-relaxed text-zinc-300">
          No defendant has been convicted of the primary crime in this unsolved docket. All working models developed below are strictly analytical theories based on publicly documented records, not conclusions of guilt. Presumption of innocence remains in full effect for unconvicted individuals.
        </p>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-mono text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 3-Step Theory Builder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Step 1 & 2: Evidence and Subject Selection */}
        <div className="space-y-4">
          {/* Step 1: Documented Evidence Selection */}
          <div className="retro-window p-4 bg-[#080b0f] space-y-2.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-pixel text-[10px] text-emerald-400 font-bold uppercase">
                STEP 1: SELECT RELEVANT EVIDENCE TO CONNECT
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {selectedEvidenceIds.length} SELECTED
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
              {caseData.evidence.map((ev) => {
                const isSelected = selectedEvidenceIds.includes(ev.id);
                return (
                  <button
                    key={ev.id}
                    onClick={() => toggleEvidence(ev.id)}
                    className={`w-full p-2 text-left rounded border transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <span className="text-[9px] font-pixel text-zinc-500 mr-1.5">
                        [{ev.exhibitNumber || 'EX'}]
                      </span>
                      <span>{ev.title}</span>
                    </div>
                    <span className="text-[10px] font-pixel">
                      {isSelected ? '[CONNECTED]' : '[+]'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Documented Person of Interest Selection */}
          <div className="retro-window p-4 bg-[#080b0f] space-y-2.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-pixel text-[10px] text-amber-400 font-bold uppercase">
                STEP 2: SELECT RECORDED PERSON OF INTEREST
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                DOCUMENTED IN RECORD
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              {caseData.personsOfInterest.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    soundEngine.playKeyClick();
                    setSelectedPoiId(p.id);
                  }}
                  className={`w-full p-2.5 text-left rounded border transition-colors flex items-center justify-between ${
                    selectedPoiId === p.id
                      ? 'bg-amber-950/60 border-amber-600 text-amber-200 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div>
                    <div className="text-zinc-200 font-tech font-bold">{p.name}</div>
                    <div className="text-[10px] text-zinc-500">{p.role} &bull; Status: {p.status}</div>
                  </div>
                  {selectedPoiId === p.id && (
                    <span className="text-[10px] font-pixel text-amber-400">ACTIVE TARGET</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Write Working Theory Formulation */}
        <div className="retro-window p-5 bg-[#080b0f] flex flex-col justify-between space-y-4">
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-pixel text-[10px] text-red-400 font-bold uppercase">
                STEP 3: FORMULATE WORKING THEORY
              </span>
              <span className="text-[9px] font-pixel text-amber-500 uppercase">
                [THEORY &bull; NOT CONCLUSION]
              </span>
            </div>

            <p className="text-zinc-400 font-tech leading-relaxed">
              Synthesize how the selected physical evidence, timeline anomalies, and suspect background intersect. What unanswered questions would this theory explain?
            </p>

            <textarea
              rows={6}
              value={workingHypothesis}
              onChange={(e) => setWorkingHypothesis(e.target.value)}
              placeholder="e.g. The timeline recorded in Exhibit EX-02 suggests the subject had unaccounted transit window during the critical hours, which corroborates the witness testimony regarding..."
              className="w-full bg-black/80 border border-zinc-800 rounded p-3 text-zinc-200 font-mono text-xs focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <span className="text-[10px] font-tech text-zinc-500">
              SAVED LOCALLY IN INVESTIGATIVE NOTES
            </span>
            <button
              onClick={handleSaveTheory}
              disabled={!workingHypothesis.trim()}
              className="retro-btn text-xs px-4 py-2 border-amber-600 text-amber-300 disabled:opacity-40 hover:bg-amber-950/60 flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>LOG WORKING THEORY</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recorded Theories Ledger */}
      {savedTheories.length > 0 && (
        <div className="retro-window p-5 bg-[#07090c] space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-pixel text-xs text-amber-400 font-bold uppercase">
              RECORDED WORKING THEORIES ({savedTheories.length})
            </span>
            <span className="text-[10px] font-pixel text-zinc-500">
              CLASSIFIED AS INVESTIGATIVE HYPOTHESES
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {savedTheories.map((th) => (
              <div
                key={th.id}
                className="p-3.5 bg-black/60 border border-amber-900/50 rounded space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="retro-stamp text-[8px] py-0 px-1.5 text-amber-400 border-amber-700">
                      THEORY (UNPROVEN)
                    </span>
                    <span className="text-zinc-200 font-bold font-tech">
                      Subject Focus: {th.targetPoiName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-zinc-500 text-[10px]">
                    <span>Logged: {th.timestamp}</span>
                    <button
                      onClick={() => handleDeleteTheory(th.id)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="text-zinc-300 font-mono text-xs leading-relaxed whitespace-pre-line">
                  "{th.rationale}"
                </p>

                <div className="text-[10px] text-zinc-500 pt-1">
                  Connected Evidence Exhibits: {th.selectedEvidenceIds.length > 0 ? th.selectedEvidenceIds.join(', ') : 'General Case Circumstances'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
