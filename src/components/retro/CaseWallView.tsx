import React, { useState } from 'react';
import {
  Folder,
  Search,
  Filter,
  ArrowUpDown,
  Tag,
  Calendar,
  MapPin,
  Shield,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CaseFile, CrimeCategory, CaseStatus } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface CaseWallViewProps {
  cases: CaseFile[];
  isLoading: boolean;
  onSelectCase: (slug: string) => void;
}

export const CaseWallView: React.FC<CaseWallViewProps> = ({
  cases,
  isLoading,
  onSelectCase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'caseNumber' | 'year_desc' | 'year_asc' | 'title'>('caseNumber');
  const [hoveredCase, setHoveredCase] = useState<CaseFile | null>(null);

  const categories: string[] = [
    'All',
    'Crimes Against Children',
    'Homicide',
    'Missing Persons',
    'Special Victims / Sexual Offences',
    'Kidnapping',
  ];

  const statuses: string[] = [
    'All',
    'Convicted',
    'Cold Case / Unresolved',
    'Solved',
    'Active Investigation',
  ];

  // Filtering & sorting
  const filteredCases = cases.filter((c) => {
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inTitle = c.title.toLowerCase().includes(q);
      const inNum = c.caseNumber.toLowerCase().includes(q);
      const inLoc = c.location.toLowerCase().includes(q);
      const inSum = c.summary.toLowerCase().includes(q);
      if (!inTitle && !inNum && !inLoc && !inSum) return false;
    }
    return true;
  });

  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortBy === 'caseNumber') return a.caseNumber.localeCompare(b.caseNumber);
    if (sortBy === 'year_desc') return b.year - a.year;
    if (sortBy === 'year_asc') return a.year - b.year;
    return a.title.localeCompare(b.title);
  });

  const handleCardClick = (slug: string) => {
    soundEngine.playFileAccess();
    onSelectCase(slug);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] text-zinc-300 font-tech select-none overflow-hidden">
      {/* Wall Header Toolbar */}
      <div className="bg-[#12161e] border-b border-[#2d3442] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-300 font-pixel text-[10px]">
            CASE_WALL.EXE
          </span>
          <span className="text-zinc-500 hidden sm:inline">|</span>
          <span className="text-zinc-400 font-mono text-xs">
            Physical Folder Wall Repository ({cases.length} Total Registered Files)
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center px-2 py-1 bg-zinc-950 border border-zinc-800 rounded">
            <Search className="w-3.5 h-3.5 text-zinc-500 mr-1.5" />
            <input
              type="text"
              placeholder="Search docket wall..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none w-36 sm:w-48"
            />
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              soundEngine.playKeyClick();
              setSortBy(e.target.value as any);
            }}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono rounded px-2 py-1 focus:outline-none"
          >
            <option value="caseNumber">ORDER: Docket ID</option>
            <option value="year_desc">ORDER: Newest Year</option>
            <option value="year_asc">ORDER: Oldest Year</option>
            <option value="title">ORDER: Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Filter Category Pills Bar */}
      <div className="bg-[#0e1219] border-b border-[#262c38] px-4 py-2 flex flex-wrap gap-1.5 overflow-x-auto text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              soundEngine.playKeyClick();
              setSelectedCategory(cat);
            }}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              selectedCategory === cat
                ? 'bg-amber-950 border border-amber-700 text-amber-300 font-bold'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Folder Wall Grid Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#080a0e] relative">
        {isLoading ? (
          <div className="py-20 text-center font-mono text-xs text-zinc-500 animate-pulse">
            INDEXING SECTORS FROM PERSISTENT DATABASE...
          </div>
        ) : sortedCases.length === 0 ? (
          <div className="py-16 text-center font-mono text-xs text-zinc-500">
            NO INVESTIGATIVE FOLDERS MATCH ACTIVE FILTERS.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedCases.map((c) => {
              const isHovered = hoveredCase?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => handleCardClick(c.slug)}
                  onMouseEnter={() => setHoveredCase(c)}
                  onMouseLeave={() => setHoveredCase(null)}
                  className="group relative bg-[#131720] hover:bg-[#1a202c] border-2 border-[#2b3340] hover:border-amber-500/80 rounded shadow-xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
                  style={{ minHeight: '220px' }}
                >
                  {/* Folder Tab at top */}
                  <div className="bg-[#1e2533] group-hover:bg-amber-950/60 border-b-2 border-[#2b3340] group-hover:border-amber-600 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono transition-colors">
                    <div className="flex items-center space-x-1.5 text-zinc-300">
                      <Folder className="w-4 h-4 text-amber-500" />
                      <strong className="text-zinc-100">{c.caseNumber}</strong>
                    </div>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        c.status === 'Convicted'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : c.status === 'Cold Case / Unresolved'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {c.status === 'Cold Case / Unresolved' ? 'UNRESOLVED' : c.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                        {c.category} • {c.year}
                      </span>
                      <h3 className="text-sm font-bold font-editorial text-zinc-100 group-hover:text-amber-300 leading-snug line-clamp-2 mt-0.5">
                        {c.title}
                      </h3>
                      <p className="text-[11px] font-mono text-zinc-400 line-clamp-2 mt-1">
                        {c.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span className="truncate max-w-[140px]">{c.location}</span>
                      <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">
                        ACCESS &rarr;
                      </span>
                    </div>
                  </div>

                  {/* Redacted Bar Accent */}
                  <div className="h-1 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Hover Dossier Preview (Bottom Bar) */}
      {hoveredCase && (
        <div className="p-2.5 bg-zinc-950 border-t border-amber-500/80 text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2 truncate">
            <span className="px-2 py-0.5 bg-amber-950 text-amber-300 font-bold border border-amber-800 rounded text-[10px]">
              {hoveredCase.caseNumber}
            </span>
            <span className="text-zinc-200 font-bold truncate">{hoveredCase.title}:</span>
            <span className="text-zinc-400 truncate hidden md:inline">{hoveredCase.summary}</span>
          </div>
          <span className="text-amber-400 font-bold shrink-0">
            CLICK TO OPEN FULL 9-CHAPTER DOSSIER
          </span>
        </div>
      )}
    </div>
  );
};
