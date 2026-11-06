import React, { useState, useEffect } from 'react';
import { Search, Filter, Database, MapPin, AlertCircle, CheckCircle2, Terminal, Cpu } from 'lucide-react';
import { CrimeCategory, ArchiveStats } from '../types.ts';
import { useArchive } from '../context/ArchiveContext.tsx';
import { soundEngine } from '../utils/soundEngine.ts';

interface CinematicIntroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedStatus: string;
  onSelectStatus: (st: string) => void;
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  stats: ArchiveStats | null;
  onResetFilters: () => void;
}

const CATEGORIES: { label: string; value: string; countKey?: CrimeCategory }[] = [
  { label: 'ALL_DOCKETS', value: 'All' },
  { label: 'Crimes Against Children', value: 'Crimes Against Children' },
  { label: 'Homicide / Cold Cases', value: 'Homicide' },
  { label: 'Missing Persons', value: 'Missing Persons' },
  { label: 'Special Victims', value: 'Special Victims / Sexual Offences' },
  { label: 'Kidnapping', value: 'Kidnapping' },
  { label: 'Organised Crime', value: 'Organised Crime' },
];

const STATUSES: { label: string; value: string }[] = [
  { label: 'ALL_STATUSES', value: 'All' },
  { label: 'Cold Case / Unresolved', value: 'Cold Case / Unresolved' },
  { label: 'Convicted', value: 'Convicted' },
  { label: 'Solved', value: 'Solved' },
  { label: 'Active Investigation', value: 'Active Investigation' },
];

