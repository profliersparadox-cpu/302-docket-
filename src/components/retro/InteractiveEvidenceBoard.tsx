import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  RefreshCw,
  Info,
  Link as LinkIcon,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Dna,
  User,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EvidenceBoardItem, EvidenceConnection } from '../../types.ts';
import { initialEvidenceBoardItems, initialEvidenceConnections } from '../../data/archiveVaultData.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface InteractiveEvidenceBoardProps {
  onOpenCase?: (slug: string) => void;
}

export const InteractiveEvidenceBoard: React.FC<InteractiveEvidenceBoardProps> = ({ onOpenCase }) => {
  // Load saved positions or use default
  const [items, setItems] = useState<EvidenceBoardItem[]>(() => {
    const saved = localStorage.getItem('docket_board_items');
    return saved ? JSON.parse(saved) : initialEvidenceBoardItems;
  });

  const [connections, setConnections] = useState<EvidenceConnection[]>(() => {
    const saved = localStorage.getItem('docket_board_conns');
    return saved ? JSON.parse(saved) : initialEvidenceConnections;
  });

  const [selectedItem, setSelectedItem] = useState<EvidenceBoardItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'document' | 'forensic' | 'physical' | 'statement' | 'suspect'>('all');
  const [connectModeFrom, setConnectModeFrom] = useState<string | null>(null);

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  const saveToStorage = (updatedItems: EvidenceBoardItem[], updatedConns: EvidenceConnection[]) => {
    localStorage.setItem('docket_board_items', JSON.stringify(updatedItems));
    localStorage.setItem('docket_board_conns', JSON.stringify(updatedConns));
  };

  const handleMouseDown = (e: React.MouseEvent, item: EvidenceBoardItem) => {
    if (connectModeFrom) {
      if (connectModeFrom !== item.id) {
        // Toggle or create connection
        soundEngine.playKeyClick();
        const exists = connections.some(
          (c) =>
            (c.fromId === connectModeFrom && c.toId === item.id) ||
            (c.fromId === item.id && c.toId === connectModeFrom)
        );

        let nextConns: EvidenceConnection[];
        if (exists) {
          nextConns = connections.filter(
            (c) =>
              !(
                (c.fromId === connectModeFrom && c.toId === item.id) ||
                (c.fromId === item.id && c.toId === connectModeFrom)
              )
          );
        } else {
          nextConns = [
            ...connections,
            {
              fromId: connectModeFrom,
              toId: item.id,
              label: 'Investigative Link',
              type: 'forensic_link',
            },
          ];
        }
        setConnections(nextConns);
        saveToStorage(items, nextConns);
      }
      setConnectModeFrom(null);
      return;
    }

    soundEngine.playKeyClick();
    setDraggingId(item.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();

    const newX = Math.max(10, Math.min(boardRect.width - 240, e.clientX - boardRect.left - dragOffset.x));
    const newY = Math.max(10, Math.min(boardRect.height - 180, e.clientY - boardRect.top - dragOffset.y));

    setItems((prev) => {
      const updated = prev.map((item) => (item.id === draggingId ? { ...item, x: newX, y: newY } : item));
      return updated;
    });
  };

  const handleMouseUp = () => {
    if (draggingId) {
      setDraggingId(null);
      saveToStorage(items, connections);
    }
  };

  const handleResetBoard = () => {
    soundEngine.playFileAccess();
    setItems(initialEvidenceBoardItems);
    setConnections(initialEvidenceConnections);
    localStorage.removeItem('docket_board_items');
    localStorage.removeItem('docket_board_conns');
    setSelectedItem(null);
    setConnectModeFrom(null);
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.itemType === activeFilter;
  });

  return (
    <div className="flex flex-col h-full bg-[#0a0c0f] text-zinc-300 font-tech select-none overflow-hidden">
      {/* Board Controls Toolbar */}
      <div className="bg-[#12151a] border-b border-[#2d333b] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-300 font-pixel text-[10px]">
            EVIDENCE_PINBOARD.EXE
          </span>
          <span className="text-zinc-500 hidden sm:inline">|</span>
          <span className="text-zinc-400 text-[11px] hidden md:inline">
            Drag cards to arrange • Click to inspect • Connect nodes
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 border border-zinc-800 rounded">
            {(['all', 'document', 'forensic', 'physical', 'statement'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundEngine.playKeyClick();
                  setActiveFilter(cat);
                }}
                className={`px-2 py-0.5 text-[10px] uppercase font-mono rounded ${
                  activeFilter === cat
                    ? 'bg-zinc-800 text-phosphor border border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              soundEngine.playKeyClick();
              setConnectModeFrom(connectModeFrom ? null : items[0]?.id || null);
            }}
            className={`px-2 py-1 text-xs font-mono flex items-center space-x-1 border rounded ${
              connectModeFrom
                ? 'bg-amber-950 border-amber-600 text-amber-200 animate-pulse'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
            title="Toggle linking string mode"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{connectModeFrom ? 'LINKING MODE ACTIVE' : 'DRAW STRING'}</span>
          </button>

          <button
            onClick={handleResetBoard}
            className="px-2 py-1 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded flex items-center space-x-1"
            title="Reset cards to default positions"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </div>

      {/* Main Pinboard Canvas */}
      <div
        ref={boardRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative flex-1 overflow-hidden bg-[radial-gradient(#1e242c_1px,transparent_1px)] [background-size:20px_20px] bg-[#0c0e12] cursor-crosshair"
        style={{ minHeight: '520px' }}
      >
        {/* SVG Thread Lines Connecting Evidence Cards */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {connections.map((conn, idx) => {
            const from = items.find((i) => i.id === conn.fromId);
            const to = items.find((i) => i.id === conn.toId);
            if (!from || !to) return null;

            // Card center approximations
            const x1 = from.x + 110;
            const y1 = from.y + 70;
            const x2 = to.x + 110;
            const y2 = to.y + 70;

            // Curved bezier path
            const dx = x2 - x1;
            const dy = y2 - y1;
            const cx = (x1 + x2) / 2 - dy * 0.15;
            const cy = (y1 + y2) / 2 + dx * 0.15;

            return (
              <g key={idx}>
                <path
                  d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                  stroke="url(#threadGradient)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="4 2"
                />
                <circle cx={x1} cy={y1} r="4" fill="#ef4444" />
                <circle cx={x2} cy={y2} r="4" fill="#ef4444" />
              </g>
            );
          })}
        </svg>

        {/* Evidence Cards */}
        {filteredItems.map((item) => {
          const isSelected = selectedItem?.id === item.id;
          const isConnectingSource = connectModeFrom === item.id;

          return (
            <div
              key={item.id}
              onMouseDown={(e) => handleMouseDown(e, item)}
              onClick={() => setSelectedItem(item)}
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                zIndex: isSelected ? 40 : 20,
              }}
              className={`absolute w-56 p-3 bg-zinc-950/95 border-2 rounded shadow-2xl cursor-grab active:cursor-grabbing transition-shadow ${
                isSelected
                  ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                  : isConnectingSource
                  ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'border-[#2d333b] hover:border-zinc-500'
              }`}
            >
              {/* Pushpin at top center */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border border-red-400 shadow flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
              </div>

              {/* Status Header Badge */}
              <div className="flex items-center justify-between text-[10px] font-mono mb-2 border-b border-zinc-800 pb-1">
                <span className="text-zinc-500 uppercase">{item.caseNumber}</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold ${
                    item.status === 'Established Fact'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : item.status === 'Documented Allegation'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                  }`}
                >
                  {item.status === 'Established Fact' ? 'FACT' : item.status === 'Documented Allegation' ? 'ALLEGATION' : 'THEORY'}
                </span>
              </div>

              <h4 className="text-xs font-bold text-zinc-100 mb-1 leading-snug line-clamp-2">
                {item.title}
              </h4>

              <p className="text-[11px] text-zinc-400 line-clamp-3 mb-2 font-mono">
                {item.snippet}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((t, i) => (
                  <span key={i} className="px-1 py-0.2 bg-zinc-900 text-zinc-400 border border-zinc-800 text-[9px] rounded">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {/* Selected Item Detail Inspector Drawer */}
        {selectedItem && (
          <div className="absolute top-4 right-4 w-80 sm:w-96 bg-zinc-950 border-2 border-amber-500/80 rounded-lg shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-amber-400 font-bold">
                <Info className="w-4 h-4" />
                <span>EXHIBIT DOSSIER INSPECTOR</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-zinc-500 hover:text-zinc-200 font-mono text-xs px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block uppercase">
                  CLASSIFICATION STATUS
                </span>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-bold font-mono ${
                    selectedItem.status === 'Established Fact'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : selectedItem.status === 'Documented Allegation'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                  }`}
                >
                  {selectedItem.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1">
                  {selectedItem.title}
                </h3>
                <p className="text-zinc-300 text-xs leading-relaxed font-mono bg-zinc-900/60 p-2 border border-zinc-800 rounded">
                  {selectedItem.snippet}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-zinc-500 block uppercase">
                  OFFICIAL INVESTIGATIVE SOURCE
                </span>
                <p className="text-amber-300 font-mono text-xs">
                  {selectedItem.source}
                </p>
              </div>

              {selectedItem.date && (
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">
                    DATE RECOVERED / RECORDED
                  </span>
                  <p className="text-zinc-300 font-mono">{selectedItem.date}</p>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-900 flex justify-between items-center">
                {onOpenCase && selectedItem.caseSlug && (
                  <button
                    onClick={() => onOpenCase(selectedItem.caseSlug)}
                    className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-mono rounded transition-colors"
                  >
                    OPEN COMPLETE CASE DOSSIER &rarr;
                  </button>
                )}
                <span className="text-[10px] text-zinc-500 font-mono">
                  READ-ONLY SECURE EXHIBIT
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="bg-[#0e1115] border-t border-[#2d333b] px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <div>
          <span>CANVAS: </span>
          <span className="text-zinc-300">{items.length} Exhibits</span> |{' '}
          <span>CONNECTIONS: </span>
          <span className="text-zinc-300">{connections.length} Threads</span>
        </div>
        <div className="text-zinc-400">
          STRICT CONSTITUTION: Original records cannot be tampered with.
        </div>
      </div>
    </div>
  );
};
