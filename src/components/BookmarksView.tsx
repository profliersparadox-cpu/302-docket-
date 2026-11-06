import React, { useState, useEffect } from 'react';
import { Bookmark, ArrowLeft, Trash2, ArrowUpRight, Folder } from 'lucide-react';
import { CaseFile } from '../types.ts';
import { useArchive } from '../context/ArchiveContext.tsx';
import { soundEngine } from '../utils/soundEngine.ts';

interface BookmarksViewProps {
  onBack: () => void;
  onSelectCase: (slug: string) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({ onBack, onSelectCase }) => {
  const { bookmarks, toggleBookmark, getCaseProgress } = useArchive();
  const [bookmarkedCases, setBookmarkedCases] = useState<CaseFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases')
      .then((res) => res.json())
      .then((data) => {
        const all: CaseFile[] = data.cases || [];
        setBookmarkedCases(all.filter((c) => bookmarks.includes(c.slug)));
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [bookmarks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="retro-window p-4 mb-8">
        <div className="flex items-center justify-between border-b border-[#2d333b] pb-3 mb-4">
          <div>
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                onBack();
              }}
              className="retro-btn text-xs font-tech flex items-center mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              BACK TO DOCKET INDEX
            </button>
            <div className="flex items-center space-x-2">
              <Bookmark className="w-5 h-5 text-amber-500 fill-current" />
              <h1 className="text-xl sm:text-2xl font-bold font-editorial text-zinc-100">
                SAVED_DOSSIERS.LST ({bookmarkedCases.length})
              </h1>
            </div>
            <p className="text-xs font-tech text-zinc-400 mt-1">
              Personal investigator bookmarks and chapter reading progress log.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-phosphor font-terminal text-base">
            READING DISK SECTORS...
          </div>
        ) : bookmarkedCases.length === 0 ? (
          <div className="bg-[#090b0d] border border-[#21262d] p-8 text-center max-w-md mx-auto my-6">
            <Folder className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="font-pixel text-xs text-zinc-200 mb-1">
              NO SAVED FILES RECORDED
            </h3>
            <p className="text-xs font-tech text-zinc-500 mb-4">
              Click the bookmark icon on any case dossier to pin it here for rapid access.
            </p>
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                onBack();
              }}
              className="retro-btn px-3 py-1.5 text-xs font-tech"
            >
              EXPLORE DOSSIERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bookmarkedCases.map((c) => {
              const progress = getCaseProgress(c.id);
              return (
                <div
                  key={c.id}
                  className="bg-[#090b0d] border border-[#21262d] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-tech text-zinc-400 mb-1.5">
                      <span className="text-red-400 font-pixel text-[10px]">{c.caseNumber}</span>
                      <button
                        onClick={() => {
                          soundEngine.playKeyClick();
                          toggleBookmark(c.slug);
                        }}
                        className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3
                      onClick={() => {
                        soundEngine.playFileAccess();
                        onSelectCase(c.slug);
                      }}
                      className="font-bold text-sm text-zinc-100 font-editorial hover:text-phosphor cursor-pointer mb-1.5"
                    >
                      {c.title}
                    </h3>

                    <p className="text-xs text-zinc-400 font-tech line-clamp-2 mb-3">
                      {c.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#21262d]">
                    <div className="flex justify-between text-[10px] font-pixel text-zinc-400 mb-1">
                      <span>READING PROGRESS</span>
                      <span className="text-phosphor font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-black border border-zinc-800 mb-2.5">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <button
                      onClick={() => {
                        soundEngine.playFileAccess();
                        onSelectCase(c.slug);
                      }}
                      className="retro-btn w-full py-1 text-xs font-tech flex items-center justify-center space-x-1"
                    >
                      <span>RESUME DOSSIER</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
