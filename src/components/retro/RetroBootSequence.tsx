import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine.ts';

interface RetroBootSequenceProps {
  onComplete: () => void;
}

export const RetroBootSequence: React.FC<RetroBootSequenceProps> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isSkipped, setIsSkipped] = useState(false);
  const [rememberSkip, setRememberSkip] = useState(false);
  const [showAccessGranted, setShowAccessGranted] = useState(false);

  const bootMessages = [
    '302 DOCKET INVESTIGATIVE KERNEL v4.19 (c) 1996 BUREAU DIGITAL SYSTEMS',
    'ROM BIOS (DOCKET-X86) CHECK: 0x000F0000... OK',
    'MEMORY TEST: 640K BASE CONVENTIONAL OK',
    'EXTENDED MEMORY: 32768K HIGH RAM TESTED OK',
    'DETECTING PRIMARY STORAGE: /dev/archive_hd0 (1.2 GB IDE)... MOUNTED',
    'INITIALIZING ENCRYPTION SUBSYSTEM: SHA-256 / BCRYPT SESSIONS ACTIVE',
    'LOADING CASE CATALOG DATABASE: DOCKET.SQLITE... 100% OK',
    'CHECKING INTEGRITY OF CLASSIFIED FD-302 INTERVIEW TRANSCRIPTS... VERIFIED',
    'AUDITING CODIS AND FORENSIC DNA REGISTRIES... NO DRIFT DETECTED',
    'ESTABLISHING SECURE INVESTIGATOR WORKSTATION TERMINAL...',
    'READY: SECURITY CLEARANCE GRANTED.',
  ];

  useEffect(() => {
    soundEngine.playBootBeep();

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < bootMessages.length) {
        setLines((prev) => [...prev, bootMessages[currentIndex]]);
        soundEngine.playKeyClick();
        currentIndex++;
      } else {
        clearInterval(interval);
        setShowAccessGranted(true);
        setTimeout(() => {
          onComplete();
        }, 1200);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const handleFinish = () => {
    if (rememberSkip) {
      localStorage.setItem('docket_skip_boot_permanent', 'true');
    }
    if (!isSkipped) {
      setIsSkipped(true);
      soundEngine.playKeyClick();
      onComplete();
    }
  };

  return (
    <div
      onClick={handleFinish}
      className="fixed inset-0 z-[10000] bg-[#07080a] text-zinc-300 font-terminal text-base sm:text-lg p-6 sm:p-12 flex flex-col justify-between cursor-pointer select-none overflow-hidden"
    >
      <div className="space-y-1.5 max-w-4xl">
        <div className="text-zinc-500 mb-4 border-b border-zinc-800 pb-2 flex flex-wrap justify-between items-center text-xs sm:text-sm font-tech gap-2">
          <span>SYSTEM_BOOT // CPU 486DX2-66 // ARCHIVE_INIT</span>
          <div className="flex items-center space-x-3">
            <label
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1.5 text-zinc-400 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={rememberSkip}
                onChange={(e) => setRememberSkip(e.target.checked)}
                className="accent-amber-500"
              />
              <span className="text-[11px]">Remember preference (Skip in future)</span>
            </label>
            <span className="text-amber-500 animate-pulse font-bold">[CLICK ANYWHERE TO SKIP]</span>
          </div>
        </div>

        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`tracking-wide ${
              idx === 0
                ? 'text-red-400 font-bold mb-3'
                : idx === lines.length - 1
                ? 'text-phosphor font-bold mt-2'
                : 'text-zinc-400'
            }`}
          >
            <span className="text-zinc-600 mr-2">&gt;</span>
            {line}
          </div>
        ))}

        {showAccessGranted && (
          <div className="mt-4 p-4 bg-emerald-950/80 border-2 border-emerald-500 rounded max-w-md animate-in fade-in zoom-in duration-300 space-y-1">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold text-lg font-pixel tracking-wider">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>ACCESS GRANTED</span>
            </div>
            <p className="text-xs font-mono text-emerald-200">
              WORKSTATION LEVEL 4 CLEARANCE INITIALIZED. WELCOME, INVESTIGATOR.
            </p>
          </div>
        )}

        <div className="flex items-center text-phosphor mt-2">
          <span className="text-zinc-600 mr-2">&gt;</span>
          <span className="inline-block w-3 h-5 bg-emerald-400 cursor-blink ml-1" />
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs font-tech text-zinc-500">
        <div>THE 302 DOCKET &bull; EVERY CASE LEAVES A PAPER TRAIL</div>
        <div className="text-zinc-400">CLICK TO ENTER RETRO WORKSTATION &rarr;</div>
      </div>
    </div>
  );
};
