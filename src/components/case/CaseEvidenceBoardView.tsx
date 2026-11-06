import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  Link as LinkIcon,
  RotateCcw,
  Save,
  CheckCircle2,
  Trash2,
  Move,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { CaseFile, EvidenceBoardItem, EvidenceConnection } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface CaseEvidenceBoardViewProps {
  caseData: CaseFile;
}

export const CaseEvidenceBoardView: React.FC<CaseEvidenceBoardViewProps> = ({ caseData }) => {
  const storageKey = `board_${caseData.slug}`;

  // Initialize board items
  const [boardItems, setBoardItems] = useState<EvidenceBoardItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && parsed.items.length > 0) {
          return parsed.items;
        }
      }
    } catch (e) {
      console.warn('Error reading stored board', e);
    }

    // Default auto-layout from caseData.evidence & caseData.personsOfInterest
    const items: EvidenceBoardItem[] = [];
    let startX = 60;
    let startY = 40;

    caseData.evidence.forEach((ev, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      items.push({
        id: `ev-${ev.id || idx}`,
        title: ev.title,
        itemType: (ev.type as any) || 'physical',
        status: ev.classification === 'Confidential' ? 'Forensic Theory' : 'Established Fact',
        x: startX + col * 260,
        y: startY + row * 180,
        snippet: ev.description,
        source: ev.significance,
        date: ev.recoveredAt,
        caseSlug: caseData.slug,
        caseNumber: caseData.caseNumber,
        tags: [ev.type, ev.classification],
      });
    });

    caseData.personsOfInterest.slice(0, 3).forEach((poi, idx) => {
      items.push({
        id: `poi-${poi.id || idx}`,
        title: `${poi.name} (${poi.role})`,
        itemType: 'suspect',
        status:
          poi.status === 'Convicted' || poi.status === 'Exonerated'
            ? 'Established Fact'
            : 'Documented Allegation',
        x: startX + idx * 260,
        y: startY + 380,
        snippet: poi.verifiedFindings || poi.background,
        source: poi.allegations || poi.outcome,
        caseSlug: caseData.slug,
        caseNumber: caseData.caseNumber,
        tags: [poi.role, poi.status],
      });
    });

    return items;
  });

  // Initialize connections
  const [connections, setConnections] = useState<EvidenceConnection[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.connections) {
          return parsed.connections;
        }
      }
    } catch (e) {}

    const conns: EvidenceConnection[] = [];
    if (boardItems.length >= 2) {
      conns.push({
        fromId: boardItems[0]?.id,
        toId: boardItems[1]?.id,
        label: 'supports',
        type: 'forensic_link',
      });
    }
    if (boardItems.length >= 3) {
      conns.push({
        fromId: boardItems[1]?.id,
        toId: boardItems[2]?.id,
        label: 'related to',
        type: 'timeline_sequence',
      });
    }
    return conns;
  });

  // Interactive interaction states
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [selectedRelationType, setSelectedRelationType] = useState<'supports' | 'contradicts' | 'related to'>('supports');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState<EvidenceBoardItem | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent, item: EvidenceBoardItem) => {
    if (connectingFromId) {
      // Complete connection
      if (connectingFromId !== item.id) {
        soundEngine.playKeyClick();
        const newConn: EvidenceConnection = {
          fromId: connectingFromId,
          toId: item.id,
          label: selectedRelationType,
          type:
            selectedRelationType === 'supports'
              ? 'forensic_link'
              : selectedRelationType === 'contradicts'
              ? 'contradiction'
              : 'timeline_sequence',
        };
        // Remove existing duplicate if any, then append
        setConnections((prev) => [
          ...prev.filter(
            (c) =>
              !(
                (c.fromId === connectingFromId && c.toId === item.id) ||
                (c.fromId === item.id && c.toId === connectingFromId)
              )
          ),
          newConn,
        ]);
      }
      setConnectingFromId(null);
      return;
    }

    // Start Dragging
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    setDraggingId(item.id);
    setDragOffset({
      x: e.clientX - boardRect.left - item.x,
      y: e.clientY - boardRect.top - item.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(boardRect.width - 240, e.clientX - boardRect.left - dragOffset.x));
    const newY = Math.max(10, Math.min(boardRect.height - 180, e.clientY - boardRect.top - dragOffset.y));

    setBoardItems((prev) =>
      prev.map((item) => (item.id === draggingId ? { ...item, x: newX, y: newY } : item))
    );
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Save board to localStorage
  const handleSaveBoard = () => {
    soundEngine.playKeyClick();
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          items: boardItems,
          connections: connections,
          savedAt: new Date().toISOString(),
        })
      );
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (e) {
      console.error('Failed to save board', e);
    }
  };

  // Reset board
  const handleResetBoard = () => {
    soundEngine.playKeyClick();
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {}

    // Regenerate default grid
    const items: EvidenceBoardItem[] = [];
    let startX = 60;
    let startY = 40;
    caseData.evidence.forEach((ev, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      items.push({
        id: `ev-${ev.id || idx}`,
        title: ev.title,
        itemType: (ev.type as any) || 'physical',
        status: ev.classification === 'Confidential' ? 'Forensic Theory' : 'Established Fact',
        x: startX + col * 260,
        y: startY + row * 180,
        snippet: ev.description,
        source: ev.significance,
        date: ev.recoveredAt,
        caseSlug: caseData.slug,
        caseNumber: caseData.caseNumber,
        tags: [ev.type, ev.classification],
      });
    });

    setBoardItems(items);
    setConnections([]);
    setConnectingFromId(null);
  };

  // Delete a connection line
  const handleDeleteConnection = (conn: EvidenceConnection) => {
    soundEngine.playKeyClick();
    setConnections((prev) =>
      prev.filter((c) => !(c.fromId === conn.fromId && c.toId === conn.toId))
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="retro-window p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-[#080b0e]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-400">
            <Pin className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-emerald-400 font-bold uppercase">
                INTERACTIVE INVESTIGATIVE PINBOARD
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1">
                {boardItems.length} CARDS &bull; {connections.length} LINKS
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-editorial text-zinc-100">
              Drag Evidence & Draw Evidentiary Connections
            </h3>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-tech">
          {/* Relation type picker when connecting */}
          <div className="flex items-center space-x-1 bg-black/60 border border-zinc-800 p-1 rounded">
            <span className="text-[10px] font-pixel text-zinc-500 px-1">RELATION:</span>
            <button
              onClick={() => setSelectedRelationType('supports')}
              className={`px-2 py-0.5 rounded text-[10px] font-pixel border ${
                selectedRelationType === 'supports'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              SUPPORTS
            </button>
            <button
              onClick={() => setSelectedRelationType('contradicts')}
              className={`px-2 py-0.5 rounded text-[10px] font-pixel border ${
                selectedRelationType === 'contradicts'
                  ? 'bg-red-950 text-red-300 border-red-600 font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              CONTRADICTS
            </button>
            <button
              onClick={() => setSelectedRelationType('related to')}
              className={`px-2 py-0.5 rounded text-[10px] font-pixel border ${
                selectedRelationType === 'related to'
                  ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              RELATED TO
            </button>
          </div>

          {/* Connect tool toggle */}
          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setConnectingFromId(connectingFromId ? null : (boardItems[0]?.id || null));
            }}
            className={`retro-btn text-xs px-2.5 py-1.5 flex items-center space-x-1 ${
              connectingFromId ? 'border-amber-500 text-amber-300 bg-amber-950/40 animate-pulse' : ''
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{connectingFromId ? 'CLICK TARGET CARD...' : 'CONNECT CARDS'}</span>
          </button>

          {/* Save Board */}
          <button
            onClick={handleSaveBoard}
            className="retro-btn text-xs px-2.5 py-1.5 flex items-center space-x-1 border-emerald-700 text-emerald-300 hover:bg-emerald-950/60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE BOARD</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleResetBoard}
            className="retro-btn text-xs px-2 py-1.5 text-zinc-400 hover:text-red-400"
            title="Reset positions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="p-2.5 bg-emerald-950/70 border border-emerald-600 text-emerald-300 font-mono text-xs flex items-center space-x-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>[SYSTEM RECORD SAVED] Evidence board positions and relational links stored locally.</span>
        </div>
      )}

      {/* Help / Instructions Bar */}
      <div className="px-3 py-1.5 bg-black/60 border border-zinc-900 text-[11px] font-tech text-zinc-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-amber-500" />
          <span>
            Click & drag any card to rearrange. Click "CONNECT CARDS" then select 2 cards to draw animated links.
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-pixel">
          <span className="flex items-center text-emerald-400">
            <span className="w-2.5 h-0.5 bg-emerald-400 mr-1 inline-block" /> SUPPORTS
          </span>
          <span className="flex items-center text-red-400">
            <span className="w-2.5 h-0.5 bg-red-400 mr-1 inline-block" /> CONTRADICTS
          </span>
          <span className="flex items-center text-amber-400">
            <span className="w-2.5 h-0.5 bg-amber-400 mr-1 inline-block" /> RELATED TO
          </span>
        </div>
      </div>

      {/* THE CORKBOARD CANVAS */}
      <div
        ref={boardRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="retro-window relative min-h-[580px] h-[640px] w-full overflow-hidden bg-[#06080a] select-none border-2 border-zinc-800"
        style={{
          backgroundImage:
            'radial-gradient(circle, #1a202c 1px, transparent 1px), linear-gradient(to right, #090c10 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* SVG Animated Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <marker id="arrow-supports" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
            </marker>
            <marker id="arrow-contradicts" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
            <marker id="arrow-related" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
            </marker>
          </defs>

          {connections.map((conn, idx) => {
            const fromItem = boardItems.find((b) => b.id === conn.fromId);
            const toItem = boardItems.find((b) => b.id === conn.toId);
            if (!fromItem || !toItem) return null;

            const x1 = fromItem.x + 110;
            const y1 = fromItem.y + 60;
            const x2 = toItem.x + 110;
            const y2 = toItem.y + 60;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            const isSupports = conn.label === 'supports';
            const isContradicts = conn.label === 'contradicts';
            const strokeColor = isSupports ? '#10b981' : isContradicts ? '#ef4444' : '#f59e0b';
            const dashArray = isSupports ? '6 4' : isContradicts ? '3 3' : 'none';

            return (
              <g key={idx} className="cursor-pointer pointer-events-auto" onClick={() => handleDeleteConnection(conn)}>
                {/* Glow underlay */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth="6"
                  strokeOpacity="0.2"
                />
                {/* Animated main line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeDasharray={dashArray}
                  className="animate-pulse"
                />
                {/* Relationship Label Badge */}
                <foreignObject x={midX - 45} y={midY - 12} width="90" height="24">
                  <div
                    title="Click to remove connection"
                    className={`text-[9px] font-pixel px-1.5 py-0.5 rounded text-center border font-bold uppercase shadow-lg cursor-pointer ${
                      isSupports
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : isContradicts
                        ? 'bg-red-950 text-red-300 border-red-600'
                        : 'bg-amber-950 text-amber-300 border-amber-600'
                    }`}
                  >
                    {conn.label}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Draggable Evidence Cards */}
        {boardItems.map((item) => {
          const isDragging = draggingId === item.id;
          const isConnecting = connectingFromId === item.id;
          const isFact = item.status === 'Established Fact';
          const isSuspect = item.itemType === 'suspect';

          return (
            <div
              key={item.id}
              onMouseDown={(e) => handleMouseDown(e, item)}
              style={{
                transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
              }}
              className={`absolute top-0 left-0 w-[230px] rounded border transition-shadow cursor-grab active:cursor-grabbing z-20 ${
                isDragging
                  ? 'shadow-[0_0_20px_rgba(255,255,255,0.2)] border-zinc-400 z-30 scale-102'
                  : isConnecting
                  ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                  : isSuspect
                  ? 'border-red-900/80 bg-[#0d090a]'
                  : 'border-[#21262d] bg-[#090b0e] hover:border-zinc-500'
              }`}
            >
              {/* Card Pin Head */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border border-red-400 shadow flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Card Content */}
              <div className="p-3 pt-3.5 space-y-1.5 font-mono text-xs">
                {/* Header Tag */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[8px] font-pixel px-1 py-0.2 rounded border ${
                      isFact
                        ? 'text-emerald-400 border-emerald-800 bg-emerald-950/40'
                        : 'text-amber-400 border-amber-800 bg-amber-950/40'
                    }`}
                  >
                    {isFact ? 'CONFIRMED FACT' : 'ALLEGATION/THEORY'}
                  </span>
                  <span className="text-[8px] font-pixel text-zinc-500 uppercase">
                    {item.itemType}
                  </span>
                </div>

                {/* Title */}
                <h5 className="font-bold text-xs font-editorial text-zinc-100 line-clamp-1">
                  {item.title}
                </h5>

                {/* Snippet */}
                <p className="text-[10px] text-zinc-400 font-tech line-clamp-2 leading-relaxed">
                  {item.snippet}
                </p>

                {/* Source or Context */}
                {item.source && (
                  <div className="text-[9px] font-tech text-zinc-500 truncate pt-1 border-t border-zinc-900">
                    SRC: {item.source}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
