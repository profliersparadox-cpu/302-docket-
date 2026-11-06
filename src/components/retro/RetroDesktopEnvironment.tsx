import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  Terminal as TerminalIcon,
  Pin,
  Clock,
  Mic,
  FileText,
  Compass,
  Award,
  Shield,
  KeyRound,
  Power,
  Tv,
  Volume2,
  VolumeX,
  Minus,
  Square,
  Copy,
  X,
  Bell,
  Sparkles,
  ExternalLink,
  RotateCcw,
  BookOpen,
  FolderLock,
  Search,
  Bookmark,
  Calendar,
  MapPin,
  CheckCircle2,
  Filter,
  Scale,
  Gavel,
} from 'lucide-react';
import { CaseFile } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { useArchive } from '../../context/ArchiveContext.tsx';
import { InteractiveTerminalWindow } from './InteractiveTerminalWindow.tsx';
import { InteractiveEvidenceBoard } from './InteractiveEvidenceBoard.tsx';
import { InteractiveTimelineRecon } from './InteractiveTimelineRecon.tsx';
import { InterviewRecordVault } from './InterviewRecordVault.tsx';
import { DocumentRoomViewer } from './DocumentRoomViewer.tsx';
import { GeographicalReconView } from './GeographicalReconView.tsx';
import { InvestigativeExercises } from './InvestigativeExercises.tsx';
import { CollectiblesAndSecrets } from './CollectiblesAndSecrets.tsx';
import { CaseWallView } from './CaseWallView.tsx';
import { CaseDetail } from '../CaseDetail.tsx';
import { CaseCourtroomGame } from '../case/CaseCourtroomGame.tsx';
import { CourtroomSim } from '../CourtroomSim.tsx';

export interface WindowState {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RetroDesktopEnvironmentProps {
  cases: CaseFile[];
  isLoadingCases: boolean;
  onOpenCaseDossier: (slug: string) => void;
  onOpenLogin: () => void;
  onShutdown: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
  selectedLocation?: string;
  onSelectLocation?: (loc: string) => void;
  onResetFilters?: () => void;
  onOpenTerminal?: () => void;
  onOpenMethodology?: () => void;
}

export const RetroDesktopEnvironment: React.FC<RetroDesktopEnvironmentProps> = ({
  cases,
  isLoadingCases,
  onOpenCaseDossier,
  onOpenLogin,
  onShutdown,
  crtEnabled,
  onToggleCrt,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  selectedLocation,
  onSelectLocation,
  onResetFilters,
  onOpenTerminal,
  onOpenMethodology,
}) => {
  const { isBookmarked, toggleBookmark, getCaseProgress } = useArchive();
  // Sound mute state
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted);

  // Screen flicker toggle
  const [flickerEnabled, setFlickerEnabled] = useState<boolean>(() => {
    return localStorage.getItem('docket_screen_flicker') === 'true';
  });

  // Digital clock
  const [clockStr, setClockStr] = useState('');

