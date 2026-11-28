import React, { useState, useRef, useEffect } from 'react';
import {
  Move,
  GitCommitHorizontal,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Trash2,
  X,
  Pin,
} from 'lucide-react';
import {
  WorkBoardPin,
  WorkBoardConnection,
  WorkBoardRelation,
  WorkBoardTone,
  DOCKET_PIN_DRAG_MIME,
} from '../../utils/workBoard.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface WorkBoardCorkboardCanvasProps {
  pins: WorkBoardPin[];
  connections: WorkBoardConnection[];
  activeRelation: WorkBoardRelation;
  isExpanded: boolean;
  onMovePin: (pinId: string, x: number, y: number) => void;
  onConnectPins: (fromPinId: string, toPinId: string, relation: WorkBoardRelation) => void;
  onCycleConnectionRelation: (connId: string, nextRelation: WorkBoardRelation) => void;
  onRemoveConnection: (connId: string) => void;
  onRemovePin: (pinId: string) => void;
  onUpdatePinTone: (pinId: string, tone: WorkBoardTone) => void;
  onAutoArrange: (canvasWidth: number) => void;
  onDropExternalAt: (
    payload: {
      text: string;
      sourceLabel: string;
      kind: WorkBoardPin['kind'];
      tone: WorkBoardTone;
    },
    x: number,
    y: number
  ) => void;
}

const NODE_WIDTH = 178;
const PIN_ANCHOR_X = NODE_WIDTH / 2;
const PIN_ANCHOR_Y = 8;

const RELATION_ORDER: WorkBoardRelation[] = [
  'corroborates',
  'supports',
  'contradicts',
  'timeline',
];

const RELATION_STYLE: Record<
  WorkBoardRelation,
  { label: string; stroke: string; dash?: string; pillClass: string }
> = {
  corroborates: {
    label: 'CORROBORATES',
    stroke: '#ef4444', // classic conspiracy red string
    pillClass: 'bg-red-950/95 border-red-500 text-red-200',
  },
  supports: {
    label: 'SUPPORTS',
    stroke: '#10b981',
    pillClass: 'bg-emerald-950/95 border-emerald-500 text-emerald-200',
  },
  contradicts: {
    label: 'CONTRADICTS',
    stroke: '#f97316',
    dash: '6 4',
    pillClass: 'bg-orange-950/95 border-orange-500 text-orange-200',
  },
  timeline: {
    label: 'TIMELINE',
    stroke: '#22d3ee',
    dash: '4 3',
    pillClass: 'bg-cyan-950/95 border-cyan-500 text-cyan-200',
  },
};

const CARD_SURFACE_STYLE: Record<WorkBoardTone, string> = {
  amber: 'bg-[#1a150b] border-amber-600/80 text-amber-50',
  emerald: 'bg-[#0b1912] border-emerald-600/80 text-emerald-50',
  red: 'bg-[#1c0c10] border-red-600/80 text-red-50',
  cyan: 'bg-[#0a1721] border-cyan-600/80 text-cyan-50',
};

const PUSHPIN_CAP_STYLE: Record<WorkBoardTone, string> = {
  amber: 'bg-red-600 border-red-200',
  emerald: 'bg-emerald-500 border-emerald-100',
  red: 'bg-rose-600 border-rose-200',
  cyan: 'bg-cyan-500 border-cyan-100',
};

function getDeterministicTilt(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const choices = [-1.4, -0.7, 0.5, 1.2, -0.4, 0.9];
  return choices[Math.abs(hash) % choices.length];
}

