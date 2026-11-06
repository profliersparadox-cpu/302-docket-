import React from 'react';
import { X, Shield, AlertTriangle, BookOpen } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine.ts';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="retro-window max-w-2xl w-full p-6 text-zinc-300 font-tech relative max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="retro-window-header active mb-4">
          <div className="flex items-center space-x-2 text-xs font-pixel text-zinc-300">
            <Shield className="w-3.5 h-3.5 text-red-500" />
            <span>ETHICS_CONSTITUTION.TXT // THE 302 DOCKET</span>
          </div>
          <button
            onClick={() => {
              soundEngine.playKeyClick();
              onClose();
            }}
            className="retro-btn retro-btn-red text-xs px-2"
          >
            [X]
          </button>
        </div>

        <h2 className="text-xl font-bold font-editorial text-zinc-100 mb-1">
          The 302 Docket: Investigative Constitution
        </h2>
        <div className="retro-stamp text-[9px] py-0 px-2 mb-4">
          NON-GOVERNMENTAL / INDEPENDENT ARCHIVE
        </div>

        <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
          {/* Institutional Disclaimer */}
          <div className="p-3 bg-[#090b0d] border border-[#21262d]">
            <h4 className="font-pixel text-[10px] text-amber-400 uppercase mb-1 flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> LEGAL & NON-AFFILIATION NOTICE
            </h4>
            <p className="text-zinc-400">
              The 302 Docket is an independent cyber-investigative archive inspired by 1990s law enforcement terminal records, FBI Form FD-302 casework documentation, and public judicial dockets. It is not affiliated with, endorsed by, or connected to the Federal Bureau of Investigation, the U.S. Department of Justice, or any municipal, state, or federal law enforcement agency.
            </p>
          </div>

          <div>
            <h4 className="font-pixel text-[10px] text-zinc-200 uppercase mb-1 flex items-center">
              <BookOpen className="w-3.5 h-3.5 mr-1 text-red-400" /> FORM FD-302 SIGNIFICANCE
            </h4>
            <p className="text-zinc-400">
              In federal casework, Form FD-302 is the formal memorandum used by Special Agents to document what was heard, observed, and gathered during interviews with witnesses, victims, and subjects. It is an objective evidentiary building block. Every case leaves a paper trail.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-pixel text-[10px] text-zinc-200 uppercase">
              FIVE CORE ETHICAL PILLARS:
            </h4>

            <div className="p-2.5 bg-[#090b0d] border border-[#21262d]">
              <span className="font-pixel text-[9px] text-emerald-400 block mb-0.5">
                1. Zero Invention of Evidence or Dialogue
              </span>
              We do not invent testimony, psychological dialogue, or unverified leads. All facts are derived from sworn depositions, autopsy reports, unsealed grand jury transcripts, or federal Inspector General audits.
            </div>

            <div className="p-2.5 bg-[#090b0d] border border-[#21262d]">
              <span className="font-pixel text-[9px] text-emerald-400 block mb-0.5">
                2. Protection of Minor & Survivor Identities
              </span>
              Minor victim identities and non-public witness details are rigorously protected in compliance with court protective orders and ethical standards.
            </div>

            <div className="p-2.5 bg-[#090b0d] border border-[#21262d]">
              <span className="font-pixel text-[9px] text-emerald-400 block mb-0.5">
                3. Separation of Allegations from Judicially Proven Facts
              </span>
              Dossiers clearly differentiate unproven charges, investigative hypotheses, and sworn trial findings to prevent bias.
            </div>

            <div className="p-2.5 bg-[#090b0d] border border-[#21262d]">
              <span className="font-pixel text-[9px] text-emerald-400 block mb-0.5">
                4. Tone from Interface, Not Trauma Exploitation
              </span>
              The eerie, unsettling atmosphere derives strictly from vintage computer interfaces, terminal audio, and documentary rigor—never from gratuitous gore or cheap exploitation of real victims.
            </div>

            <div className="p-2.5 bg-[#090b0d] border border-[#21262d]">
              <span className="font-pixel text-[9px] text-emerald-400 block mb-0.5">
                5. Comprehensive Source Transparency
              </span>
              Every docket maintains direct public citations to official trial transcripts, coroner dockets, and verified reporting.
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#2d333b] flex justify-end">
          <button
            onClick={() => {
              soundEngine.playKeyClick();
              onClose();
            }}
            className="retro-btn px-4 py-1.5 text-xs font-tech"
          >
            ACKNOWLEDGE & EXIT
          </button>
        </div>
      </div>
    </div>
  );
};