export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  selectedLocation,
  onSelectLocation,
  stats,
  onResetFilters,
}) => {
  const { settings } = useArchive();
  const [stampRevealed, setStampRevealed] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const fullTagline = 'EVERY CASE LEAVES A PAPER TRAIL.';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullTagline.length) {
        setTypewriterText(fullTagline.slice(0, index));
        soundEngine.playKeyClick();
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => setStampRevealed(true), 300);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedStatus !== 'All' ||
    selectedLocation.trim() !== '';

  return (
    <div className="relative border-b border-[#2d333b] bg-[#07090b] overflow-hidden">
      {/* Background scanline pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#151b22_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Terminal Window Header Bar */}
        <div className="retro-window p-6 mb-8">
          <div className="border-b border-[#2d333b] pb-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-tech text-zinc-400">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-red-600 animate-pulse inline-block" />
              <span className="text-zinc-200 font-pixel text-[11px]">
                WORKSTATION_ID: // BUREAU-CRT-302 // ACCESS: LEVEL_3
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">FD-302 INVESTIGATIVE INTERVIEWS & FORENSICS</span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-phosphor font-pixel text-[10px] flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> REPOSITORY ONLINE
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-amber-500 font-mono">ENCRYPTION: BCRYPT+SQLITE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-2 py-0.5 bg-red-950/80 border border-red-800 text-red-300 font-pixel text-[10px] uppercase">
                  CONFIDENTIAL DOSSIER SYSTEM
                </span>
                {stampRevealed && (
                  <span className="retro-stamp text-[10px] py-0 px-2 animate-in fade-in zoom-in-95 duration-300">
                    DECLASSIFIED RECORDS
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-100 font-pixel mb-3">
                {settings.archiveTitle || 'THE 302 DOCKET'}
              </h1>

              <div className="font-terminal text-lg sm:text-2xl text-phosphor min-h-[2rem] flex items-center tracking-wider">
                <span>&gt; {typewriterText}</span>
                <span className="inline-block w-2.5 h-5 bg-emerald-400 ml-1 cursor-blink" />
              </div>

              <p className="mt-3 text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl font-tech">
                {settings.introBody ||
                  'An immersive cyber-investigative repository inspired by 1990s law enforcement terminals, FBI Form FD-302 interview casework, and public judicial dockets. Examine documented chronologies, inspect physical evidence, analyze suspect networks, and review courtroom precedents.'}
              </p>
            </div>

            {/* Retro Telemetry Box */}
            <div className="lg:col-span-4 bg-[#090b0d] border border-[#2d333b] p-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#2d333b] mb-3 text-xs font-pixel text-zinc-400">
                <div className="flex items-center space-x-1.5 text-phosphor">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>SYSTEM_TELEMETRY</span>
                </div>
                <span className="text-zinc-600">[TRACK_00]</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-tech">
                <div className="bg-[#121519] p-2.5 border border-[#21262d]">
                  <div className="text-xl font-bold font-terminal text-zinc-100">
                    {stats?.totalCases ?? 3}
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase">Documented Cases</div>
                </div>

                <div className="bg-[#121519] p-2.5 border border-[#21262d]">
                  <div className="text-xl font-bold font-terminal text-amber-400">
                    {stats?.exhibitsLogged ?? 8}
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase">Logged Exhibits</div>
                </div>

                <div className="bg-[#121519] p-2.5 border border-[#21262d]">
                  <div className="text-xl font-bold font-terminal text-red-400">
                    {stats?.decadesCovered ?? 6}
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase">Decades Covered</div>
                </div>

                <div className="bg-[#121519] p-2.5 border border-[#21262d]">
                  <div className="text-xl font-bold font-terminal text-phosphor">100%</div>
                  <div className="text-[10px] text-zinc-400 uppercase">Verified Sources</div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#21262d] text-[10px] text-zinc-500 font-tech flex items-center justify-between">
                <span>SURVIVOR DIGNITY PROTOCOL:</span>
                <span className="text-emerald-400">STRICT FACTUAL RIGOR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Retro Command Search Console */}
        <div className="retro-window p-4 sm:p-5">
          <div className="border-b border-[#2d333b] pb-2 mb-4 flex items-center justify-between text-xs font-pixel text-zinc-400">
            <div className="flex items-center space-x-2 text-amber-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>TERMINAL_SEARCH // FILTER_CONDITIONS</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  soundEngine.playKeyClick();
                  onResetFilters();
                }}
                className="retro-btn retro-btn-red text-[10px] font-pixel"
              >
                RESET_FILTERS
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  soundEngine.playKeyClick();
                  onSearchChange(e.target.value);
                }}
                placeholder="Query case title, DOCKET ID, suspect, or exhibit..."
                className="w-full bg-[#0a0c0e] border border-[#2d333b] pl-9 pr-4 py-2 text-xs font-tech text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-0"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 font-mono"
                >
                  [CLEAR]
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="w-full md:w-56">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  soundEngine.playKeyClick();
                  onSelectStatus(e.target.value);
                }}
                className="w-full bg-[#0a0c0e] border border-[#2d333b] px-3 py-2 text-xs font-tech text-zinc-200 focus:outline-none focus:border-red-600"
              >
                {STATUSES.map((st) => (
                  <option key={st.value} value={st.value} className="bg-zinc-950 text-zinc-200">
                    STATUS: {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Input */}
            <div className="w-full md:w-56 relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={selectedLocation}
                onChange={(e) => {
                  soundEngine.playKeyClick();
                  onSelectLocation(e.target.value);
                }}
                placeholder="Jurisdiction / State..."
                className="w-full bg-[#0a0c0e] border border-[#2d333b] pl-8 pr-3 py-2 text-xs font-tech text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Crime Category Retro Switches */}
          <div>
            <div className="flex items-center space-x-1.5 text-[11px] font-pixel text-zinc-400 mb-2">
              <Filter className="w-3 h-3 text-red-500" />
              <span>CATEGORY_DISPATCH:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => {
                      soundEngine.playKeyClick();
                      onSelectCategory(cat.value);
                    }}
                    className={`px-2.5 py-1 text-xs font-tech transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-950 text-red-100 border border-red-700 font-bold shadow-sm'
                        : 'bg-[#121519] text-zinc-400 hover:text-zinc-200 border border-[#21262d]'
                    }`}
                  >
                    [{cat.label}]
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
