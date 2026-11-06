import React, { useEffect, useState } from 'react';
import { soundEngine } from '../../utils/soundEngine.ts';

interface FileRetrievalModalProps {
  caseNumber: string;
  title: string;
  onFinish: () => void;
}

export const FileRetrievalModal: React.FC<FileRetrievalModalProps> = ({
  caseNumber,
  title,
  onFinish,
}) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('LOCATING RESTRICTED TRACK ON DISK...');

  useEffect(() => {
    soundEngine.playFileAccess();

    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText(`DECRYPTING ARCHIVAL SECTOR 0x${Math.floor(Math.random() * 0xffff).toString(16).toUpperCase()}...`);
      soundEngine.playKeyClick();
    }, 200);

    const t2 = setTimeout(() => {
      setProgress(80);
      setStatusText(`VALIDATING FORM FD-302 INTEGRITY & CODIS PROFILES...`);
      soundEngine.playKeyClick();
    }, 450);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('ACCESS CLEARANCE GRANTED. DECOMPRESSING DOSSIER...');
      soundEngine.playBeep(980, 0.08, 'square');
    }, 700);

    const t4 = setTimeout(() => {
      onFinish();
    }, 950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div
      onClick={onFinish}
      className="fixed inset-0 z-50 bg-[#06080a]/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer select-none"
    >
      <div className="retro-window max-w-lg w-full p-6 text-zinc-300 font-terminal space-y-4 shadow-2xl">
        <div className="border-b border-[#2d333b] pb-2 flex items-center justify-between text-xs font-pixel text-zinc-400">
          <span className="text-red-400">FILE_RETRIEVAL_DAEMON.EXE</span>
          <span className="text-zinc-600">SECTOR_SCAN</span>
        </div>

        <div className="text-sm font-tech text-zinc-400">
          MOUNTING CASE DOCKET: <span className="text-amber-400 font-bold">{caseNumber}</span>
        </div>

        <div className="text-lg font-editorial text-zinc-100 font-bold">
          {title}
        </div>

        {/* Retro Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-pixel text-zinc-400">
            <span>{statusText}</span>
            <span className="text-phosphor font-bold">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-zinc-950 border border-zinc-700 p-0.5">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="text-xs font-tech text-zinc-500 pt-2 border-t border-zinc-900 flex justify-between items-center">
          <span>CLASSIFIED INVESTIGATIVE MATERIAL</span>
          <span className="text-zinc-600">[CLICK TO SKIP]</span>
        </div>
      </div>
    </div>
  );
};
