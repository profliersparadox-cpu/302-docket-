import React, { useState, useEffect } from 'react';
import {
  Award,
  Shield,
  Key,
  Lock,
  Unlock,
  Terminal,
  Cpu,
  Dna,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
  FolderLock,
} from 'lucide-react';
import { ArchiveStamp } from '../../types.ts';
import { archiveStamps } from '../../data/archiveVaultData.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

export const CollectiblesAndSecrets: React.FC = () => {
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>(() => {
    const saved = localStorage.getItem('docket_unlocked_stamps');
    const initial = saved ? JSON.parse(saved) : ['STAMP_FIRST_BOOT'];
    return initial;
  });

  const [selectedStamp, setSelectedStamp] = useState<ArchiveStamp | null>(null);

  const unlockStamp = (code: string) => {
    if (!unlockedCodes.includes(code)) {
      const next = [...unlockedCodes, code];
      setUnlockedCodes(next);
      localStorage.setItem('docket_unlocked_stamps', JSON.stringify(next));
      soundEngine.playBootBeep();
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-emerald-400" />;
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-amber-400" />;
      case 'Dna':
        return <Dna className="w-5 h-5 text-indigo-400" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'Award':
        return <Award className="w-5 h-5 text-emerald-400" />;
      case 'Key':
        return <Key className="w-5 h-5 text-amber-400" />;
      case 'MapPin':
        return <Award className="w-5 h-5 text-teal-400" />;
      default:
        return <Shield className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d11] text-zinc-300 font-tech select-none overflow-hidden">
      {/* Header Toolbar */}
      <div className="bg-[#12161f] border-b border-[#2d3442] px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-amber-950 border border-amber-700 text-amber-300 font-pixel text-[10px]">
            ARCHIVE_STAMPS.EXE
          </span>
          <span className="text-zinc-500 hidden sm:inline">|</span>
          <span className="text-zinc-400 font-mono text-xs">
            Collectible Investigative Badges & Secret Discoveries
          </span>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          UNLOCKED: <strong className="text-emerald-400">{unlockedCodes.length}</strong> / {archiveStamps.length}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#080a0e] space-y-6">
        {/* Intro Banner */}
        <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-100 font-editorial">
              The 302 Bureau Collectible Registry
            </h3>
            <p className="text-xs font-mono text-zinc-400">
              Explore the investigative workstation, inspect forensic exhibits, run terminal commands, and uncover hidden bureau caches to unlock official digital stamps.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-center">
              <span className="text-lg font-bold text-phosphor block font-mono">
                {Math.round((unlockedCodes.length / archiveStamps.length) * 100)}%
              </span>
              <span className="text-[9px] text-zinc-500 uppercase font-mono">Clearance Index</span>
            </div>
          </div>
        </div>

        {/* Stamps Album Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {archiveStamps.map((stamp) => {
            const isUnlocked = unlockedCodes.includes(stamp.code);

            return (
              <div
                key={stamp.id}
                onClick={() => {
                  soundEngine.playKeyClick();
                  setSelectedStamp(stamp);
                }}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isUnlocked
                    ? 'bg-[#121620] border-amber-600/70 hover:border-amber-400 shadow-lg'
                    : 'bg-zinc-950/60 border-zinc-900 opacity-60 hover:opacity-80'
                }`}
                style={{ minHeight: '170px' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
                      {isUnlocked ? getIcon(stamp.iconName) : <Lock className="w-5 h-5 text-zinc-600" />}
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        stamp.rarity === 'Top Secret'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : stamp.rarity === 'Classified'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {stamp.rarity}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-zinc-200 line-clamp-1 font-mono">
                    {isUnlocked ? stamp.title : 'RESTRICTED ARCHIVE SEAL'}
                  </h4>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 font-mono">
                    {isUnlocked ? stamp.description : `HINT: ${stamp.howToUnlock}`}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">{stamp.category}</span>
                  <span className={isUnlocked ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
                    {isUnlocked ? 'ACQUIRED' : 'LOCKED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secret Commands & Hints Section */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3 font-mono text-xs">
          <div className="text-amber-400 font-bold uppercase flex items-center space-x-1.5">
            <Key className="w-4 h-4 text-amber-400" />
            <span>TERMINAL CLASSIFIED DISCOVERY HINTS:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-zinc-400">
            <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded">
              <strong className="text-phosphor block mb-1">COMMAND: HOOVER</strong>
              <span>Displays historical background on Form FD-302 and J. Edgar Hoover\'s early forensic lab centralization.</span>
            </div>
            <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded">
              <strong className="text-phosphor block mb-1">COMMAND: CODIS</strong>
              <span>Inspects the FBI national DNA index system protocols and STR locus standards.</span>
            </div>
            <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded">
              <strong className="text-phosphor block mb-1">COMMAND: SECRET / SPOOKY</strong>
              <span>Reveals hidden easter eggs and classified historical casework notes.</span>
            </div>
            <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded">
              <strong className="text-phosphor block mb-1">DESKTOP ICON: .BUREAU_CONFIDENTIAL</strong>
              <span>Click the hidden red confidential folder on the desktop wallpaper to claim an archive badge.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
