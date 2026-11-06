import React from 'react';
import { Folder, Bookmark, Calendar, MapPin, ChevronRight, AlertTriangle, ShieldAlert, FileText, ArrowUpRight } from 'lucide-react';
import { CaseFile } from '../types.ts';
import { useArchive } from '../context/ArchiveContext.tsx';
import { soundEngine } from '../utils/soundEngine.ts';

interface CaseCatalogProps {
  cases: CaseFile[];
  isLoading: boolean;
  onSelectCase: (slug: string) => void;
}

export const CaseCatalog: React.FC<CaseCatalogProps> = ({
  cases,
  isLoading,
  onSelectCase,
}) => {
  const { isBookmarked, toggleBookmark, getCaseProgress } = useArchive();

  if (isLoading) {
    return (
      <div className="py-20 text-center font-terminal text-lg text-phosphor space-y-2">
        <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent animate-spin mb-2" />
        <div>&gt; ACCESSING ENCRYPTED DOCKET SECTORS...</div>
        <div className="text-xs font-tech text-zinc-500">SEARCHING REPOSITORY INDEX: /dev/docket_cases.db</div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="retro-window max-w-lg mx-auto p-8 my-10 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-pixel text-sm text-zinc-200 mb-1">
          ERROR 404: NO MATCHING DOCKETS
        </h3>
        <p className="text-zinc-400 text-xs font-tech leading-relaxed">
          No records matched your search parameters. Reset terminal filters or query by case number.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Catalog Header Bar */}
      <div className="flex items-center justify-between border-b border-[#2d333b] pb-3 text-xs font-pixel text-zinc-400">
        <div className="flex items-center space-x-2">
          <Folder className="w-4 h-4 text-amber-500" />
          <span>INDEXED INVESTIGATIVE DOSSIERS ({cases.length})</span>
        </div>
        <div className="font-tech text-zinc-500 hidden sm:block">
          STATUS: CLASSIFIED DOCKET ACCESS ACTIVE
        </div>
      </div>

      {/* Grid of Case Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((c) => {
          const bookmarked = isBookmarked(c.slug);
          const progress = getCaseProgress(c.id);
          const isUnsolved = c.status === 'Cold Case / Unresolved' || c.status === 'Active Investigation';

          return (
            <div
              key={c.id}
              className="retro-window flex flex-col justify-between group hover:border-[#4a5568] transition-all duration-200"
            >
              {/* Retro Window Titlebar for each Case */}
              <div className="retro-window-header">
                <div className="flex items-center space-x-2 text-xs font-pixel text-zinc-300 truncate">
                  <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{c.caseNumber}</span>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playKeyClick();
                      toggleBookmark(c.slug);
                    }}
                    className={`p-1 hover:text-amber-400 transition-colors ${
                      bookmarked ? 'text-amber-400' : 'text-zinc-600'
                    }`}
                    title={bookmarked ? 'Remove saved file' : 'Save file'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Case Visual Banner if available */}
              {c.bannerImageUrl && (
                <div className="relative h-40 bg-black overflow-hidden border-b border-[#21262d]">
                  <img
                    src={c.bannerImageUrl}
                    alt={c.title}
                    className="w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-500 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121519] via-transparent to-transparent" />
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`text-[9px] font-pixel py-0.5 px-2 border ${
                        isUnsolved
                          ? 'bg-red-950/90 text-red-300 border-red-700'
                          : 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Content Box */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-[10px] font-pixel text-zinc-400 mb-2">
                    <span className="text-amber-400">{c.category}</span>
                    <span>&bull;</span>
                    <span className="flex items-center text-zinc-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {c.year}
                    </span>
                  </div>

                  <h3
                    onClick={() => {
                      soundEngine.playFileAccess();
                      onSelectCase(c.slug);
                    }}
                    className="text-base font-bold font-editorial text-zinc-100 group-hover:text-phosphor transition-colors cursor-pointer leading-snug mb-2"
                  >
                    {c.title}
                  </h3>

                  {c.subtitle && (
                    <p className="text-xs font-serif text-zinc-400 italic line-clamp-2 mb-3">
                      {c.subtitle}
                    </p>
                  )}

                  <p className="text-xs text-zinc-300 font-tech leading-relaxed line-clamp-3 mb-4">
                    {c.summary}
                  </p>

                  {/* Content Warnings */}
                  {c.contentWarnings && c.contentWarnings.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {c.contentWarnings.slice(0, 2).map((cw, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-tech px-1.5 py-0.5 bg-black/60 border border-[#21262d] text-zinc-400"
                        >
                          Notice: {cw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-[#21262d] mt-auto">
                  {progress > 0 && (
                    <div className="mb-2.5">
                      <div className="flex justify-between text-[10px] font-pixel text-zinc-400 mb-1">
                        <span>DOSSIER READ PROGRESS</span>
                        <span className="text-phosphor font-bold">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black border border-zinc-800">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-tech">
                    <div className="text-zinc-500 flex items-center truncate max-w-[140px]">
                      <MapPin className="w-3 h-3 mr-1 shrink-0 text-zinc-600" />
                      <span className="truncate">{c.location}</span>
                    </div>

                    <button
                      onClick={() => {
                        soundEngine.playFileAccess();
                        onSelectCase(c.slug);
                      }}
                      className="retro-btn text-[11px] font-tech flex items-center space-x-1 group-hover:border-emerald-700"
                    >
                      <span>OPEN FILE</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
