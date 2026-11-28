import React, { useState, useEffect } from 'react';
import {
  Pin,
  Link2,
  X,
  Trash2,
  Plus,
  GitMerge,
  Layers,
  Check,
  GripVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  WorkBoardState,
  WorkBoardPin,
  WorkBoardRelation,
  WorkBoardTone,
  DOCKET_PIN_DRAG_MIME,
  WORK_BOARD_UPDATED_EVENT,
  loadWorkBoard,
  addWorkBoardPin,
  removeWorkBoardPin,
  updateWorkBoardPinTone,
  updateWorkBoardPinPosition,
  autoArrangeWorkBoardPins,
  connectWorkBoardPins,
  updateWorkBoardConnectionRelation,
  removeWorkBoardConnection,
  syncWorkBoardToEvidenceBoard,
} from '../../utils/workBoard.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { WorkBoardCorkboardCanvas } from './WorkBoardCorkboardCanvas.tsx';

interface WorkBoardSidePanelProps {
  caseSlug: string;
  caseNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullEvidenceBoard?: () => void;
}

const TONE_CARD_STYLES: Record<WorkBoardTone, string> = {
  amber: 'bg-[#17130a] border-amber-600/75 text-amber-100',
  emerald: 'bg-[#091811] border-emerald-600/75 text-emerald-100',
  red: 'bg-[#1b0b0e] border-red-600/75 text-red-100',
  cyan: 'bg-[#091620] border-cyan-600/75 text-cyan-100',
};

const TONE_DOT_STYLES: Record<WorkBoardTone, string> = {
  amber: 'bg-amber-400 border-amber-200',
  emerald: 'bg-emerald-400 border-emerald-200',
  red: 'bg-red-500 border-red-200',
  cyan: 'bg-cyan-400 border-cyan-200',
};

const RELATION_META: Record<
  WorkBoardRelation,
  { label: string; color: string; stroke: string }
> = {
  supports: {
    label: 'SUPPORTS',
    color: 'text-emerald-300 border-emerald-700 bg-emerald-950/70',
    stroke: '#34d399',
  },
  contradicts: {
    label: 'CONTRADICTS',
    color: 'text-red-300 border-red-700 bg-red-950/70',
    stroke: '#f87171',
  },
  corroborates: {
    label: 'CORROBORATES',
    color: 'text-amber-300 border-amber-700 bg-amber-950/70',
    stroke: '#fbbf24',
  },
  timeline: {
    label: 'TIMELINE LINK',
    color: 'text-cyan-300 border-cyan-700 bg-cyan-950/70',
    stroke: '#22d3ee',
  },
};

