import React, { useState } from 'react';
import { Power, Terminal, Cpu } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine.ts';

interface RetroShutdownSequenceProps {
  onPowerOn: () => void;
}

export const RetroShutdownSequence: React.FC<RetroShutdownSequenceProps> = ({ onPowerOn }) => {
  const [phase, setPhase] = useState<'flushing' | 'off'>('flushing');

  React.useEffect(() => {
    soundEngine.playKeyClick();
    const timer = setTimeout(() => {
      setPhase('off');
      soundEngine.playWarning();
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleRestart = () => {
    soundEngine.playBootBeep();
    onPowerOn();
  };

  if (phase === 'flushing') {
    return (
      <div className="fixed inset-0 z-[10000] bg-black text-amber-500 font-terminal p-8 sm:p-16 flex flex-col justify-center items-center select-none">
        <div className="max-w-xl w-full border border-zinc-800 bg-zinc-950 p-6 space-y-3 shadow-2xl">
          <div className="text-zinc-500 text-xs font-tech border-b border-zinc-800 pb-2 flex justify-between">
            <span>SYSTEM_SHUTDOWN // FLUSH_ACTIVE_BUFFERS</span>
            <span className="text-red-400 animate-pulse">TERMINATING SESSIONS</span>
          </div>
          <div className="text-zinc-300 text-sm sm:text-base space-y-1">
            <div>&gt; Flushing volatile memory cache (SRAM / DRAM)... [DONE]</div>
            <div>&gt; Unmounting /dev/archive_hd0 (1.2 GB IDE)... [PARKED]</div>
            <div>&gt; Revoking active investigator session tokens... [SECURED]</div>
            <div>&gt; Disengaging CRT cathode high-voltage power supply...</div>
          </div>
          <div className="pt-2 text-zinc-500 text-xs font-tech animate-pulse">
            PLEASE STAND BY WHILE HARDWARE COMPLETES PARK CYCLE...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-[#030405] text-zinc-400 font-terminal flex flex-col justify-center items-center select-none p-6 text-center">
      <div className="max-w-md w-full border-2 border-zinc-800 bg-zinc-950 p-8 rounded shadow-2xl space-y-6">
        <div className="w-12 h-12 mx-auto rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-500">
          <Power className="w-6 h-6 text-red-500/70" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold font-pixel text-zinc-200 tracking-wider">
            IT IS NOW SAFE TO POWER OFF YOUR COMPUTER.
          </h2>
          <p className="text-xs font-tech text-zinc-500">
            THE 302 DOCKET // SYSTEM BUS DISENGAGED // ALL SECTORS SECURED
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-900">
          <button
            onClick={handleRestart}
            className="w-full py-3 px-6 bg-emerald-950 hover:bg-emerald-900 border-2 border-emerald-600 text-emerald-300 font-pixel text-xs tracking-widest rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center space-x-2 active:scale-98"
          >
            <Power className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>POWER ON WORKSTATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
