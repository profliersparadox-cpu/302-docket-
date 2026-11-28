import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Fingerprint,
  Lock,
  Unlock,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Eye,
  Scale,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Pin,
  FileSearch,
  ShieldAlert,
  Image as ImageIcon,
} from 'lucide-react';
import { CaseFile, MediaItem } from '../../types.ts';
import { buildEvidenceChronoTimeline, ScrubberChronoNode } from '../../utils/evidenceTimeline.ts';
import { fetchAllMedia, MEDIA_UPDATED_EVENT } from '../../utils/mediaVault.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface EvidenceTimelineScrubberProps {
  caseData: CaseFile;
  onInspectEvidence?: (evidenceId: string) => void;
  onOpenEvidenceBoard?: () => void;
}

export const EvidenceTimelineScrubber: React.FC<EvidenceTimelineScrubberProps> = ({
  caseData,
  onInspectEvidence,
  onOpenEvidenceBoard,
}) => {
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'evidence'>('all');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [autoRevealOnScrub, setAutoRevealOnScrub] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [failedImgs, setFailedImgs] = useState<Record<string, boolean>>({});

  const storageKey = `docket_timeline_revealed_${caseData.slug}`;
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const list = await fetchAllMedia(caseData.slug);
        if (active) setUploadedMedia(list);
      } catch {
        // fallback gracefully
      }
    };
    load();
    window.addEventListener(MEDIA_UPDATED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(MEDIA_UPDATED_EVENT, load);
    };
  }, [caseData.slug]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setRevealedIds(saved ? new Set<string>(JSON.parse(saved)) : new Set<string>());
    } catch {
      setRevealedIds(new Set<string>());
    }
    setActiveIndex(0);
    setIsPlaying(false);
  }, [caseData.slug, storageKey]);

  const allNodes = useMemo(
    () => buildEvidenceChronoTimeline(caseData, uploadedMedia),
    [caseData, uploadedMedia]
  );

  const visibleNodes = useMemo(() => {
    if (filterMode === 'evidence') {
      return allNodes.filter(
        (n) => n.kind === 'evidence' || n.kind === 'reanalysis' || n.kind === 'uploaded'
      );
    }
    return allNodes;
  }, [allNodes, filterMode]);

  useEffect(() => {
    if (activeIndex >= visibleNodes.length && visibleNodes.length > 0) {
      setActiveIndex(0);
    }
  }, [visibleNodes.length, activeIndex]);

  const activeNode: ScrubberChronoNode | undefined = visibleNodes[activeIndex];

  const markRevealed = (nodeId: string, withSound = true) => {
    setRevealedIds((prev) => {
      if (prev.has(nodeId)) return prev;
      const next = new Set(prev);
      next.add(nodeId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {
        // ignore storage quota errors
      }
      if (withSound) {
        soundEngine.playUnsealChord();
      }
      return next;
    });
  };

  // Auto-reveal when scrub settles if user enables Auto-Reveal mode
  useEffect(() => {
    if (!autoRevealOnScrub || !activeNode || revealedIds.has(activeNode.id)) {
      return;
    }
    setIsDecrypting(true);
    const timer = window.setTimeout(() => {
      setIsDecrypting(false);
      markRevealed(activeNode.id, true);
    }, 320);

    return () => {
      window.clearTimeout(timer);
      setIsDecrypting(false);
    };
  }, [activeNode?.id, autoRevealOnScrub]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || visibleNodes.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= visibleNodes.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        soundEngine.playKeyClick();
        return prev + 1;
      });
    }, 2400);
    return () => window.clearInterval(timer);
  }, [isPlaying, visibleNodes.length]);

  const handleScrubTo = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(visibleNodes.length - 1, nextIdx));
    if (clamped !== activeIndex) {
      soundEngine.playKeyClick();
      setActiveIndex(clamped);
    }
  };

  const handleRevealCurrent = () => {
    if (!activeNode) return;
    setIsDecrypting(true);
    soundEngine.playFileAccess();
    window.setTimeout(() => {
      setIsDecrypting(false);
      markRevealed(activeNode.id, true);
    }, 240);
  };

  const handleRevealAll = () => {
    soundEngine.playUnsealChord();
    setRevealedIds((prev) => {
      const next = new Set(prev);
      visibleNodes.forEach((n) => next.add(n.id));
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Compute balanced horizontal rail positions (blend chronological scale with uniform index spacing to prevent marker collision)
  const railPositions = useMemo(() => {
    if (visibleNodes.length <= 1) return [50];
    const minTs = visibleNodes[0].sortTimestamp;
    const maxTs = visibleNodes[visibleNodes.length - 1].sortTimestamp;
    const span = Math.max(1, maxTs - minTs);

    return visibleNodes.map((node, idx) => {
      const timeRatio = (node.sortTimestamp - minTs) / span;
      const indexRatio = idx / (visibleNodes.length - 1);
      // 45% chronological proportion + 55% index spacing guarantees accurate order and non-overlapping touch targets
      const blended = timeRatio * 0.45 + indexRatio * 0.55;
      return 3 + blended * 94;
    });
  }, [visibleNodes]);

  if (visibleNodes.length === 0) {
    return null;
  }

  const evidenceNodeCount = allNodes.filter(
    (n) => n.kind === 'evidence' || n.kind === 'reanalysis' || n.kind === 'uploaded'
  ).length;
  const unsealedCount = visibleNodes.filter((n) => revealedIds.has(n.id)).length;
  const isCurrentRevealed = activeNode ? revealedIds.has(activeNode.id) : false;

  const minYear = visibleNodes[0]?.yearLabel || String(caseData.year);
  const maxYear = visibleNodes[visibleNodes.length - 1]?.yearLabel || String(caseData.year);

  const isEvidenceKind =
    activeNode?.kind === 'evidence' ||
    activeNode?.kind === 'reanalysis' ||
    activeNode?.kind === 'uploaded';

  return (
    <section
      aria-label="Chronological Evidence Timeline Scrubber"
      className="retro-window bg-[#090c11] border border-zinc-800 shadow-xl overflow-hidden"
    >
      {/* Top Control Header */}
      <div className="px-4 py-3 bg-[#0e131b] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-zinc-900 border border-zinc-700 text-amber-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold font-editorial text-zinc-100 truncate">
              Evidence Chronology Scrubber
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs font-tech text-zinc-400 tabular-nums">
              <span>{minYear === maxYear ? minYear : `${minYear} – ${maxYear}`}</span>
              <span aria-hidden="true">&middot;</span>
              <span>{evidenceNodeCount} Evidence Dates</span>
              <span aria-hidden="true">&middot;</span>
              <span className="text-emerald-400">
                {unsealedCount} of {visibleNodes.length} Details Unsealed
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-tech">
          {/* Mode Filter Buttons */}
          <div className="flex items-center bg-black/70 border border-zinc-800 p-0.5 rounded">
            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyClick();
                setFilterMode('all');
                setActiveIndex(0);
              }}
              className={`px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 transition-colors ${
                filterMode === 'all'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Events ({allNodes.length})
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyClick();
                setFilterMode('evidence');
                setActiveIndex(0);
              }}
              className={`px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 transition-colors ${
                filterMode === 'evidence'
                  ? 'bg-emerald-950 text-emerald-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Evidence Dates ({evidenceNodeCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setAutoRevealOnScrub((prev) => !prev);
            }}
            className={`px-2.5 py-1.5 rounded border text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
              autoRevealOnScrub
                ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Automatically declassify hidden case details when scrubbing pauses on a node"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{autoRevealOnScrub ? 'Auto-Reveal On' : 'Manual Unseal'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setIsCollapsed((prev) => !prev);
            }}
            className="px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white text-xs whitespace-nowrap shrink-0 flex items-center gap-1"
            aria-expanded={!isCollapsed}
          >
            <span>{isCollapsed ? 'Expand Scrubber' : 'Minimize'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Interactive Timeline Rail & Node Markers */}
          <div className="bg-[#06080b] border border-zinc-800/90 rounded p-4 space-y-4">
            {/* Rail Header Readout */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-amber-400 font-bold">
                  Node {activeIndex + 1} / {visibleNodes.length}
                </span>
                <span aria-hidden="true" className="text-zinc-600">&middot;</span>
                <span className="text-zinc-100">{activeNode?.displayDate}</span>
                <span aria-hidden="true" className="text-zinc-600">&middot;</span>
                <span className={isEvidenceKind ? 'text-emerald-400' : 'text-zinc-400'}>
                  {activeNode?.phaseLabel}
                </span>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-tech text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Fingerprint className="w-3 h-3 text-emerald-400" />
                  Evidence Date
                </span>
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3 h-3 text-amber-400" />
                  Case Milestone
                </span>
                <span className="flex items-center gap-1.5">
                  <Unlock className="w-3 h-3 text-sky-400" />
                  Unsealed
                </span>
              </div>
            </div>

            {/* Visual Track with Proportional/Indexed Plotted Nodes */}
            <div className="relative h-16 select-none pt-3">
              {/* Base Axis Rail */}
              <div className="absolute left-[3%] right-[3%] top-7 h-1 bg-zinc-800 rounded-full" />
              {/* Active Scrub Progress Fill */}
              <div
                className="absolute left-[3%] top-7 h-1 bg-emerald-500/80 rounded-full transition-all duration-150"
                style={{
                  width: `${Math.max(0, (railPositions[activeIndex] ?? 3) - 3)}%`,
                }}
              />

              {/* Plotted Node Pins */}
              {visibleNodes.map((node, idx) => {
                const leftPct = railPositions[idx] ?? 50;
                const isActive = idx === activeIndex;
                const isEvidence =
                  node.kind === 'evidence' ||
                  node.kind === 'reanalysis' ||
                  node.kind === 'uploaded';
                const isRevealed = revealedIds.has(node.id);

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleScrubTo(idx)}
                    style={{ left: `${leftPct}%` }}
                    title={`${node.displayDate} — ${node.title}`}
                    aria-label={`Jump to ${node.displayDate}: ${node.title}`}
                    className={`absolute top-3 -translate-x-1/2 flex flex-col items-center group focus:outline-none z-10`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-transform duration-150 ${
                        isActive
                          ? 'scale-125 bg-amber-500 border-amber-200 text-black shadow-[0_0_12px_rgba(245,158,11,0.7)] z-20'
                          : isEvidence
                          ? isRevealed
                            ? 'bg-emerald-950 border-emerald-400 text-emerald-300 hover:scale-110'
                            : 'bg-zinc-950 border-emerald-600 text-emerald-400 hover:scale-110'
                          : isRevealed
                          ? 'bg-sky-950 border-sky-500 text-sky-300 hover:scale-110'
                          : 'bg-zinc-950 border-zinc-600 text-zinc-400 hover:border-amber-400 hover:scale-110'
                      }`}
                    >
                      {isEvidence ? (
                        <Fingerprint className="w-3.5 h-3.5" />
                      ) : node.kind === 'courtroom' || node.kind === 'verdict' ? (
                        <Scale className="w-3 h-3" />
                      ) : (
                        <Search className="w-3 h-3" />
                      )}
                    </span>

                    <span
                      className={`mt-1 text-[10px] font-mono tabular-nums whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-amber-300 font-bold'
                          : 'text-zinc-500 group-hover:text-zinc-300 hidden md:inline'
                      }`}
                    >
                      {node.yearLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tactile Range Slider & Transport Controls */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-3">
                <label htmlFor={`scrubber-range-${caseData.slug}`} className="sr-only">
                  Scrub timeline events chronologically
                </label>
                <input
                  id={`scrubber-range-${caseData.slug}`}
                  type="range"
                  min={0}
                  max={Math.max(0, visibleNodes.length - 1)}
                  step={1}
                  value={activeIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    handleScrubTo(Number(e.target.value));
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-900 rounded-lg"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      handleScrubTo(activeIndex - 1);
                    }}
                    disabled={activeIndex === 0}
                    className="retro-btn text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40 whitespace-nowrap shrink-0"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyClick();
                      if (!isPlaying && activeIndex >= visibleNodes.length - 1) {
                        setActiveIndex(0);
                      }
                      setIsPlaying((prev) => !prev);
                    }}
                    className={`retro-btn text-xs px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isPlaying ? 'border-amber-500 text-amber-300 bg-amber-950/40' : 'border-emerald-700 text-emerald-300'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pause Scrub' : 'Play Chronology'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      handleScrubTo(activeIndex + 1);
                    }}
                    disabled={activeIndex >= visibleNodes.length - 1}
                    className="retro-btn text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40 whitespace-nowrap shrink-0"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRevealAll}
                    disabled={unsealedCount === visibleNodes.length}
                    className="px-3 py-1.5 text-xs font-tech border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded disabled:opacity-40 whitespace-nowrap shrink-0"
                  >
                    Unseal All ({visibleNodes.length})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Zone Active Node Inspection & Hidden Details Reveal */}
          {activeNode && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left Pane: Logged Chronological Record */}
              <div className="lg:col-span-6 bg-[#0b0f15] border border-zinc-800 rounded p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2 text-xs font-tech">
                    <span className={isEvidenceKind ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {activeNode.phaseLabel}
                    </span>
                    <span className="text-zinc-400 tabular-nums">
                      {activeNode.displayDate} &middot; {activeNode.classification}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold font-editorial text-zinc-100 leading-snug">
                    {activeNode.title}
                  </h4>

                  <p className="text-xs sm:text-sm font-tech text-zinc-300 leading-relaxed">
                    {activeNode.surfaceSummary}
                  </p>

                  {activeNode.imageUrl && (
                    <div className="border border-zinc-800 bg-black/70 rounded overflow-hidden">
                      {!failedImgs[activeNode.id] ? (
                        <img
                          src={activeNode.imageUrl}
                          alt={activeNode.imageCaption || activeNode.title}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImgs((prev) => ({ ...prev, [activeNode.id]: true }))
                          }
                          className="w-full h-44 object-cover"
                        />
                      ) : (
                        <div className="h-36 flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 text-xs font-mono gap-1.5 p-3">
                          <ImageIcon className="w-5 h-5 text-zinc-600" />
                          <span>{activeNode.imageCaption || activeNode.title}</span>
                        </div>
                      )}
                      <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-800 text-[11px] font-tech text-zinc-400 truncate">
                        {activeNode.imageCaption || 'Documented Forensic Exhibit Plate'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-tech">
                  <span className="text-zinc-400 truncate">
                    Custodian: <strong className="text-zinc-200">{activeNode.custodian}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {activeNode.sourceEvidenceId && onInspectEvidence && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playFileAccess();
                          onInspectEvidence(activeNode.sourceEvidenceId!);
                        }}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-xs flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <FileSearch className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Evidence Room</span>
                      </button>
                    )}
                    {onOpenEvidenceBoard && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playKeyClick();
                          onOpenEvidenceBoard();
                        }}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-xs flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <Pin className="w-3.5 h-3.5 text-red-400" />
                        <span>Evidence Board</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Pane: Sealed / Hidden Case Details Chamber */}
              <div
                className={`lg:col-span-6 rounded border p-4 flex flex-col justify-between transition-colors duration-200 ${
                  isCurrentRevealed
                    ? 'bg-[#08100d] border-emerald-800/80'
                    : 'bg-[#080a0f] border-amber-900/60'
                }`}
              >
                {!isCurrentRevealed ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-6 px-4 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-700/70 flex items-center justify-center text-amber-400">
                      <Lock className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5 max-w-md">
                      <div className="text-xs font-pixel text-amber-400 uppercase">
                        Sealed Case Context At {activeNode.displayDate}
                      </div>
                      <p className="text-xs font-tech text-zinc-400 leading-relaxed">
                        Underlying forensic significance, cross-linked subject findings, and appellate or unresolved investigative details remain sealed at this timestamp.
                      </p>
                    </div>

                    {/* Redacted Cipher Bars Preview */}
                    <div className="w-full max-w-md space-y-2 text-left opacity-70 select-none pointer-events-none">
                      <div className="h-3 bg-zinc-800 rounded w-11/12" />
                      <div className="h-3 bg-zinc-800/80 rounded w-4/5" />
                      <div className="h-3 bg-zinc-800/60 rounded w-9/12" />
                    </div>

                    <button
                      type="button"
                      onClick={handleRevealCurrent}
                      disabled={isDecrypting}
                      className="retro-btn border-amber-500 bg-amber-950/50 hover:bg-amber-900/70 text-amber-200 px-4 py-2 text-xs font-tech font-bold flex items-center gap-2 whitespace-nowrap shrink-0"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>
                        {isDecrypting ? 'Decrypting Case Record...' : 'Reveal Hidden Case Details'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2 text-xs font-tech">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5" />
                        Unsealed Investigative Details
                      </span>
                      <span className="text-zinc-400">Record Verified</span>
                    </div>

                    {activeNode.hiddenDetails.sealedSnippet && (
                      <div className="p-3 bg-black/70 border border-red-900/60 rounded space-y-1">
                        <div className="text-[11px] font-pixel text-red-400 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Declassified Filing Note</span>
                        </div>
                        <p className="text-xs font-mono text-red-200 leading-relaxed">
                          {activeNode.hiddenDetails.sealedSnippet}
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-black/60 border border-zinc-800 rounded space-y-1">
                      <div className="text-[11px] font-pixel text-emerald-400">
                        Forensic Significance & Nexus
                      </div>
                      <p className="text-xs font-tech text-zinc-200 leading-relaxed">
                        {activeNode.hiddenDetails.forensicSignificance}
                      </p>
                    </div>

                    {activeNode.hiddenDetails.linkedSubjects.length > 0 && (
                      <div className="p-3 bg-black/60 border border-zinc-800 rounded space-y-1.5">
                        <div className="text-[11px] font-pixel text-amber-400">
                          Linked Persons & Findings
                        </div>
                        {activeNode.hiddenDetails.linkedSubjects.map((sub, i) => (
                          <div key={i} className="text-xs font-tech text-zinc-300 leading-relaxed">
                            <span className="text-zinc-100 font-semibold">{sub.name}</span>{' '}
                            <span className="text-zinc-400">({sub.status})</span> &mdash; {sub.finding}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-3 bg-black/60 border border-zinc-800 rounded space-y-1">
                      <div className="text-[11px] font-pixel text-sky-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Procedural Context & Developments</span>
                      </div>
                      <p className="text-xs font-tech text-zinc-300 leading-relaxed">
                        {activeNode.hiddenDetails.legalAndProceduralNote}
                      </p>
                      {activeNode.hiddenDetails.anomalyOrBreakthrough && (
                        <p className="text-[11px] font-tech text-amber-300/90 pt-1 border-t border-zinc-800/80">
                          {activeNode.hiddenDetails.anomalyOrBreakthrough}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
