import React, { useState, useEffect } from 'react';
import {
  Folder,
  Terminal,
  FileText,
  Lock,
  Volume2,
  VolumeX,
  Tv,
  Eye,
  EyeOff,
  Shield,
  HelpCircle,
  Database,
  Bookmark,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useArchive } from '../../context/ArchiveContext.tsx';
import { soundEngine } from '../../utils/soundEngine.ts';

interface RetroOSDesktopProps {
  currentView: string;
  onNavigate: (view: string, caseSlug?: string) => void;
  onOpenLogin: () => void;
  onOpenMethodology: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  onOpenSearch: () => void;
}

export const RetroOSDesktop: React.FC<RetroOSDesktopProps> = ({
  currentView,
  onNavigate,
  onOpenLogin,
  onOpenMethodology,
  crtEnabled,
  onToggleCrt,
  onOpenSearch,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { bookmarks, revealRedactions, setRevealRedactions } = useArchive();
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted);
  const [timeStr, setTimeStr] = useState('');
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleIconClick = (action: () => void) => {
    soundEngine.playKeyClick();
    action();
  };

  return (
    <div>
      {/* Desktop Quick-Launch Icons Bar */}
      <div className="bg-[#0e1115] border-b border-[#2d333b] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-tech text-zinc-300">
        <div className="flex items-center space-x-2">
          <div className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-300 font-pixel text-[10px] tracking-wider uppercase">
            THE 302 DOCKET // OS v4.19
          </div>
          <span className="hidden sm:inline text-zinc-600">|</span>
          <span className="text-emerald-400 font-mono text-[11px] hidden sm:inline drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]">
            &gt; EVERY CASE LEAVES A PAPER TRAIL.
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => handleIconClick(() => onNavigate('home'))}
            className={`px-2.5 py-1 text-xs font-tech flex items-center space-x-1 border ${
              currentView === 'home'
                ? 'bg-zinc-800 border-zinc-600 text-phosphor'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CASES.EXE</span>
          </button>

          <button
            onClick={() => handleIconClick(onOpenSearch)}
            className="px-2.5 py-1 text-xs font-tech flex items-center space-x-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">TERMINAL_SEARCH</span>
          </button>

          <button
            onClick={() => handleIconClick(() => onNavigate('bookmarks'))}
            className={`px-2.5 py-1 text-xs font-tech flex items-center space-x-1 border ${
              currentView === 'bookmarks'
                ? 'bg-zinc-800 border-zinc-600 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">SAVED_FILES</span>
            {bookmarks.length > 0 && (
              <span className="px-1 bg-amber-500/20 text-amber-400 text-[10px] font-pixel border border-amber-500/40">
                {bookmarks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleIconClick(onOpenMethodology)}
            className="px-2.5 py-1 text-xs font-tech flex items-center space-x-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ETHICS.TXT</span>
          </button>

          {/* Investigator Access Button */}
          {isAuthenticated ? (
            <button
              onClick={() => handleIconClick(() => onNavigate('admin'))}
              className={`px-2.5 py-1 text-xs font-tech flex items-center space-x-1 border ${
                currentView === 'admin'
                  ? 'bg-red-950 border-red-700 text-red-200 font-bold'
                  : 'bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <span>CLEARANCE: {user?.username}</span>
            </button>
          ) : (
            <button
              onClick={() => handleIconClick(onOpenLogin)}
              className="px-2.5 py-1 text-xs font-tech flex items-center space-x-1 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">INVESTIGATOR_LOGIN</span>
              <span className="sm:hidden">LOGIN</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating retro audio/CRT toggles toolbar */}
      <div className="fixed bottom-3 right-4 z-50 flex items-center space-x-2 bg-zinc-950/90 border border-zinc-700 p-1.5 shadow-2xl rounded-xs text-xs font-tech">
        {/* Audio Mute Button */}
        <button
          onClick={handleToggleMute}
          className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${
            isMuted ? 'text-zinc-500 hover:text-zinc-300' : 'text-phosphor'
          }`}
          title={isMuted ? 'Unmute retro sound effects' : 'Mute retro sound effects'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="text-[10px] font-pixel">MUTED</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-pixel">AUDIO ON</span>
            </>
          )}
        </button>

        <span className="text-zinc-700">|</span>

        {/* CRT Scanlines Toggle */}
        <button
          onClick={() => {
            soundEngine.playKeyClick();
            onToggleCrt();
          }}
          className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${
            crtEnabled ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle CRT monitor scanline simulation"
        >
          <Tv className="w-3.5 h-3.5" />
          <span className="text-[10px] font-pixel">CRT: {crtEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <span className="text-zinc-700">|</span>

        {/* Redaction Toggle */}
        <button
          onClick={() => {
            soundEngine.playKeyClick();
            setRevealRedactions((prev) => !prev);
          }}
          className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${
            revealRedactions ? 'text-red-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle redacted classified documents"
        >
          {revealRedactions ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[10px] font-pixel">REDACTIONS: REVEALED</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span className="text-[10px] font-pixel">REDACTED</span>
            </>
          )}
        </button>

        <span className="text-zinc-700">|</span>

        {/* Digital Clock */}
        <div className="text-[11px] font-mono text-zinc-400 px-1.5 flex items-center">
          <Cpu className="w-3 h-3 mr-1 text-zinc-600" />
          <span>{timeStr}</span>
        </div>
      </div>
    </div>
  );
};
