import React from 'react';
import { Shield, Lock, Bookmark, Eye, EyeOff, FileText, Settings, LogOut, Terminal, Monitor, Tv } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useArchive } from '../context/ArchiveContext.tsx';
import { soundEngine } from '../utils/soundEngine.ts';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, caseSlug?: string) => void;
  onOpenLogin: () => void;
  onOpenMethodology: () => void;
  onOpenSearch?: () => void;
  crtEnabled?: boolean;
  onToggleCrt?: () => void;
  homeMode?: 'dossier' | 'workstation';
  onToggleHomeMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenLogin,
  onOpenMethodology,
  onOpenSearch,
  crtEnabled,
  onToggleCrt,
  homeMode = 'dossier',
  onToggleHomeMode,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { bookmarks, revealRedactions, setRevealRedactions } = useArchive();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0e1013]/95 backdrop-blur-md">
      {/* Top security header bar */}
      <div className="bg-zinc-950 px-4 py-1 text-xs border-b border-zinc-800/60 font-typewriter text-zinc-400 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-red-500 font-bold tracking-widest text-[10px]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5" />
            FD-302 CLASSIFICATION: PUBLIC DOSSIER
          </span>
          <span className="hidden md:inline text-zinc-600">|</span>
          <span className="hidden md:inline text-zinc-400">ARCHIVE RECORD SERIES #302-INVESTIGATIVE</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          {onToggleCrt && (
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                onToggleCrt();
              }}
              className="hidden sm:flex items-center space-x-1 hover:text-amber-400 transition-colors cursor-pointer"
              title="Toggle CRT scanline and phosphor simulation"
            >
              <Tv className="w-3 h-3 text-emerald-500" />
              <span>CRT: {crtEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <span className="hidden sm:inline text-zinc-700">|</span>

          <button
            onClick={() => setRevealRedactions((prev) => !prev)}
            className="flex items-center space-x-1 hover:text-amber-400 transition-colors cursor-pointer text-[11px]"
            title="Toggle redaction visibility in document transcripts"
          >
            {revealRedactions ? (
              <>
                <Eye className="w-3 h-3 text-amber-500" />
                <span className="text-amber-400">Redactions: REVEALED</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 text-zinc-500" />
                <span className="text-zinc-400">Redactions: MASKED</span>
              </>
            )}
          </button>
          <span className="text-zinc-600">|</span>
          <button
            onClick={onOpenMethodology}
            className="hover:text-zinc-200 transition-colors text-[11px]"
          >
            Ethics & Methodology
          </button>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 border border-zinc-700 bg-zinc-900 flex items-center justify-center rounded-sm group-hover:border-red-600/70 transition-colors shadow-inner">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-typewriter tracking-widest text-lg font-bold text-zinc-100 group-hover:text-red-400 transition-colors">
                THE 302 DOCKET
              </span>
              <span className="stamp-red text-[9px] py-0 px-1 border border-red-700">DOCKET</span>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 tracking-tight">
              Every case leaves a paper trail.
            </p>
          </div>
        </div>

        {/* Navigation links & Actions */}
        <div className="flex items-center space-x-3 md:space-x-5">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 text-xs font-mono rounded tracking-wider transition-colors ${
              currentView === 'home'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5 text-zinc-400" />
            CASE DOSSIERS
          </button>

          {/* Bookmarks */}
          <button
            onClick={() => onNavigate('bookmarks')}
            className={`px-3 py-1.5 text-xs font-mono rounded tracking-wider transition-colors flex items-center ${
              currentView === 'bookmarks'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            SAVED FILES
            {bookmarks.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-[10px]">
                {bookmarks.length}
              </span>
            )}
          </button>

          {/* Quick Terminal Search */}
          {onOpenSearch && (
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                onOpenSearch();
              }}
              className="px-2.5 py-1.5 text-xs font-mono rounded tracking-wider text-phosphor hover:bg-zinc-800 border border-emerald-900/50 hover:border-emerald-600 transition-colors hidden sm:flex items-center"
              title="Open terminal command search"
            >
              <Terminal className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span>TERMINAL</span>
            </button>
          )}

          {/* Workstation Desktop Mode Toggle */}
          {onToggleHomeMode && (
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                onToggleHomeMode();
              }}
              className={`px-2.5 py-1.5 text-xs font-mono rounded tracking-wider transition-colors hidden md:flex items-center border ${
                homeMode === 'workstation'
                  ? 'bg-amber-950/60 border-amber-600 text-amber-300 font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
              title="Toggle Vintage Workstation Desktop"
            >
              <Monitor className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <span>{homeMode === 'workstation' ? 'DOSSIER VIEW' : '90s WORKSTATION'}</span>
            </button>
          )}

          {/* Investigator Access Button */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('admin')}
                className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors flex items-center ${
                  currentView === 'admin'
                    ? 'bg-red-950/70 border-red-700 text-red-200 font-bold'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-red-600 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                CLEARANCE ACTIVE ({user?.username})
              </button>
              <button
                onClick={logout}
                title="Revoke session"
                className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 rounded transition-colors flex items-center bg-zinc-950/60"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
              INVESTIGATOR ACCESS
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