export const WorkBoardSidePanel: React.FC<WorkBoardSidePanelProps> = ({
  caseSlug,
  caseNumber,
  isOpen,
  onClose,
  onOpenFullEvidenceBoard,
}) => {
  const [board, setBoard] = useState<WorkBoardState>(() => loadWorkBoard(caseSlug));
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [dropTargetPinId, setDropTargetPinId] = useState<string | null>(null);
  const [relationType, setRelationType] = useState<WorkBoardRelation>('corroborates');
  const [manualText, setManualText] = useState('');
  const [manualSource, setManualSource] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'corkboard'>('corkboard');
  const [isExpanded, setIsExpanded] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    setBoard(loadWorkBoard(caseSlug));
    setLinkingFromId(null);

    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.caseSlug === caseSlug) {
        setBoard(loadWorkBoard(caseSlug));
      }
    };
    window.addEventListener(WORK_BOARD_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(WORK_BOARD_UPDATED_EVENT, onUpdate);
  }, [caseSlug]);

  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isExpanded]);

  if (!isOpen) return null;

  const handleDropIntoBoard = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverDropzone(false);

    // Ignore internal pin-to-pin card drops here
    const internalPinId = e.dataTransfer.getData('application/x-workboard-pin-id');
    if (internalPinId) return;

    const structuredRaw = e.dataTransfer.getData(DOCKET_PIN_DRAG_MIME);
    if (structuredRaw) {
      try {
        const parsed = JSON.parse(structuredRaw);
        if (parsed.text && String(parsed.text).trim()) {
          soundEngine.playBootBeep();
          addWorkBoardPin(caseSlug, {
            caseNumber,
            text: String(parsed.text),
            sourceLabel: parsed.sourceLabel || 'Highlighted Evidence',
            kind: parsed.kind || 'highlight',
            tone: parsed.tone || 'amber',
          });
          return;
        }
      } catch {
        // Fallback to plain text
      }
    }

    const plainText = e.dataTransfer.getData('text/plain')?.trim();
    if (plainText) {
      soundEngine.playBootBeep();
      addWorkBoardPin(caseSlug, {
        caseNumber,
        text: plainText,
        sourceLabel: 'Dragged Text Fragment',
        kind: 'fragment',
        tone: 'amber',
      });
    }
  };

  const handlePinDragStart = (e: React.DragEvent<HTMLDivElement>, pin: WorkBoardPin) => {
    setDraggingPinId(pin.id);
    e.dataTransfer.setData('application/x-workboard-pin-id', pin.id);
    e.dataTransfer.setData('text/plain', pin.text);
    e.dataTransfer.effectAllowed = 'linkMove';
  };

  const handleDropOnCard = (e: React.DragEvent<HTMLDivElement>, targetPin: WorkBoardPin) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetPinId(null);

    const sourcePinId = e.dataTransfer.getData('application/x-workboard-pin-id');
    if (sourcePinId && sourcePinId !== targetPin.id) {
      soundEngine.playBootBeep();
      connectWorkBoardPins(caseSlug, sourcePinId, targetPin.id, relationType);
      setDraggingPinId(null);
      return;
    }

    // If external text/evidence was dropped onto a card, add it to the board and link it to targetPin!
    const structuredRaw = e.dataTransfer.getData(DOCKET_PIN_DRAG_MIME);
    let droppedText = e.dataTransfer.getData('text/plain')?.trim() || '';
    let sourceLabel = 'Dragged Text Fragment';
    let kind: WorkBoardPin['kind'] = 'fragment';
    let tone: WorkBoardTone = 'amber';

    if (structuredRaw) {
      try {
        const parsed = JSON.parse(structuredRaw);
        if (parsed.text) droppedText = String(parsed.text).trim();
        if (parsed.sourceLabel) sourceLabel = parsed.sourceLabel;
        if (parsed.kind) kind = parsed.kind;
        if (parsed.tone) tone = parsed.tone;
      } catch {}
    }

    if (droppedText) {
      soundEngine.playBootBeep();
      const created = addWorkBoardPin(caseSlug, {
        caseNumber,
        text: droppedText,
        sourceLabel,
        kind,
        tone,
      });
      connectWorkBoardPins(caseSlug, created.id, targetPin.id, relationType);
    }
  };

  const handleCardClickForLink = (targetPinId: string) => {
    if (!linkingFromId) return;
    if (linkingFromId === targetPinId) {
      setLinkingFromId(null);
      return;
    }
    soundEngine.playBootBeep();
    connectWorkBoardPins(caseSlug, linkingFromId, targetPinId, relationType);
    setLinkingFromId(null);
  };

  const handleAddManualPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    soundEngine.playBootBeep();
    addWorkBoardPin(caseSlug, {
      caseNumber,
      text: manualText.trim(),
      sourceLabel: manualSource.trim() || 'Investigator Fragment',
      kind: 'fragment',
      tone: 'amber',
    });
    setManualText('');
    setManualSource('');
    setShowManualForm(false);
  };

  const handleSyncBoard = () => {
    soundEngine.playBootBeep();
    const added = syncWorkBoardToEvidenceBoard(caseSlug, caseNumber);
    setSyncNotice(
      added > 0
        ? `Synced ${added} card(s) to Evidence Board`
        : 'All pins already on Evidence Board'
    );
    setTimeout(() => setSyncNotice(null), 2600);
  };

  const pinLookup = new Map<string, WorkBoardPin>(board.pins.map((p) => [p.id, p]));

  const panelContent = (
    <aside
      aria-label="Persistent Investigator Work Board"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOverDropzone(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOverDropzone(false);
        }
      }}
      onDrop={handleDropIntoBoard}
      className={`retro-window bg-[#090d14] border-2 rounded flex flex-col font-mono text-xs shadow-2xl transition-colors ${
        isExpanded ? 'w-full h-full' : ''
      } ${
        isDragOverDropzone
          ? 'border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.3)]'
          : 'border-amber-700/70'
      }`}
    >
      {/* Header */}
      <div className="bg-[#121722] border-b border-zinc-800 px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Pin className="w-4 h-4 text-red-500 shrink-0" />
          <div>
            <div className="font-pixel text-[10px] text-amber-400 uppercase font-bold">
              WORK BOARD ({board.pins.length})
            </div>
            <div className="text-[10px] text-zinc-400">
              {board.connections.length} string{board.connections.length === 1 ? '' : 's'} &bull;{' '}
              {caseNumber}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setViewMode((m) => (m === 'cards' ? 'corkboard' : 'cards'));
            }}
            className={`px-2 py-1 rounded border text-[10px] flex items-center space-x-1 ${
              viewMode === 'corkboard'
                ? 'bg-red-950/80 border-red-500 text-red-200 font-bold'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-amber-500'
            }`}
            title="Switch between Card Stack and Node-Link Conspiracy Corkboard"
          >
            <GitMerge className="w-3 h-3 text-red-400" />
            <span>{viewMode === 'corkboard' ? 'NODE-LINK' : 'CARDS'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setIsExpanded((v) => !v);
            }}
            className="p-1 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-amber-300 hover:border-amber-500"
            title={isExpanded ? 'Dock back to side panel' : 'Expand Corkboard workspace'}
            aria-label={isExpanded ? 'Collapse Work Board' : 'Expand Work Board'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setIsExpanded(false);
              onClose();
            }}
            className="p-1 text-zinc-400 hover:text-zinc-100"
            aria-label="Close Work Board"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drop Target & Connection Mode Toolbar */}
      <div className="p-3 border-b border-zinc-800/80 space-y-2.5 bg-[#070a0f]">
        <div
          className={`p-2.5 rounded border-2 border-dashed text-center transition-colors ${
            isDragOverDropzone
              ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200'
              : 'border-zinc-700 bg-black/50 text-zinc-400'
          }`}
        >
          <div className="font-bold text-[11px] text-amber-300">
            {isDragOverDropzone ? 'RELEASE TO PIN ON WORK BOARD' : 'DROP FRAGMENTS OR EVIDENCE HERE'}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Drag selected text, highlighted terms, or exhibit cards into this panel.
          </div>
        </div>

        {/* Link Relation Selector */}
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="text-zinc-400 shrink-0">STRING TYPE:</span>
          <select
            value={relationType}
            onChange={(e) => setRelationType(e.target.value as WorkBoardRelation)}
            className="flex-1 bg-black border border-zinc-700 px-2 py-1 rounded text-amber-300 focus:outline-none focus:border-amber-500"
          >
            <option value="corroborates">Corroborates (Red String)</option>
            <option value="supports">Supports (Emerald)</option>
            <option value="contradicts">Contradicts (Flagged)</option>
            <option value="timeline">Timeline Sequence (Cyan)</option>
          </select>
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setShowManualForm((v) => !v);
            }}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded flex items-center space-x-1 shrink-0"
            title="Add a manual fragment or hypothesis"
          >
            <Plus className="w-3 h-3 text-amber-400" />
            <span>ADD</span>
          </button>
        </div>

        {linkingFromId && (
          <div className="px-2.5 py-1.5 bg-amber-950/60 border border-amber-500 rounded text-[10px] text-amber-200 flex items-center justify-between">
            <span>Click a second card below to link ({RELATION_META[relationType].label})</span>
            <button
              type="button"
              onClick={() => setLinkingFromId(null)}
              className="text-amber-400 hover:text-white font-bold ml-2"
            >
              CANCEL
            </button>
          </div>
        )}

        {showManualForm && (
          <form onSubmit={handleAddManualPin} className="space-y-1.5 pt-1">
            <input
              type="text"
              value={manualSource}
              onChange={(e) => setManualSource(e.target.value)}
              placeholder="Source label (e.g. Ransom Note p.2)"
              className="w-full bg-black border border-zinc-700 px-2 py-1 rounded text-[11px] text-zinc-200 focus:outline-none focus:border-amber-500"
            />
            <textarea
              rows={2}
              required
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste text fragment or investigator lead..."
              className="w-full bg-black border border-zinc-700 p-2 rounded text-[11px] text-zinc-100 focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end space-x-1.5">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-0.5 bg-amber-500 text-black font-bold rounded text-[10px]"
              >
                Pin Fragment
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Content Area: Node-Link Conspiracy Corkboard or Card Stack */}
      <div
        className={`flex-1 overflow-y-auto p-3 space-y-2.5 ${
          isExpanded ? 'min-h-0' : 'max-h-[540px] lg:max-h-[calc(100vh-19rem)]'
        }`}
      >
        {board.pins.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 space-y-2 border border-dashed border-zinc-800 rounded">
            <Layers className="w-6 h-6 mx-auto opacity-40 text-amber-400" />
            <p className="text-[11px] leading-relaxed">
              Your Work Board is empty. Select any text in the dossier or documents and click{' '}
              <strong className="text-amber-300">PIN TO BOARD</strong>, or drag highlighted fragments directly here.
            </p>
          </div>
        ) : viewMode === 'corkboard' ? (
          <WorkBoardCorkboardCanvas
            pins={board.pins}
            connections={board.connections}
            activeRelation={relationType}
            isExpanded={isExpanded}
            onMovePin={(pinId, x, y) => updateWorkBoardPinPosition(caseSlug, pinId, x, y)}
            onConnectPins={(fromId, toId, rel) =>
              connectWorkBoardPins(caseSlug, fromId, toId, rel)
            }
            onCycleConnectionRelation={(connId, nextRel) =>
              updateWorkBoardConnectionRelation(caseSlug, connId, nextRel)
            }
            onRemoveConnection={(connId) => removeWorkBoardConnection(caseSlug, connId)}
            onRemovePin={(pinId) => removeWorkBoardPin(caseSlug, pinId)}
            onUpdatePinTone={(pinId, tone) => updateWorkBoardPinTone(caseSlug, pinId, tone)}
            onAutoArrange={(canvasWidth) => autoArrangeWorkBoardPins(caseSlug, canvasWidth)}
            onDropExternalAt={(payload, x, y) =>
              addWorkBoardPin(caseSlug, {
                caseNumber,
                text: payload.text,
                sourceLabel: payload.sourceLabel,
                kind: payload.kind,
                tone: payload.tone,
                x,
                y,
              })
            }
          />
        ) : (
          board.pins.map((pin) => {
            const isLinkingSource = linkingFromId === pin.id;
            const isDropTarget = dropTargetPinId === pin.id;
            const cardConnections = board.connections.filter(
              (c) => c.fromPinId === pin.id || c.toPinId === pin.id
            );

            return (
              <div
                key={pin.id}
                draggable
                onDragStart={(e) => handlePinDragStart(e, pin)}
                onDragEnd={() => {
                  setDraggingPinId(null);
                  setDropTargetPinId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggingPinId !== pin.id) {
                    setDropTargetPinId(pin.id);
                  }
                }}
                onDragLeave={() => setDropTargetPinId(null)}
                onDrop={(e) => handleDropOnCard(e, pin)}
                onClick={() => handleCardClickForLink(pin.id)}
                className={`p-2.5 rounded border transition-all space-y-1.5 ${
                  TONE_CARD_STYLES[pin.tone] || TONE_CARD_STYLES.amber
                } ${isLinkingSource ? 'ring-2 ring-emerald-400' : ''} ${
                  isDropTarget ? 'ring-2 ring-amber-400 scale-[1.01]' : ''
                } ${linkingFromId && !isLinkingSource ? 'cursor-pointer hover:ring-1 hover:ring-amber-300' : ''}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1 min-w-0">
                    <GripVertical className="w-3 h-3 opacity-50 shrink-0 cursor-grab" />
                    <span className="text-[10px] font-bold text-amber-300 truncate">
                      {pin.sourceLabel}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {(['amber', 'emerald', 'red', 'cyan'] as WorkBoardTone[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateWorkBoardPinTone(caseSlug, pin.id, t);
                        }}
                        className={`w-2.5 h-2.5 rounded-full border ${TONE_DOT_STYLES[t]} ${
                          pin.tone === t ? 'ring-1 ring-white' : 'opacity-50 hover:opacity-100'
                        }`}
                        title={`Set card color: ${t}`}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playKeyClick();
                        setLinkingFromId((prev) => (prev === pin.id ? null : pin.id));
                      }}
                      className={`p-0.5 rounded ${
                        isLinkingSource
                          ? 'text-emerald-300 bg-emerald-950'
                          : 'text-zinc-400 hover:text-emerald-300'
                      }`}
                      title="Link this card to another piece of evidence (or drag onto target card)"
                    >
                      <Link2 className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playKeyClick();
                        removeWorkBoardPin(caseSlug, pin.id);
                      }}
                      className="p-0.5 text-zinc-400 hover:text-red-400"
                      title="Unpin fragment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] font-tech text-zinc-100 leading-relaxed whitespace-pre-wrap select-text">
                  {pin.text}
                </p>

                {/* Inline Connected Evidence Badges */}
                {cardConnections.length > 0 && (
                  <div className="pt-1.5 border-t border-black/35 space-y-1">
                    {cardConnections.map((conn) => {
                      const otherId =
                        conn.fromPinId === pin.id ? conn.toPinId : conn.fromPinId;
                      const other = pinLookup.get(otherId);
                      if (!other) return null;
                      const rel = RELATION_META[conn.relation] || RELATION_META.supports;
                      return (
                        <div
                          key={conn.id}
                          className="flex items-center justify-between gap-1 text-[9px] bg-black/40 px-1.5 py-0.5 rounded"
                        >
                          <div className="flex items-center space-x-1 min-w-0">
                            <span className={`px-1 rounded border font-bold shrink-0 ${rel.color}`}>
                              {rel.label}
                            </span>
                            <span className="text-zinc-300 truncate">{other.text}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeWorkBoardConnection(caseSlug, conn.id);
                            }}
                            className="text-zinc-500 hover:text-red-400 shrink-0"
                            title="Unlink"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-[#121722] border-t border-zinc-800 px-3 py-2.5 space-y-1.5">
        {syncNotice && (
          <div className="text-[10px] text-emerald-300 flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>{syncNotice}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={board.pins.length === 0}
            onClick={handleSyncBoard}
            className="retro-btn retro-btn-green text-[10px] px-2.5 py-1 flex items-center space-x-1 disabled:opacity-40"
            title="Push all Work Board fragments & links onto the full Case Evidence Board"
          >
            <Pin className="w-3 h-3" />
            <span>SYNC TO EVIDENCE BOARD</span>
          </button>

          {onOpenFullEvidenceBoard && (
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                onOpenFullEvidenceBoard();
              }}
              className="text-[10px] text-amber-400 hover:text-amber-200 underline"
            >
              OPEN FULL BOARD
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
        <div className="w-full max-w-6xl h-[88vh]">{panelContent}</div>
      </div>
    );
  }

  return panelContent;
};