  // Green typewriter text for wallpaper motto
  const [typewriterText, setTypewriterText] = useState('');
  const fullTagline = 'EVERY CASE LEAVES A PAPER TRAIL.';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullTagline.length) {
        setTypewriterText(fullTagline.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Start menu state
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  // System toast notification
  const [systemToast, setSystemToast] = useState<string | null>(
    '[SYSTEM 302] Workstation ready. 8 verified criminal investigations indexed.'
  );

  // Selected desktop icon
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  // Hidden folder opened state
  const [secretModalOpen, setSecretModalOpen] = useState(false);

  // Focus case inside dedicated window
  const [activeCaseSlug, setActiveCaseSlug] = useState<string | null>(null);

  // Top zIndex counter
  const [topZ, setTopZ] = useState(100);

  // Active Windows state
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: 'case_wall',
      title: 'CASE_WALL.EXE - Docket Archive Repository',
      icon: <Folder className="w-4 h-4 text-amber-400" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      x: 35,
      y: 25,
      width: 920,
      height: 580,
    },
    {
      id: 'terminal',
      title: 'CMD302.EXE - Bureau Command Terminal',
      icon: <TerminalIcon className="w-4 h-4 text-emerald-400" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 11,
      x: 120,
      y: 60,
      width: 780,
      height: 480,
    },
    {
      id: 'evidence_board',
      title: 'EVIDENCE_PINBOARD.EXE - Forensic Link Analysis',
      icon: <Pin className="w-4 h-4 text-red-400" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 12,
      x: 80,
      y: 40,
      width: 880,
      height: 560,
    },
    {
      id: 'timeline',
      title: 'CHRONO_RECON.EXE - Investigation Reconstruction',
      icon: <Clock className="w-4 h-4 text-blue-400" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 13,
      x: 100,
      y: 50,
      width: 860,
      height: 540,
    },
    {
      id: 'interviews',
      title: 'FD302_TRANSCRIPTS.EXE - Audio Reel & Interview Vault',
      icon: <Mic className="w-4 h-4 text-amber-400" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 14,
      x: 90,
      y: 45,
      width: 880,
      height: 550,
    },
    {
      id: 'document_room',
      title: 'DOCUMENT_ROOM.EXE - Classified Case Records',
      icon: <FileText className="w-4 h-4 text-indigo-400" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 15,
      x: 110,
      y: 35,
      width: 900,
      height: 570,
    },
    {
      id: 'geo_recon',
      title: 'GEO_RECON.EXE - Verified Incident Radar',
      icon: <Compass className="w-4 h-4 text-emerald-400" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 16,
      x: 70,
      y: 40,
      width: 860,
      height: 530,
    },
    {
      id: 'exercises',
      title: 'INVESTIGATIVE_LAB.EXE - Academic Triage Simulations',
      icon: <Award className="w-4 h-4 text-teal-400" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 17,
      x: 130,
      y: 55,
      width: 840,
      height: 530,
    },
    {
      id: 'collectibles',
      title: 'ARCHIVE_STAMPS.EXE - Clearance & Secret Badges',
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 18,
      x: 140,
      y: 65,
      width: 840,
      height: 520,
    },
    {
      id: 'case_viewer',
      title: 'CASE_DOSSIER.EXE - Full 9-Chapter Investigation',
      icon: <BookOpen className="w-4 h-4 text-red-500" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: true,
      zIndex: 19,
      x: 20,
      y: 10,
      width: 1000,
      height: 640,
    },
    {
      id: 'trial_sim',
      title: 'TRIAL_SIM.EXE - Federal Courtroom Prosecution Simulator',
      icon: <Scale className="w-4 h-4 text-red-400" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 20,
      x: 50,
      y: 20,
      width: 960,
      height: 620,
    },
  ]);

  const [trialSimCaseSlug, setTrialSimCaseSlug] = useState<string | null>(null);

  // Default app icon positions (neat 3-column 90s OS layout)
  const defaultIconPositions: Record<string, { x: number; y: number }> = {
    case_wall: { x: 24, y: 24 },
    trial_sim: { x: 24, y: 124 },
    terminal: { x: 24, y: 224 },
    evidence_board: { x: 24, y: 324 },
    timeline: { x: 24, y: 424 },
    interviews: { x: 136, y: 24 },
    document_room: { x: 136, y: 124 },
    geo_recon: { x: 136, y: 224 },
    exercises: { x: 136, y: 324 },
    collectibles: { x: 136, y: 424 },
    secret_folder: { x: 248, y: 24 },
    investigator_access: { x: 248, y: 124 },
    shutdown: { x: 248, y: 224 },
  };

  // Draggable desktop icon positions state (persisted)
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem('docket_desktop_icon_positions');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return defaultIconPositions;
  });

  const [draggingIconId, setDraggingIconId] = useState<string | null>(null);
  const [hasMovedIcon, setHasMovedIcon] = useState<boolean>(false);
  const iconDragStartRef = useRef<{ x: number; y: number; mouseX: number; mouseY: number } | null>(null);

  const handleIconMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIconId(id);
    const currentPos = iconPositions[id] || defaultIconPositions[id] || { x: 24, y: 24 };
    iconDragStartRef.current = {
      x: currentPos.x,
      y: currentPos.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    setDraggingIconId(id);
    setHasMovedIcon(false);
  };

  const handleResetIconPositions = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playKeyClick();
    setIconPositions(defaultIconPositions);
    try {
      localStorage.removeItem('docket_desktop_icon_positions');
    } catch (_) {}
  };

  // Window drag state
  const [draggingWindowId, setDraggingWindowId] = useState<string | null>(null);
  const [windowDragOffset, setWindowDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update digital clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dismiss toast after 7s
  useEffect(() => {
    if (systemToast) {
      const t = setTimeout(() => setSystemToast(null), 7000);
      return () => clearTimeout(t);
    }
  }, [systemToast]);

  const bringToFront = (id: string) => {
    const nextZ = topZ + 1;
    setTopZ(nextZ);
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w))
    );
  };

  const openWindow = (id: string) => {
    soundEngine.playKeyClick();
    const nextZ = topZ + 1;
    setTopZ(nextZ);
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: nextZ } : w))
    );
    setStartMenuOpen(false);
  };

  const closeWindow = (id: string) => {
    soundEngine.playKeyClick();
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isOpen: false } : w)));
  };

  const minimizeWindow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEngine.playKeyClick();
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
  };

  const toggleMaximizeWindow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEngine.playKeyClick();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  const handleOpenCase = (slug: string) => {
    soundEngine.playFileAccess();
    setActiveCaseSlug(slug);
    const target = cases.find((c) => c.slug === slug);
    const title = target ? `CASE DOSSIER // ${target.caseNumber}: ${target.title}` : 'CASE DOSSIER';

    const nextZ = topZ + 1;
    setTopZ(nextZ);
    setWindows((prev) =>
      prev.map((w) =>
        w.id === 'case_viewer'
          ? { ...w, title, isOpen: true, isMinimized: false, zIndex: nextZ }
          : w
      )
    );
  };

  const handleWindowHeaderMouseDown = (e: React.MouseEvent, id: string) => {
    const targetWin = windows.find((w) => w.id === id);
    if (!targetWin || targetWin.isMaximized) return;

    bringToFront(id);
    setDraggingWindowId(id);
    setWindowDragOffset({
      x: e.clientX - targetWin.x,
      y: e.clientY - targetWin.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingWindowId) {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id === draggingWindowId) {
            const newX = Math.max(0, e.clientX - windowDragOffset.x);
            const newY = Math.max(0, e.clientY - windowDragOffset.y);
            return { ...w, x: newX, y: newY };
          }
          return w;
        })
      );
    } else if (draggingIconId && iconDragStartRef.current) {
      const deltaX = e.clientX - iconDragStartRef.current.mouseX;
      const deltaY = e.clientY - iconDragStartRef.current.mouseY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        setHasMovedIcon(true);
        const newX = Math.max(10, Math.min(window.innerWidth - 120, iconDragStartRef.current.x + deltaX));
        const newY = Math.max(10, Math.min(window.innerHeight - 150, iconDragStartRef.current.y + deltaY));
        setIconPositions((prev) => ({
          ...prev,
          [draggingIconId]: { x: newX, y: newY },
        }));
      }
    }
  };

  const handleMouseUp = () => {
    if (draggingWindowId) {
      setDraggingWindowId(null);
    }
    if (draggingIconId) {
      if (hasMovedIcon) {
        try {
          localStorage.setItem('docket_desktop_icon_positions', JSON.stringify(iconPositions));
        } catch (_) {}
      }
      setDraggingIconId(null);
      iconDragStartRef.current = null;
    }
  };

  const handleToggleMute = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  const handleToggleFlicker = () => {
    soundEngine.playKeyClick();
    const next = !flickerEnabled;
    setFlickerEnabled(next);
    localStorage.setItem('docket_screen_flicker', JSON.stringify(next));
  };

  const handleUnlockSecretFolder = () => {
    soundEngine.playBootBeep();
    try {
      const saved = localStorage.getItem('docket_unlocked_stamps');
      const stamps = saved ? JSON.parse(saved) : [];
      if (!stamps.includes('STAMP_SECRET_CACHE')) {
        stamps.push('STAMP_SECRET_CACHE');
        localStorage.setItem('docket_unlocked_stamps', JSON.stringify(stamps));
      }
    } catch (_) {}
    setSecretModalOpen(true);
  };

  // Desktop Icons Configuration
  const desktopIcons = [
    {
      id: 'case_wall',
      label: 'CASE_WALL.EXE',
      icon: <Folder className="w-8 h-8 text-amber-400" />,
      sublabel: 'Case Catalog',
      onClick: () => openWindow('case_wall'),
    },
    {
      id: 'trial_sim',
      label: 'TRIAL_SIM.EXE',
      icon: <Scale className="w-8 h-8 text-red-500 animate-pulse" />,
      sublabel: 'Prosecution Game',
      onClick: () => {
        if (!trialSimCaseSlug && cases.length > 0) {
          setTrialSimCaseSlug(cases[0].slug);
        }
        openWindow('trial_sim');
      },
    },
    {
      id: 'terminal',
      label: 'CMD302.EXE',
      icon: <TerminalIcon className="w-8 h-8 text-emerald-400" />,
      sublabel: 'DOS-302 Terminal',
      onClick: () => openWindow('terminal'),
    },
    {
      id: 'evidence_board',
      label: 'BOARD.EXE',
      icon: <Pin className="w-8 h-8 text-red-500" />,
      sublabel: 'Evidence Pinboard',
      onClick: () => openWindow('evidence_board'),
    },
    {
      id: 'timeline',
      label: 'CHRONO.EXE',
      icon: <Clock className="w-8 h-8 text-blue-400" />,
      sublabel: 'Timeline Recon',
      onClick: () => openWindow('timeline'),
    },
    {
      id: 'interviews',
      label: 'FD302.EXE',
      icon: <Mic className="w-8 h-8 text-amber-400" />,
      sublabel: 'Interview Reels',
      onClick: () => openWindow('interviews'),
    },
    {
      id: 'document_room',
      label: 'DOCS.EXE',
      icon: <FileText className="w-8 h-8 text-indigo-400" />,
      sublabel: 'Classified Records',
      onClick: () => openWindow('document_room'),
    },
    {
      id: 'geo_recon',
      label: 'RADAR.EXE',
      icon: <Compass className="w-8 h-8 text-emerald-400" />,
      sublabel: 'Geographical Recon',
      onClick: () => openWindow('geo_recon'),
    },
    {
      id: 'exercises',
      label: 'TRAINING.EXE',
      icon: <Award className="w-8 h-8 text-teal-400" />,
      sublabel: 'Fictional Lab',
      onClick: () => openWindow('exercises'),
    },
    {
      id: 'collectibles',
      label: 'STAMPS.EXE',
      icon: <Shield className="w-8 h-8 text-amber-400" />,
      sublabel: 'Archive Badges',
      onClick: () => openWindow('collectibles'),
    },
    {
      id: 'secret_folder',
      label: '.BUREAU_CONFIDENTIAL',
      icon: <FolderLock className="w-8 h-8 text-red-400 animate-pulse" />,
      sublabel: 'Top Secret Cache',
      onClick: handleUnlockSecretFolder,
    },
    {
      id: 'investigator_access',
      label: 'CLEARANCE.EXE',
      icon: <KeyRound className="w-8 h-8 text-amber-300" />,
      sublabel: 'Investigator Login',
      onClick: onOpenLogin,
    },
    {
      id: 'shutdown',
      label: 'POWER_OFF.EXE',
      icon: <Power className="w-8 h-8 text-red-500" />,
      sublabel: 'Shutdown System',
      onClick: onShutdown,
    },
  ];

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-[calc(100vh-42px)] overflow-hidden bg-[#07090c] text-zinc-300 font-tech select-none flex flex-col ${
        flickerEnabled ? 'screen-glitch' : ''
      }`}
    >
      {/* Desktop Workspace Wallpaper Area */}
      <div
        onClick={() => {
          setSelectedIconId(null);
          setStartMenuOpen(false);
        }}
        className="relative flex-1 p-6 overflow-hidden bg-[radial-gradient(#151b24_1px,transparent_1px)] [background-size:24px_24px] select-none"
      >
        {/* Central Bureau Watermark with Green Phosphor Typewriter Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0 px-4 text-center">
          <div className="w-16 h-16 mb-4 border border-zinc-700/60 bg-zinc-950/80 rounded flex items-center justify-center opacity-30 shadow-inner">
            <Shield className="w-9 h-9 text-red-500" />
          </div>
          <h1 className="text-4xl sm:text-7xl font-pixel font-bold tracking-widest text-zinc-100/25 mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            THE 302 DOCKET
          </h1>
          <div className="flex items-center space-x-1.5 font-mono text-sm sm:text-2xl font-bold tracking-wider">
            <span className="text-emerald-500/80 font-pixel text-xs sm:text-base mr-1">&gt;</span>
            <span className="text-emerald-400 font-terminal drop-shadow-[0_0_12px_rgba(74,222,128,0.8)] tracking-widest">
              {typewriterText}
            </span>
            <span className="inline-block w-2.5 sm:w-3.5 h-4 sm:h-6 bg-emerald-400 animate-pulse ml-1 shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
          </div>
          <div className="text-[10px] sm:text-xs font-mono text-zinc-500/60 mt-4 tracking-widest uppercase">
            FEDERAL BUREAU INVESTIGATIVE ARCHIVE // OS v4.19
          </div>
        </div>

        {/* Desktop Quick Control: Auto-Align Apps Button */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          <button
            onClick={handleResetIconPositions}
            className="px-2.5 py-1 text-[10px] font-mono bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-zinc-200 rounded flex items-center space-x-1.5 shadow-sm transition-colors"
            title="Auto-align application icons to default grid"
          >
            <RotateCcw className="w-3 h-3 text-zinc-400" />
            <span className="hidden sm:inline">ALIGN APPS</span>
          </button>
        </div>

        {/* Freely Draggable Desktop Application Shortcuts */}
        <div className="relative z-10 w-full h-full pointer-events-none">
          {desktopIcons.map((icon) => {
            const isSelected = selectedIconId === icon.id;
            const pos = iconPositions[icon.id] || defaultIconPositions[icon.id] || { x: 24, y: 24 };
            const isDragging = draggingIconId === icon.id;

            return (
              <div
                key={icon.id}
                onMouseDown={(e) => handleIconMouseDown(e, icon.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasMovedIcon) {
                    soundEngine.playKeyClick();
                    setSelectedIconId(icon.id);
                    icon.onClick();
                  }
                }}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: '102px',
                  zIndex: isDragging ? 50 : 10,
                  userSelect: 'none',
                }}
                className={`pointer-events-auto group flex flex-col items-center justify-center p-2 rounded text-center transition-shadow cursor-grab active:cursor-grabbing ${
                  isSelected
                    ? 'bg-amber-950/40 border border-amber-600/70 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                    : 'hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800'
                } ${isDragging ? 'opacity-90 scale-105 shadow-2xl' : ''}`}
                title="Click to launch, drag to reposition anywhere on desktop"
              >
                <div className="p-1 rounded transition-transform group-hover:scale-110 pointer-events-none">
                  {icon.icon}
                </div>
                <span className="text-[11px] font-mono font-bold text-zinc-200 group-hover:text-amber-300 mt-0.5 line-clamp-1 pointer-events-none">
                  {icon.label}
                </span>
                <span className="text-[9px] text-zinc-500 font-mono truncate w-full pointer-events-none">
                  {icon.sublabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Floating Draggable Windows (Preserved in DOM when minimized so background radar & timers keep running) */}
        {windows.map((win) => {
          if (!win.isOpen) return null;

          return (
            <div
              key={win.id}
              onClick={() => bringToFront(win.id)}
              style={{
                position: win.isMaximized ? 'fixed' : 'absolute',
                left: win.isMaximized ? 0 : `${win.x}px`,
                top: win.isMaximized ? 0 : `${win.y}px`,
                width: win.isMaximized ? '100vw' : `${win.width}px`,
                height: win.isMaximized ? 'calc(100vh - 40px)' : `${win.height}px`,
                zIndex: win.zIndex,
                display: win.isMinimized ? 'none' : 'flex',
              }}
              className="flex flex-col bg-[#101318] border-2 border-[#2f3744] shadow-2xl rounded overflow-hidden"
            >
              {/* Retro Window Title Bar */}
              <div
                onMouseDown={(e) => handleWindowHeaderMouseDown(e, win.id)}
                className={`flex items-center justify-between px-3 py-1.5 border-b border-[#2f3744] select-none cursor-grab active:cursor-grabbing ${
                  win.zIndex === topZ
                    ? 'bg-gradient-to-r from-[#202733] via-[#1a202c] to-[#121620] text-zinc-100'
                    : 'bg-[#151921] text-zinc-400'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  {win.icon}
                  <span className="text-xs font-mono font-bold truncate">
                    {win.title}
                  </span>
                </div>

                {/* Window Control Buttons: Minimise, Maximise, Close */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => minimizeWindow(win.id, e)}
                    className="p-1 text-zinc-400 hover:text-zinc-100 bg-[#1e2430] hover:bg-zinc-700 border border-zinc-700 rounded text-xs"
                    title="Minimise"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => toggleMaximizeWindow(win.id, e)}
                    className="p-1 text-zinc-400 hover:text-zinc-100 bg-[#1e2430] hover:bg-zinc-700 border border-zinc-700 rounded text-xs"
                    title="Maximise / Restore"
                  >
                    {win.isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => closeWindow(win.id)}
                    className="p-1 text-red-300 hover:text-white bg-red-950 hover:bg-red-800 border border-red-700 rounded text-xs"
                    title="Close"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Window Body Component */}
              <div className="flex-1 overflow-hidden relative">
                {win.id === 'case_wall' && (
                  <CaseWallView
                    cases={cases}
                    isLoading={isLoadingCases}
                    onSelectCase={handleOpenCase}
                  />
                )}
                {win.id === 'terminal' && (
                  <InteractiveTerminalWindow
                    cases={cases}
                    onSelectCase={handleOpenCase}
                    onOpenApp={openWindow}
                    onShutdown={onShutdown}
                  />
                )}
                {win.id === 'evidence_board' && (
                  <InteractiveEvidenceBoard onOpenCase={handleOpenCase} />
                )}
                {win.id === 'timeline' && (
                  <InteractiveTimelineRecon cases={cases} onSelectCase={handleOpenCase} />
                )}
                {win.id === 'interviews' && (
                  <InterviewRecordVault onOpenCase={handleOpenCase} />
                )}
                {win.id === 'document_room' && (
                  <DocumentRoomViewer onOpenCase={handleOpenCase} />
                )}
                {win.id === 'geo_recon' && (
                  <GeographicalReconView onOpenCase={handleOpenCase} />
                )}
                {win.id === 'exercises' && (
                  <InvestigativeExercises />
                )}
                {win.id === 'collectibles' && (
                  <CollectiblesAndSecrets />
                )}
                {win.id === 'case_viewer' && activeCaseSlug && (
                  <div className="h-full overflow-y-auto bg-zinc-950">
                    <CaseDetail
                      caseSlug={activeCaseSlug}
                      onBack={() => closeWindow('case_viewer')}
                      onSelectRelatedCase={handleOpenCase}
                    />
                  </div>
                )}
                {win.id === 'trial_sim' && (
                  <div className="h-full overflow-y-auto bg-[#06080b] p-3 sm:p-5 space-y-4">
                    {/* Case Switcher Banner inside Trial Simulator */}
                    <div className="p-3 bg-[#0a0d13] border border-red-900/60 rounded flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="font-pixel text-[10px] text-red-400 uppercase font-bold">
                          PROSECUTE INVESTIGATION:
                        </span>
                        <select
                          value={trialSimCaseSlug || cases[0]?.slug || ''}
                          onChange={(e) => {
                            soundEngine.playKeyClick();
                            setTrialSimCaseSlug(e.target.value);
                          }}
                          className="bg-black border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-xs font-mono focus:border-red-500 focus:outline-none"
                        >
                          {cases.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.caseNumber} - {c.title} ({c.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-[10px] font-pixel text-zinc-400">
                        SELECT ANY CASE FROM ARCHIVE TO PROSECUTE
                      </div>
                    </div>

                    {(() => {
                      const activeSimCase =
                        cases.find((c) => c.slug === trialSimCaseSlug) || cases[0];
                      if (!activeSimCase) {
                        return (
                          <div className="p-8 text-center text-zinc-500 font-mono text-xs">
                            NO ACTIVE INVESTIGATIONS FOUND.
                          </div>
                        );
                      }
                      return (
                        <CourtroomSim
                          caseData={activeSimCase}
                          cases={cases}
                          onSelectCase={(slug) => setTrialSimCaseSlug(slug)}
                          onClose={() => closeWindow('trial_sim')}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Mini Geo-Radar HUD (Visible when Geographical Recon map is minimized) */}
        {(() => {
          const geoWin = windows.find((w) => w.id === 'geo_recon');
          if (!geoWin?.isOpen || !geoWin?.isMinimized) return null;

          return (
            <div className="absolute bottom-4 right-4 z-40 bg-[#080d12]/95 border-2 border-emerald-500/80 rounded-lg shadow-[0_0_25px_rgba(16,185,129,0.35)] p-3 w-80 font-mono text-xs backdrop-blur animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
                    LIVE GEO-RECON RADAR
                  </span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                  BACKGROUND SWEEP
                </span>
              </div>

              {/* Mini radar circle display */}
              <div className="flex items-center space-x-3 mb-2.5">
                <div className="relative w-14 h-14 rounded-full border border-emerald-600 bg-emerald-950/50 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  <div className="absolute inset-0 rounded-full border border-emerald-500/30" />
                  <div className="w-8 h-8 rounded-full border border-dashed border-emerald-500/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {/* Sweep ray */}
                  <div className="absolute inset-0 origin-center animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(16,185,129,0.6)_360deg)] pointer-events-none" />
                </div>
                <div className="text-[10px] space-y-0.5 text-zinc-300">
                  <div className="text-emerald-400 font-bold flex items-center space-x-1">
                    <Compass className="w-3 h-3 text-emerald-400 animate-spin" />
                    <span>RADAR SWEEP ACTIVE</span>
                  </div>
                  <div className="text-zinc-400">7 Case Jurisdictions Triangulated</div>
                  <div className="text-zinc-500 text-[9px]">PULSE: LIVE | SCAN: 100% SOURCED</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800">
                <span className="text-[10px] text-zinc-500">WINDOW MINIMIZED</span>
                <button
                  onClick={() => openWindow('geo_recon')}
                  className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-[10px] font-bold rounded flex items-center space-x-1 transition-colors"
                >
                  <Compass className="w-3 h-3 text-emerald-400" />
                  <span>RESTORE MAP VIEW &rarr;</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* System Toast Alert */}
        {systemToast && (
          <div className="absolute top-4 right-4 z-[9000] p-3 bg-zinc-950 border-2 border-emerald-500 rounded shadow-2xl flex items-center space-x-3 text-xs font-mono text-zinc-200 animate-in fade-in slide-in-from-top-2">
            <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{systemToast}</span>
            <button
              onClick={() => setSystemToast(null)}
              className="text-zinc-500 hover:text-zinc-200 text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Secret Folder Modal */}
        {secretModalOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#10141a] border-2 border-red-600 rounded-lg p-6 shadow-2xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-red-900 pb-2">
                <div className="flex items-center space-x-2 text-red-400 font-bold">
                  <FolderLock className="w-5 h-5 text-red-500" />
                  <span>TOP SECRET // CONFIDENTIAL BUREAU MEMO</span>
                </div>
                <button
                  onClick={() => setSecretModalOpen(false)}
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-zinc-300 leading-relaxed font-typewriter">
                <p>
                  &quot;You have bypassed standard desktop security filters and uncovered an archival easter egg.&quot;
                </p>
                <p className="text-amber-300">
                  Form FD-302 was originally formulated to preserve witness demeanor, room acoustics, and exact word choices before memories degraded.
                </p>
              </div>

              <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ARCHIVE BADGE UNLOCKED: &quot;Bureau Archives Red Tape Pierced&quot;</span>
              </div>

              <div className="pt-2 border-t border-zinc-900 flex justify-end">
                <button
                  onClick={() => {
                    setSecretModalOpen(false);
                    openWindow('collectibles');
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 rounded text-xs font-mono"
                >
                  VIEW STAMP COLLECTION &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Retro Windows Taskbar (Bottom of Desktop) */}
      <div className="h-10 bg-[#12161f] border-t-2 border-[#2b3342] px-2 flex items-center justify-between z-[9000] select-none text-xs font-mono">
        {/* Left: Start Button & Active Running Tasks */}
        <div className="flex items-center space-x-1.5 overflow-x-auto flex-1 mr-2">
          {/* Start Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundEngine.playKeyClick();
                setStartMenuOpen((prev) => !prev);
              }}
              className={`px-3 py-1.5 font-pixel text-xs tracking-wider flex items-center space-x-1.5 border rounded transition-colors ${
                startMenuOpen
                  ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                  : 'bg-[#1e2430] hover:bg-[#283142] text-zinc-200 border-[#3d475a]'
              }`}
            >
              <div className="w-2.5 h-2.5 bg-red-600 rounded-sm" />
              <span>START</span>
            </button>

            {/* Popup Start Menu */}
            {startMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-11 left-0 w-64 bg-[#141821] border-2 border-[#3d475a] rounded shadow-2xl p-1.5 z-[9999] space-y-1 font-mono text-xs"
              >
                <div className="p-2 bg-gradient-to-r from-red-950 to-zinc-900 border-b border-zinc-800 text-zinc-200 font-pixel text-[10px] tracking-wider mb-1">
                  THE 302 DOCKET // SYSTEM MENU
                </div>

                <button
                  onClick={() => openWindow('case_wall')}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-800 rounded flex items-center space-x-2 text-zinc-200"
                >
                  <Folder className="w-4 h-4 text-amber-400" />
                  <span>Case Wall Repository</span>
                </button>

                <button
                  onClick={() => openWindow('trial_sim')}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-red-950/60 rounded flex items-center space-x-2 text-red-400 font-bold border border-red-900/40"
                >
                  <Scale className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>Courtroom Trial Simulator</span>
                </button>

                <button
                  onClick={() => openWindow('terminal')}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-800 rounded flex items-center space-x-2 text-zinc-200"
                >
                  <TerminalIcon className="w-4 h-4 text-emerald-400" />
                  <span>DOS-302 Terminal</span>
                </button>

                <button
                  onClick={() => openWindow('evidence_board')}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-800 rounded flex items-center space-x-2 text-zinc-200"
                >
                  <Pin className="w-4 h-4 text-red-400" />
                  <span>Evidence Pinboard</span>
                </button>

                <button
                  onClick={() => openWindow('timeline')}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-800 rounded flex items-center space-x-2 text-zinc-200"
                >
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Timeline Reconstruction</span>
                </button>

                <button
                  onClick={() => openWindow('interviews')}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-800 rounded flex items-center space-x-2 text-zinc-200"
                >
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span>FD-302 Interview Vault</span>
                </button>

                <button
                  onClick={() => openWindow('document_room')}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-800 rounded flex items-center space-x-2 text-zinc-200"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Document Room</span>
                </button>

                <button
                  onClick={() => openWindow('geo_recon')}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-800 rounded flex items-center space-x-2 text-zinc-200"
                >
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Geographical Recon</span>
                </button>

                <button
                  onClick={() => openWindow('exercises')}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-800 rounded flex items-center space-x-2 text-zinc-200"
                >
                  <Award className="w-4 h-4 text-teal-400" />
                  <span>Investigative Principles Lab</span>
                </button>

                <button
                  onClick={() => openWindow('collectibles')}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-800 rounded flex items-center space-x-2 text-zinc-200"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Archive Badges & Secrets</span>
                </button>

                <div className="pt-1 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      setStartMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-800 rounded flex items-center space-x-2 text-amber-300"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Investigator Access</span>
                  </button>

                  <button
                    onClick={() => {
                      setStartMenuOpen(false);
                      onShutdown();
                    }}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-red-950 rounded flex items-center space-x-2 text-red-400"
                  >
                    <Power className="w-4 h-4 text-red-500" />
                    <span>Shutdown Workstation...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Running Taskbar Window Buttons */}
          {windows
            .filter((w) => w.isOpen)
            .map((w) => {
              const isActive = w.zIndex === topZ && !w.isMinimized;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    if (w.isMinimized) {
                      bringToFront(w.id);
                    } else if (w.zIndex === topZ) {
                      minimizeWindow(w.id);
                    } else {
                      bringToFront(w.id);
                    }
                  }}
                  className={`px-2.5 py-1 text-[11px] font-mono flex items-center space-x-1.5 border rounded transition-colors truncate max-w-[160px] ${
                    isActive
                      ? 'bg-zinc-800 border-amber-500/80 text-amber-300 font-bold'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {w.icon}
                  <span className="truncate">{w.title.split(' - ')[0]}</span>
                </button>
              );
            })}
        </div>

        {/* Right System Tray (Audio, CRT, Clock) */}
        <div className="flex items-center space-x-2 shrink-0 bg-[#0c0f14] px-2 py-1 border border-zinc-800 rounded">
          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            className="p-1 text-zinc-400 hover:text-zinc-100"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* CRT scanlines toggle */}
          <button
            onClick={onToggleCrt}
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
              crtEnabled ? 'bg-emerald-950 border-emerald-700 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title="Toggle CRT Scanlines simulation"
          >
            CRT: {crtEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Screen flicker toggle */}
          <button
            onClick={handleToggleFlicker}
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded border hidden sm:inline ${
              flickerEnabled ? 'bg-amber-950 border-amber-700 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title="Toggle retro screen flicker"
          >
            FLICKER: {flickerEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Digital Clock */}
          <div className="text-zinc-300 font-mono text-[11px] pl-1 font-bold">
            {clockStr}
          </div>
        </div>
      </div>
    </div>
  );
};