export const WorkBoardCorkboardCanvas: React.FC<WorkBoardCorkboardCanvasProps> = ({
  pins,
  connections,
  activeRelation,
  isExpanded,
  onMovePin,
  onConnectPins,
  onCycleConnectionRelation,
  onRemoveConnection,
  onRemovePin,
  onUpdatePinTone,
  onAutoArrange,
  onDropExternalAt,
}) => {
  const [toolMode, setToolMode] = useState<'move' | 'draw'>('move');
  const [zoom, setZoom] = useState<number>(isExpanded ? 1 : 0.85);
  const [localCoords, setLocalCoords] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNode, setDraggingNode] = useState<{
    pinId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [drawingFrom, setDrawingFrom] = useState<{
    pinId: string;
    startX: number;
    startY: number;
    currX: number;
    currY: number;
  } | null>(null);
  const [hoverTargetPinId, setHoverTargetPinId] = useState<string | null>(null);
  const [clickLinkFromId, setClickLinkFromId] = useState<string | null>(null);
  const [isExternalDragOver, setIsExternalDragOver] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);

  // Sync local positions when pins prop updates
  useEffect(() => {
    setLocalCoords((prev) => {
      const next: Record<string, { x: number; y: number }> = {};
      pins.forEach((p, idx) => {
        if (draggingNode?.pinId === p.id && prev[p.id]) {
          next[p.id] = prev[p.id];
        } else {
          next[p.id] = {
            x: typeof p.x === 'number' ? p.x : 24 + (idx % 2) * 210,
            y: typeof p.y === 'number' ? p.y : 24 + Math.floor(idx / 2) * 145,
          };
        }
      });
      return next;
    });
  }, [pins, draggingNode?.pinId]);

  // Adjust default zoom when expanding/collapsing
  useEffect(() => {
    setZoom(isExpanded ? 1 : 0.82);
  }, [isExpanded]);

  const toCanvasCoords = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 40, y: 40 };
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  };

  const getPinPos = (pin: WorkBoardPin, idx: number) => {
    const cached = localCoords[pin.id];
    if (cached) return cached;
    return {
      x: typeof pin.x === 'number' ? pin.x : 24 + (idx % 2) * 210,
      y: typeof pin.y === 'number' ? pin.y : 24 + Math.floor(idx / 2) * 145,
    };
  };

  const startDrawingString = (e: React.PointerEvent, pin: WorkBoardPin, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    const pos = getPinPos(pin, idx);
    const startX = pos.x + PIN_ANCHOR_X;
    const startY = pos.y + PIN_ANCHOR_Y;
    const pointer = toCanvasCoords(e.clientX, e.clientY);
    soundEngine.playKeyClick();
    setDrawingFrom({
      pinId: pin.id,
      startX,
      startY,
      currX: pointer.x,
      currY: pointer.y,
    });
  };

  const handleCardPointerDown = (e: React.PointerEvent, pin: WorkBoardPin, idx: number) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();

    // If click-link mode is active, finish linking on click
    if (clickLinkFromId) {
      if (clickLinkFromId !== pin.id) {
        soundEngine.playBootBeep();
        onConnectPins(clickLinkFromId, pin.id, activeRelation);
      }
      setClickLinkFromId(null);
      return;
    }

    if (toolMode === 'draw' || e.shiftKey) {
      startDrawingString(e, pin, idx);
      return;
    }

    const pointer = toCanvasCoords(e.clientX, e.clientY);
    const pos = getPinPos(pin, idx);
    setDraggingNode({
      pinId: pin.id,
      offsetX: pointer.x - pos.x,
      offsetY: pointer.y - pos.y,
    });
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (draggingNode) {
      const pointer = toCanvasCoords(e.clientX, e.clientY);
      const nextX = Math.max(10, Math.round(pointer.x - draggingNode.offsetX));
      const nextY = Math.max(14, Math.round(pointer.y - draggingNode.offsetY));
      setLocalCoords((prev) => ({
        ...prev,
        [draggingNode.pinId]: { x: nextX, y: nextY },
      }));
      return;
    }

    if (drawingFrom) {
      const pointer = toCanvasCoords(e.clientX, e.clientY);
      setDrawingFrom((prev) =>
        prev ? { ...prev, currX: pointer.x, currY: pointer.y } : null
      );

      // Hit-test target pins by bounding box
      let foundTarget: string | null = null;
      for (let i = 0; i < pins.length; i++) {
        const candidate = pins[i];
        if (candidate.id === drawingFrom.pinId) continue;
        const pos = getPinPos(candidate, i);
        if (
          pointer.x >= pos.x - 10 &&
          pointer.x <= pos.x + NODE_WIDTH + 10 &&
          pointer.y >= pos.y - 12 &&
          pointer.y <= pos.y + 128
        ) {
          foundTarget = candidate.id;
          break;
        }
      }
      setHoverTargetPinId(foundTarget);
    }
  };

  const handleStagePointerUp = () => {
    if (draggingNode) {
      const finalPos = localCoords[draggingNode.pinId];
      if (finalPos) {
        onMovePin(draggingNode.pinId, finalPos.x, finalPos.y);
      }
      setDraggingNode(null);
    }

    if (drawingFrom) {
      if (hoverTargetPinId && hoverTargetPinId !== drawingFrom.pinId) {
        soundEngine.playBootBeep();
        onConnectPins(drawingFrom.pinId, hoverTargetPinId, activeRelation);
      }
      setDrawingFrom(null);
      setHoverTargetPinId(null);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExternalDragOver(false);

    if (e.dataTransfer.getData('application/x-workboard-pin-id')) return;

    const pt = toCanvasCoords(e.clientX, e.clientY);
    const dropX = Math.max(14, Math.round(pt.x - NODE_WIDTH / 2));
    const dropY = Math.max(16, Math.round(pt.y - 24));

    const structuredRaw = e.dataTransfer.getData(DOCKET_PIN_DRAG_MIME);
    if (structuredRaw) {
      try {
        const parsed = JSON.parse(structuredRaw);
        if (parsed.text && String(parsed.text).trim()) {
          soundEngine.playBootBeep();
          onDropExternalAt(
            {
              text: String(parsed.text),
              sourceLabel: parsed.sourceLabel || 'Highlighted Evidence',
              kind: parsed.kind || 'highlight',
              tone: parsed.tone || 'amber',
            },
            dropX,
            dropY
          );
          return;
        }
      } catch {}
    }

    const plainText = e.dataTransfer.getData('text/plain')?.trim();
    if (plainText) {
      soundEngine.playBootBeep();
      onDropExternalAt(
        {
          text: plainText,
          sourceLabel: 'Dragged Text Fragment',
          kind: 'fragment',
          tone: 'amber',
        },
        dropX,
        dropY
      );
    }
  };

  // Compute dynamic corkboard stage size so every pinned card & string is reachable
  const maxX = pins.reduce((acc, p, i) => Math.max(acc, getPinPos(p, i).x + NODE_WIDTH + 60), 0);
  const maxY = pins.reduce((acc, p, i) => Math.max(acc, getPinPos(p, i).y + 185), 0);
  const stageWidth = Math.max(isExpanded ? 920 : 480, maxX);
  const stageHeight = Math.max(isExpanded ? 540 : 380, maxY);

  const pinLookup = new Map<string, { pin: WorkBoardPin; idx: number }>();
  pins.forEach((p, idx) => pinLookup.set(p.id, { pin: p, idx }));

  return (
    <div className="space-y-2">
      {/* Corkboard Tool Strip */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#080b10] border border-zinc-800 rounded p-1.5 text-[10px]">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setToolMode('move');
              setClickLinkFromId(null);
            }}
            className={`px-2 py-1 rounded border flex items-center space-x-1 transition-colors ${
              toolMode === 'move'
                ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Drag cards to reposition; drag from any red push-pin to pull a string"
          >
            <Move className="w-3 h-3" />
            <span>MOVE</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setToolMode('draw');
            }}
            className={`px-2 py-1 rounded border flex items-center space-x-1 transition-colors ${
              toolMode === 'draw'
                ? 'bg-red-950/90 border-red-500 text-red-200 font-bold shadow-[0_0_8px_rgba(239,68,68,0.35)]'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-red-300'
            }`}
            title="Click & drag between any two cards to draw a conspiracy string"
          >
            <GitCommitHorizontal className="w-3 h-3 text-red-400" />
            <span>DRAW STRING</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              onAutoArrange(isExpanded ? 760 : 480);
            }}
            className="px-2 py-1 rounded border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-amber-500 flex items-center space-x-1"
            title="Auto-arrange pinned fragments neatly on the corkboard"
          >
            <LayoutGrid className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">ARRANGE</span>
          </button>

          <div className="flex items-center border border-zinc-800 rounded bg-zinc-950">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.1).toFixed(2))))}
              className="p-1 text-zinc-400 hover:text-zinc-100"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1 text-[9px] text-zinc-400 font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))}
              className="p-1 text-zinc-400 hover:text-zinc-100"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Helper Cue */}
      <div className="text-[10px] text-zinc-400 px-1 flex flex-wrap items-center justify-between gap-1">
        <span>
          {drawingFrom
            ? 'Release over target card to tie string...'
            : toolMode === 'draw'
            ? 'Drag from any card to another to draw a connection string.'
            : 'Drag cards to move • Pull any push-pin to draw a string • Click a string tag to cycle/snip.'}
        </span>
        {clickLinkFromId && (
          <button
            type="button"
            onClick={() => setClickLinkFromId(null)}
            className="text-red-300 underline"
          >
            Cancel link
          </button>
        )}
      </div>

      {/* Scrollable Corkboard Frame */}
      <div
        className={`relative overflow-auto rounded border-4 transition-colors shadow-inner ${
          isExpanded ? 'h-[calc(100vh-19rem)] min-h-[380px]' : 'h-[370px]'
        } ${
          isExternalDragOver
            ? 'border-emerald-500'
            : 'border-[#3a2818]'
        }`}
        style={{
          backgroundColor: '#1a120c',
          backgroundImage:
            'radial-gradient(rgba(180,120,65,0.14) 1px, transparent 1px), radial-gradient(rgba(90,55,28,0.22) 1px, transparent 1px)',
          backgroundSize: '18px 18px, 11px 11px',
          backgroundPosition: '0 0, 7px 7px',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExternalDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsExternalDragOver(false);
          }
        }}
        onDrop={handleCanvasDrop}
      >
        {/* Inner Scaled Corkboard Stage */}
        <div
          ref={stageRef}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onPointerLeave={handleStagePointerUp}
          style={{
            width: `${stageWidth * zoom}px`,
            height: `${stageHeight * zoom}px`,
          }}
          className="relative select-none"
        >
          <div
            style={{
              width: `${stageWidth}px`,
              height: `${stageHeight}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            className="relative"
          >
            {/* Subtle Corkboard Framing Grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,215,170,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,215,170,0.08) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            {/* SVG String Connection Layer */}
            <svg
              width={stageWidth}
              height={stageHeight}
              className="absolute inset-0 pointer-events-none z-10 overflow-visible"
            >
              <defs>
                <filter id="cork-string-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.85" />
                </filter>
              </defs>

              {connections.map((conn) => {
                const fromEntry = pinLookup.get(conn.fromPinId);
                const toEntry = pinLookup.get(conn.toPinId);
                if (!fromEntry || !toEntry) return null;

                const p1 = getPinPos(fromEntry.pin, fromEntry.idx);
                const p2 = getPinPos(toEntry.pin, toEntry.idx);
                const x1 = p1.x + PIN_ANCHOR_X;
                const y1 = p1.y + PIN_ANCHOR_Y;
                const x2 = p2.x + PIN_ANCHOR_X;
                const y2 = p2.y + PIN_ANCHOR_Y;

                const dist = Math.hypot(x2 - x1, y2 - y1);
                const sag = Math.min(34, Math.max(10, dist * 0.1));
                const ctrlX = (x1 + x2) / 2;
                const ctrlY = (y1 + y2) / 2 + sag;

                // Point on quadratic Bezier at t=0.5
                const midX = 0.25 * x1 + 0.5 * ctrlX + 0.25 * x2;
                const midY = 0.25 * y1 + 0.5 * ctrlY + 0.25 * y2;

                const meta = RELATION_STYLE[conn.relation] || RELATION_STYLE.corroborates;

                return (
                  <g key={conn.id} filter="url(#cork-string-shadow)">
                    {/* Soft glow halo */}
                    <path
                      d={`M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`}
                      fill="none"
                      stroke={meta.stroke}
                      strokeWidth={6}
                      opacity={0.16}
                    />
                    {/* Taut string cord */}
                    <path
                      d={`M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`}
                      fill="none"
                      stroke={meta.stroke}
                      strokeWidth={2.4}
                      strokeDasharray={meta.dash}
                      strokeLinecap="round"
                    />
                    {/* Interactive Midpoint String Tag */}
                    <foreignObject
                      x={midX - 58}
                      y={midY - 12}
                      width={116}
                      height={24}
                      className="pointer-events-auto overflow-visible"
                    >
                      <div className="flex items-center justify-center">
                        <div
                          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded border text-[8px] font-pixel shadow-lg ${meta.pillClass}`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEngine.playKeyClick();
                              const curIdx = RELATION_ORDER.indexOf(conn.relation);
                              const nextRel =
                                RELATION_ORDER[(curIdx + 1) % RELATION_ORDER.length];
                              onCycleConnectionRelation(conn.id, nextRel);
                            }}
                            className="hover:underline uppercase tracking-tight"
                            title="Click to cycle connection type"
                          >
                            {meta.label}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEngine.playKeyClick();
                              onRemoveConnection(conn.id);
                            }}
                            className="opacity-75 hover:opacity-100 hover:text-white"
                            title="Snip / remove string"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Live Rubber-Band String While Drawing */}
              {drawingFrom && (
                <g>
                  <path
                    d={`M ${drawingFrom.startX} ${drawingFrom.startY} Q ${
                      (drawingFrom.startX + drawingFrom.currX) / 2
                    } ${
                      (drawingFrom.startY + drawingFrom.currY) / 2 + 18
                    } ${drawingFrom.currX} ${drawingFrom.currY}`}
                    fill="none"
                    stroke={RELATION_STYLE[activeRelation]?.stroke || '#ef4444'}
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                  />
                  <circle
                    cx={drawingFrom.currX}
                    cy={drawingFrom.currY}
                    r={5}
                    fill={RELATION_STYLE[activeRelation]?.stroke || '#ef4444'}
                  />
                </g>
              )}
            </svg>

            {/* Pinned Evidence Fragment Nodes */}
            {pins.map((pin, idx) => {
              const pos = getPinPos(pin, idx);
              const isDragging = draggingNode?.pinId === pin.id;
              const isDrawSource = drawingFrom?.pinId === pin.id || clickLinkFromId === pin.id;
              const isHoverTarget = hoverTargetPinId === pin.id;
              const tilt = isDragging || isHoverTarget ? 0 : getDeterministicTilt(pin.id);
              const linkCount = connections.filter(
                (c) => c.fromPinId === pin.id || c.toPinId === pin.id
              ).length;

              return (
                <div
                  key={pin.id}
                  onPointerDown={(e) => handleCardPointerDown(e, pin, idx)}
                  style={{
                    width: `${NODE_WIDTH}px`,
                    transform: `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${tilt}deg)`,
                  }}
                  className={`absolute top-0 left-0 rounded border shadow-[0_8px_18px_rgba(0,0,0,0.75)] transition-shadow p-2 pt-3.5 ${
                    CARD_SURFACE_STYLE[pin.tone] || CARD_SURFACE_STYLE.amber
                  } ${
                    toolMode === 'draw' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
                  } ${
                    isDragging ? 'z-40 ring-2 ring-amber-400 shadow-[0_14px_28px_rgba(0,0,0,0.9)]' : 'z-20'
                  } ${
                    isDrawSource ? 'ring-2 ring-red-500 z-30' : ''
                  } ${
                    isHoverTarget ? 'ring-2 ring-emerald-400 scale-[1.03] z-40' : ''
                  }`}
                >
                  {/* Interactive Push-Pin Cap (Drag from here to draw red string!) */}
                  <button
                    type="button"
                    onPointerDown={(e) => startDrawingString(e, pin, idx)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!drawingFrom) {
                        soundEngine.playKeyClick();
                        setClickLinkFromId((prev) => (prev === pin.id ? null : pin.id));
                      }
                    }}
                    title="Drag from push-pin to draw connection string to another card (or click two pins)"
                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 shadow-md flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform z-30 ${
                      PUSHPIN_CAP_STYLE[pin.tone] || PUSHPIN_CAP_STYLE.amber
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/90 pointer-events-none" />
                  </button>

                  {/* Node Header */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-bold text-amber-300 truncate">
                      {pin.sourceLabel}
                    </span>
                    <div className="flex items-center space-x-1 shrink-0">
                      <span
                        className="text-[8px] px-1 rounded bg-black/50 border border-zinc-700 text-zinc-300"
                        title="Connected strings"
                      >
                        {linkCount}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.playKeyClick();
                          onRemovePin(pin.id);
                        }}
                        className="text-zinc-400 hover:text-red-400 p-0.5"
                        title="Unpin from corkboard"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Snippet */}
                  <p className="text-[10px] font-tech leading-snug text-zinc-100 line-clamp-4">
                    {pin.text}
                  </p>

                  {/* Bottom Pin Tone Strip & Quick Tie Handle */}
                  <div className="mt-1.5 pt-1 border-t border-black/35 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {(['amber', 'emerald', 'red', 'cyan'] as WorkBoardTone[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdatePinTone(pin.id, t);
                          }}
                          className={`w-2 h-2 rounded-full ${
                            t === 'amber'
                              ? 'bg-amber-400'
                              : t === 'emerald'
                              ? 'bg-emerald-400'
                              : t === 'red'
                              ? 'bg-red-500'
                              : 'bg-cyan-400'
                          } ${pin.tone === t ? 'ring-1 ring-white' : 'opacity-45 hover:opacity-100'}`}
                          title={`Color: ${t}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onPointerDown={(e) => startDrawingString(e, pin, idx)}
                      className="text-[8px] px-1.5 py-0.5 rounded bg-red-950/70 hover:bg-red-900 border border-red-700/80 text-red-200 flex items-center space-x-0.5 cursor-crosshair"
                      title="Drag to tie a connection string to another fragment"
                    >
                      <Pin className="w-2 h-2 text-red-400" />
                      <span>TIE</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
