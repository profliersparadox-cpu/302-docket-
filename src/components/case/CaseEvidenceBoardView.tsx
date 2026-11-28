import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  Link as LinkIcon,
  RotateCcw,
  Save,
  CheckCircle2,
  Trash2,
  Info,
  Maximize2,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Sliders,
  GitBranch,
} from 'lucide-react';
import { CaseFile, EvidenceBoardItem, EvidenceConnection, MediaItem } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import {
  getEvidenceImage,
  hydrateBoardItemImage,
  PRESET_EXHIBIT_PLATES,
} from '../../data/exhibitImages.ts';
import {
  fetchAllMedia,
  uploadMediaFile,
  isImageMedia,
  MEDIA_UPDATED_EVENT,
} from '../../utils/mediaVault.ts';
import { RetroPhotoEditor } from '../common/RetroPhotoEditor.tsx';
import { GitHubBackupModal } from '../common/GitHubBackupModal.tsx';
import { recordLedgerEvent } from '../../utils/investigativeLedger.ts';

interface CaseEvidenceBoardViewProps {
  caseData: CaseFile;
}

function buildDefaultCaseBoardItems(caseData: CaseFile): EvidenceBoardItem[] {
  const items: EvidenceBoardItem[] = [];
  const startX = 48;
  const startY = 36;

  caseData.evidence.forEach((ev, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const resolved = getEvidenceImage(ev);
    items.push({
      id: `ev-${ev.id || idx}`,
      title: ev.title,
      itemType: (ev.type as any) || 'physical',
      status: ev.classification === 'Confidential' ? 'Forensic Theory' : 'Established Fact',
      x: startX + col * 265,
      y: startY + row * 265,
      snippet: ev.description,
      source: ev.significance,
      date: ev.recoveredAt,
      caseSlug: caseData.slug,
      caseNumber: caseData.caseNumber,
      tags: [ev.type, ev.classification],
      imageUrl: resolved.url,
      imageCaption: resolved.caption,
    });
  });

  const poiStartY = startY + Math.ceil(caseData.evidence.length / 3) * 265 + 16;
  caseData.personsOfInterest.slice(0, 3).forEach((poi, idx) => {
    const resolved = getEvidenceImage({
      id: poi.id,
      title: poi.name,
      itemType: 'suspect',
    });
    items.push({
      id: `poi-${poi.id || idx}`,
      title: `${poi.name} (${poi.role})`,
      itemType: 'suspect',
      status:
        poi.status === 'Convicted' || poi.status === 'Exonerated'
          ? 'Established Fact'
          : 'Documented Allegation',
      x: startX + idx * 265,
      y: poiStartY,
      snippet: poi.verifiedFindings || poi.background,
      source: poi.allegations || poi.outcome,
      caseSlug: caseData.slug,
      caseNumber: caseData.caseNumber,
      tags: [poi.role, poi.status],
      imageUrl: poi.imageUrl || resolved.url,
      imageCaption: `${poi.name} — ${poi.role}`,
    });
  });

  return items;
}

export const CaseEvidenceBoardView: React.FC<CaseEvidenceBoardViewProps> = ({ caseData }) => {
  const storageKey = `board_${caseData.slug}`;

  // Initialize board items (hydrating archival images on any older saved items)
  const [boardItems, setBoardItems] = useState<EvidenceBoardItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && parsed.items.length > 0) {
          return (parsed.items as EvidenceBoardItem[]).map(hydrateBoardItemImage);
        }
      }
    } catch (e) {
      console.warn('Error reading stored board', e);
    }
    return buildDefaultCaseBoardItems(caseData);
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

  // Uploaded case images from Media Vault
  const [vaultImages, setVaultImages] = useState<MediaItem[]>([]);

  useEffect(() => {
    let active = true;
    const loadVaultImages = async () => {
      try {
        const all = await fetchAllMedia(caseData.slug);
        if (active) {
          setVaultImages(all.filter((m) => isImageMedia(m)));
        }
      } catch {}
    };
    loadVaultImages();
    window.addEventListener(MEDIA_UPDATED_EVENT, loadVaultImages);
    return () => {
      active = false;
      window.removeEventListener(MEDIA_UPDATED_EVENT, loadVaultImages);
    };
  }, [caseData.slug]);

  // Interactive interaction states
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [selectedRelationType, setSelectedRelationType] = useState<'supports' | 'contradicts' | 'related to'>('supports');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<EvidenceBoardItem | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const boardRef = useRef<HTMLDivElement>(null);

  // New item modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<EvidenceBoardItem['itemType']>('document');
  const [newStatus, setNewStatus] = useState<EvidenceBoardItem['status']>('Established Fact');
  const [newSnippet, setNewSnippet] = useState<string>('');
  const [newSource, setNewSource] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newImageCaption, setNewImageCaption] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [editingBoardPhotoItem, setEditingBoardPhotoItem] = useState<EvidenceBoardItem | null>(null);
  const [isGitHubBackupOpen, setIsGitHubBackupOpen] = useState<boolean>(false);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent, item: EvidenceBoardItem) => {
    if (connectingFromId) {
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
        const fromCard = boardItems.find((b) => b.id === connectingFromId);
        recordLedgerEvent(caseData.slug, {
          caseNumber: caseData.caseNumber,
          category: 'connection',
          action: 'Linked Board Evidence',
          subject: `${fromCard?.title || 'Exhibit'} ↔ ${item.title}`,
          detail: `${selectedRelationType.toUpperCase()} link established on Evidence Board`,
          dedupeKey: `eb-conn-${connectingFromId}-${item.id}-${selectedRelationType}`,
        });
      }
      setConnectingFromId(null);
      return;
    }

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDraggingId(item.id);
    setDragOffset({
      x: e.clientX - boardRect.left - item.x,
      y: e.clientY - boardRect.top - item.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(boardRect.width - 250, e.clientX - boardRect.left - dragOffset.x));
    const newY = Math.max(10, Math.min(boardRect.height - 230, e.clientY - boardRect.top - dragOffset.y));

    setBoardItems((prev) =>
      prev.map((item) => (item.id === draggingId ? { ...item, x: newX, y: newY } : item))
    );
  };

  const handleMouseUp = (e: React.MouseEvent, clickedItem?: EvidenceBoardItem) => {
    if (draggingId && dragStartRef.current && clickedItem) {
      const dist = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);
      if (dist < 5) {
        soundEngine.playFileAccess();
        setSelectedItem(clickedItem);
      }
    }
    setDraggingId(null);
    dragStartRef.current = null;
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

    const items = buildDefaultCaseBoardItems(caseData);
    setBoardItems(items);
    setConnections([]);
    setConnectingFromId(null);
    setSelectedItem(null);
  };

  // Upload image file for new board card or existing inspected card
  const handleImageFileUpload = async (file: File, targetCardId?: string) => {
    setIsUploadingImage(true);
    setImageUploadError(null);
    try {
      const uploaded = await uploadMediaFile(file, {
        caseSlug: caseData.slug,
        caseNumber: caseData.caseNumber,
        title: newTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
        description: `Evidence Board photographic exhibit for ${caseData.title}`,
      });
      soundEngine.playBootBeep();

      if (targetCardId) {
        const nextItems = boardItems.map((it) =>
          it.id === targetCardId
            ? { ...it, imageUrl: uploaded.url, imageCaption: uploaded.title || file.name }
            : it
        );
        setBoardItems(nextItems);
        setSelectedItem((prev) =>
          prev && prev.id === targetCardId
            ? { ...prev, imageUrl: uploaded.url, imageCaption: uploaded.title || file.name }
            : prev
        );
        try {
          localStorage.setItem(storageKey, JSON.stringify({ items: nextItems, connections }));
        } catch {}
      } else {
        setNewImageUrl(uploaded.url);
        setNewImageCaption(uploaded.title || file.name);
      }
    } catch (err: any) {
      setImageUploadError(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Pin a Media Vault image directly onto the board
  const handlePinVaultImage = (media: MediaItem) => {
    soundEngine.playBootBeep();
    const newItem: EvidenceBoardItem = {
      id: `vault-img-${media.id}`,
      title: media.title || media.originalName,
      itemType: 'physical',
      status: 'Established Fact',
      x: 60 + ((boardItems.length % 3) * 260),
      y: 50 + (Math.floor(boardItems.length / 3) * 240),
      snippet: media.description || `Uploaded photographic exhibit (${media.originalName}).`,
      source: 'Case Media Vault Upload',
      date: media.uploadedAt.split('T')[0],
      caseSlug: caseData.slug,
      caseNumber: caseData.caseNumber,
      tags: ['Uploaded Photo', 'Exhibit'],
      imageUrl: media.url,
      imageCaption: media.title || media.originalName,
    };

    const deduped = boardItems.filter((b) => b.id !== newItem.id);
    const nextItems = [newItem, ...deduped];
    setBoardItems(nextItems);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ items: nextItems, connections }));
    } catch {}
    setSelectedItem(newItem);
  };

  // Add custom note / evidence to case board
  const handleAddNewItem = () => {
    if (!newTitle.trim() || !newSnippet.trim()) return;
    soundEngine.playKeyClick();
    const fallbackPlate = getEvidenceImage({
      title: newTitle.trim(),
      itemType: newType,
    });
    const newItem: EvidenceBoardItem = {
      id: `case-custom-${Date.now()}`,
      title: newTitle.trim(),
      itemType: newType,
      status: newStatus,
      x: 80 + Math.floor(Math.random() * 200),
      y: 70 + Math.floor(Math.random() * 140),
      snippet: newSnippet.trim(),
      source: newSource.trim() || 'Investigator Supplementary Clue',
      date: new Date().toISOString().split('T')[0],
      caseSlug: caseData.slug,
      caseNumber: caseData.caseNumber,
      tags: ['Field Note', newType],
      imageUrl: newImageUrl.trim() || fallbackPlate.url,
      imageCaption: newImageCaption.trim() || (newImageUrl.trim() ? newTitle.trim() : fallbackPlate.caption),
    };

    const nextItems = [newItem, ...boardItems];
    setBoardItems(nextItems);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ items: nextItems, connections }));
    } catch (e) {}
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewSnippet('');
    setNewSource('');
    setNewImageUrl('');
    setNewImageCaption('');
    setImageUploadError(null);
  };

  // Delete a board item
  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playKeyClick();
    const nextItems = boardItems.filter((it) => it.id !== id);
    const nextConns = connections.filter((c) => c.fromId !== id && c.toId !== id);
    setBoardItems(nextItems);
    setConnections(nextConns);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ items: nextItems, connections: nextConns }));
    } catch (e) {}
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
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
            <Pin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs font-tech text-zinc-400 tabular-nums">
              <span className="font-pixel text-[10px] text-emerald-400 font-bold uppercase">
                Evidence Pinboard
              </span>
              <span aria-hidden="true">&middot;</span>
              <span>
                {boardItems.length} Cards &middot; {connections.length} Links
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-editorial text-zinc-100">
              Visual Evidence Wall & Relational Connections
            </h3>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-tech">
          <div className="flex items-center space-x-1 bg-black/60 border border-zinc-800 p-1 rounded">
            <span className="text-[10px] font-pixel text-zinc-500 px-1">RELATION:</span>
            <button
              type="button"
              onClick={() => setSelectedRelationType('supports')}
              className={`px-2 py-0.5 rounded text-[10px] font-pixel border whitespace-nowrap shrink-0 ${
                selectedRelationType === 'supports'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              SUPPORTS
            </button>
            <button
              type="button"
              onClick={() => setSelectedRelationType('contradicts')}
              className={`px-2 py-0.5 rounded text-[10px] font-pixel border whitespace-nowrap shrink-0 ${
                selectedRelationType === 'contradicts'
                  ? 'bg-red-950 text-red-300 border-red-600 font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              CONTRADICTS
            </button>
            <button
              type="button"
              onClick={() => setSelectedRelationType('related to')}
              className={`px-2 py-0.5 rounded text-[10px] font-pixel border whitespace-nowrap shrink-0 ${
                selectedRelationType === 'related to'
                  ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              RELATED TO
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setIsAddModalOpen(true);
            }}
            className="retro-btn text-xs px-2.5 py-1.5 flex items-center space-x-1 border-amber-600 bg-amber-950/40 text-amber-300 font-bold hover:bg-amber-900/60 whitespace-nowrap shrink-0"
            title="Add note, evidence clue, or photograph to this case board"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>PIN PHOTO / CLUE</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setConnectingFromId(connectingFromId ? null : (boardItems[0]?.id || null));
            }}
            className={`retro-btn text-xs px-2.5 py-1.5 flex items-center space-x-1 whitespace-nowrap shrink-0 ${
              connectingFromId ? 'border-amber-500 text-amber-300 bg-amber-950/40' : ''
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{connectingFromId ? 'CLICK TARGET CARD...' : 'CONNECT CARDS'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBoard}
            className="retro-btn text-xs px-2.5 py-1.5 flex items-center space-x-1 border-emerald-700 text-emerald-300 hover:bg-emerald-950/60 whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE BOARD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setIsGitHubBackupOpen(true);
            }}
            className="retro-btn text-xs px-2.5 py-1.5 flex items-center space-x-1 border-emerald-600 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 whitespace-nowrap shrink-0"
            title="Back up edited photos & board layout to GitHub using your token"
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>GITHUB BACKUP</span>
          </button>

          <button
            type="button"
            onClick={handleResetBoard}
            className="retro-btn text-xs px-2 py-1.5 text-zinc-400 hover:text-red-400 whitespace-nowrap shrink-0"
            title="Reset positions and restore default exhibits"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="p-2.5 bg-emerald-950/70 border border-emerald-600 text-emerald-300 font-mono text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Evidence board layout, photographic exhibits, and links saved locally.</span>
        </div>
      )}

      {/* Uploaded Case Photos Quick Strip (if any uploaded images exist) */}
      {vaultImages.length > 0 && (
        <div className="p-2.5 bg-[#090d12] border border-zinc-800 rounded flex flex-wrap items-center gap-3 text-xs font-tech">
          <span className="text-amber-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Case Media Vault Photos ({vaultImages.length}):</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {vaultImages.map((img) => {
              const alreadyPinned = boardItems.some((b) => b.imageUrl === img.url);
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => handlePinVaultImage(img)}
                  className={`flex items-center gap-2 px-2 py-1 rounded border text-xs transition-colors ${
                    alreadyPinned
                      ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-amber-500'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.title || img.originalName}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 object-cover rounded border border-zinc-700"
                  />
                  <span className="max-w-[140px] truncate">{img.title || img.originalName}</span>
                  <span className="text-[10px] text-amber-400">
                    {alreadyPinned ? 'Pinned' : '+ Pin'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Help / Instructions Bar */}
      <div className="px-3 py-1.5 bg-black/60 border border-zinc-900 text-[11px] font-tech text-zinc-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-amber-500" />
          <span>
            Drag any exhibit card to rearrange, click to inspect full-size photograph &amp; notes, or connect two cards.
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
        onMouseUp={() => handleMouseUp({} as any)}
        className="retro-window relative min-h-[660px] h-[720px] w-full overflow-auto bg-[#06080a] select-none border-2 border-zinc-800"
        style={{
          backgroundImage:
            'radial-gradient(circle, #1a202c 1px, transparent 1px), linear-gradient(to right, #090c10 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* SVG Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {connections.map((conn, idx) => {
            const fromItem = boardItems.find((b) => b.id === conn.fromId);
            const toItem = boardItems.find((b) => b.id === conn.toId);
            if (!fromItem || !toItem) return null;

            const x1 = fromItem.x + 118;
            const y1 = fromItem.y + 95;
            const x2 = toItem.x + 118;
            const y2 = toItem.y + 95;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            const isSupports = conn.label === 'supports';
            const isContradicts = conn.label === 'contradicts';
            const strokeColor = isSupports ? '#10b981' : isContradicts ? '#ef4444' : '#f59e0b';
            const dashArray = isSupports ? '6 4' : isContradicts ? '3 3' : 'none';

            return (
              <g key={idx} className="cursor-pointer pointer-events-auto" onClick={() => handleDeleteConnection(conn)}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth="6"
                  strokeOpacity="0.2"
                />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeDasharray={dashArray}
                />
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

        {/* Draggable Photographic Evidence Cards */}
        {boardItems.map((item) => {
          const isDragging = draggingId === item.id;
          const isConnecting = connectingFromId === item.id;
          const isFact = item.status === 'Established Fact';
          const isSuspect = item.itemType === 'suspect';
          const isSelected = selectedItem?.id === item.id;

          return (
            <div
              key={item.id}
              onMouseDown={(e) => handleMouseDown(e, item)}
              onMouseUp={(e) => {
                e.stopPropagation();
                handleMouseUp(e, item);
              }}
              style={{
                transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
              }}
              className={`absolute top-0 left-0 w-[236px] rounded border transition-shadow cursor-grab active:cursor-grabbing z-20 ${
                isDragging
                  ? 'shadow-[0_0_24px_rgba(255,255,255,0.22)] border-zinc-400 z-30'
                  : isSelected
                  ? 'border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.45)] z-30'
                  : isConnecting
                  ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                  : isSuspect
                  ? 'border-red-900/80 bg-[#0d090a]'
                  : 'border-[#262c36] bg-[#0a0d11] hover:border-zinc-500'
              }`}
            >
              {/* Card Pin Head */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border border-red-300 shadow flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Card Content */}
              <div className="p-2.5 pt-3 space-y-2 font-mono text-xs">
                {/* Header Metadata */}
                <div className="flex items-center justify-between gap-1 text-[10px] font-tech">
                  <span className={isFact ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {isFact ? 'Fact' : 'Theory'} &middot; {item.itemType}
                  </span>
                  <div className="flex items-center space-x-1" onMouseDown={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playKeyClick();
                        setEditingBoardPhotoItem(item);
                      }}
                      className="text-zinc-400 hover:text-emerald-300 p-0.5"
                      title="Edit photograph in forensic darkroom"
                    >
                      <Sliders className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playFileAccess();
                        setSelectedItem(item);
                      }}
                      className="text-zinc-400 hover:text-amber-300 p-0.5"
                      title="Inspect photo and full exhibit dossier"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="text-zinc-500 hover:text-red-400 p-0.5"
                      title="Remove card from board"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Archival Photograph Print Strip */}
                {item.imageUrl && (
                  <div className="bg-zinc-950 border border-zinc-800 p-1 rounded-sm">
                    {!failedImages[item.id] ? (
                      <img
                        src={item.imageUrl}
                        alt={item.imageCaption || item.title}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                        className="w-full h-24 object-cover rounded-[1px]"
                      />
                    ) : (
                      <div className="h-24 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 text-[10px] gap-1">
                        <ImageIcon className="w-4 h-4" />
                        <span className="px-2 text-center truncate max-w-full">{item.title}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Title */}
                <h5 className="font-bold text-xs font-editorial text-zinc-100 line-clamp-2 leading-snug">
                  {item.title}
                </h5>

                {/* Snippet */}
                <p className="text-[11px] text-zinc-400 font-tech line-clamp-2 leading-relaxed">
                  {item.snippet}
                </p>

                {/* Source */}
                {item.source && (
                  <div className="text-[10px] font-tech text-zinc-500 truncate pt-1 border-t border-zinc-900">
                    {item.source}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Card & Exhibit Image Inspector Modal */}
        {selectedItem && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="retro-window bg-[#0b0f15] border-2 border-amber-500/80 max-w-xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="text-xs font-tech text-amber-400 font-bold flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>Exhibit Card Inspector &middot; {selectedItem.caseNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-zinc-400 hover:text-zinc-100 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedItem.imageUrl && (
                <div className="border border-zinc-800 bg-black rounded overflow-hidden">
                  {!failedImages[selectedItem.id] ? (
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.imageCaption || selectedItem.title}
                      referrerPolicy="no-referrer"
                      onError={() => setFailedImages((prev) => ({ ...prev, [selectedItem.id]: true }))}
                      className="w-full max-h-72 object-contain bg-black"
                    />
                  ) : (
                    <div className="h-44 flex flex-col items-center justify-center text-zinc-500 text-xs font-tech gap-1">
                      <ImageIcon className="w-5 h-5" />
                      <span>{selectedItem.imageCaption || selectedItem.title}</span>
                    </div>
                  )}
                  <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-800 text-[11px] font-tech text-zinc-400">
                    {selectedItem.imageCaption || 'Attached Evidence Exhibit Photograph'}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs font-tech text-zinc-400">
                  {selectedItem.status} &middot; {selectedItem.itemType}
                  {selectedItem.date ? ` · ${selectedItem.date}` : ''}
                </div>
                <h4 className="text-base font-bold font-editorial text-zinc-100">
                  {selectedItem.title}
                </h4>
                <p className="text-xs sm:text-sm font-tech text-zinc-300 leading-relaxed bg-black/50 p-3 border border-zinc-800 rounded">
                  {selectedItem.snippet}
                </p>
                <div className="text-xs font-tech text-amber-300">
                  <strong className="text-zinc-400">Source / Context:</strong> {selectedItem.source}
                </div>
              </div>

              {/* Replace / Edit / Attach Photo Directly onto Existing Card */}
              <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playKeyClick();
                      setEditingBoardPhotoItem(selectedItem);
                    }}
                    className="retro-btn text-xs px-3 py-1.5 flex items-center gap-1.5 border-amber-600 bg-amber-950/50 text-amber-200 hover:bg-amber-900/60"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit Photo</span>
                  </button>

                  <label className="retro-btn text-xs px-3 py-1.5 flex items-center gap-1.5 border-zinc-700 text-zinc-200 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isUploadingImage ? 'Uploading...' : 'Replace Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingImage}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageFileUpload(f, selectedItem.id);
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(selectedItem.id)}
                    className="retro-btn retro-btn-red text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="retro-btn text-xs px-3 py-1.5"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Case Evidence / Photo Clue */}
        {isAddModalOpen && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[#12161c] border-2 border-amber-500/80 rounded max-w-lg w-full p-5 shadow-[0_0_30px_rgba(245,158,11,0.25)] text-zinc-200 font-mono text-xs max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                <div className="flex items-center space-x-2">
                  <Pin className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-300 uppercase tracking-wider text-sm">
                    Pin Evidence / Photograph ({caseData.caseNumber})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-100 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 uppercase mb-1">
                    Exhibit Title / Evidence Label *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Tire Tread Cast or Hotel Phone Log"
                    className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 uppercase mb-1">
                      Evidence Category
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as EvidenceBoardItem['itemType'])}
                      className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1.5 rounded text-zinc-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="document">DOCUMENT</option>
                      <option value="forensic">FORENSIC</option>
                      <option value="physical">PHYSICAL</option>
                      <option value="statement">STATEMENT</option>
                      <option value="suspect">SUSPECT / POI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 uppercase mb-1">
                      Verification Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as EvidenceBoardItem['status'])}
                      className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1.5 rounded text-zinc-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Established Fact">Established Fact</option>
                      <option value="Documented Allegation">Documented Allegation</option>
                      <option value="Forensic Theory">Forensic Theory</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload / Preset / URL Attachment Section */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-400 font-bold uppercase flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Exhibit Photograph Attachment</span>
                    </span>
                    {newImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewImageUrl('');
                          setNewImageCaption('');
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >
                        Clear Image
                      </button>
                    )}
                  </div>

                  {imageUploadError && (
                    <div className="text-[11px] text-red-400">{imageUploadError}</div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded cursor-pointer flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isUploadingImage ? 'Uploading...' : 'Upload Photo (PNG/JPG/WEBP)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageFileUpload(f);
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">
                      Or select an archival exhibit plate{vaultImages.length > 0 ? ' / vault upload' : ''}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {vaultImages.map((vi) => (
                        <button
                          key={vi.id}
                          type="button"
                          onClick={() => {
                            setNewImageUrl(vi.url);
                            setNewImageCaption(vi.title || vi.originalName);
                          }}
                          className={`p-0.5 rounded border ${
                            newImageUrl === vi.url ? 'border-amber-400' : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                          title={vi.title || vi.originalName}
                        >
                          <img
                            src={vi.url}
                            alt={vi.title || vi.originalName}
                            referrerPolicy="no-referrer"
                            className="w-11 h-8 object-cover rounded-[1px]"
                          />
                        </button>
                      ))}
                      {PRESET_EXHIBIT_PLATES.map((plate) => (
                        <button
                          key={plate.id}
                          type="button"
                          onClick={() => {
                            setNewImageUrl(plate.url);
                            setNewImageCaption(plate.caption);
                          }}
                          className={`p-0.5 rounded border ${
                            newImageUrl === plate.url ? 'border-amber-400' : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                          title={plate.label}
                        >
                          <img
                            src={plate.url}
                            alt={plate.label}
                            referrerPolicy="no-referrer"
                            className="w-11 h-8 object-cover rounded-[1px]"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste /uploads/... or image URL"
                    className="w-full bg-black/80 border border-zinc-800 px-2.5 py-1 rounded text-zinc-200 focus:outline-none focus:border-amber-500"
                  />

                  {newImageUrl && (
                    <div className="border border-zinc-800 rounded overflow-hidden bg-black">
                      <img
                        src={newImageUrl}
                        alt={newImageCaption || 'Selected exhibit preview'}
                        referrerPolicy="no-referrer"
                        className="w-full h-28 object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 uppercase mb-1">
                    Source / Official Custodian
                  </label>
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="e.g. County Sheriff Evidence Locker"
                    className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 uppercase mb-1">
                    Details / Clue Information *
                  </label>
                  <textarea
                    rows={3}
                    value={newSnippet}
                    onChange={(e) => setNewSnippet(e.target.value)}
                    placeholder="Enter documented information, hypothesis, witness statement or field clue..."
                    className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded text-zinc-200 focus:outline-none focus:border-amber-500 leading-relaxed font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleAddNewItem}
                  disabled={!newTitle.trim() || !newSnippet.trim() || isUploadingImage}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-black font-bold rounded shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center space-x-1.5"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>PIN TO CASE BOARD</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Photo Darkroom Editor */}
      {editingBoardPhotoItem && (
        <RetroPhotoEditor
          isOpen={Boolean(editingBoardPhotoItem)}
          imageUrl={
            editingBoardPhotoItem.imageUrl ||
            getEvidenceImage(editingBoardPhotoItem).url ||
            PRESET_EXHIBIT_PLATES[0].url
          }
          initialTitle={editingBoardPhotoItem.imageCaption || editingBoardPhotoItem.title}
          initialDescription={editingBoardPhotoItem.snippet}
          caseSlug={caseData.slug}
          caseNumber={caseData.caseNumber}
          onClose={() => setEditingBoardPhotoItem(null)}
          onSaved={(savedMedia) => {
            const targetId = editingBoardPhotoItem.id;
            const nextItems = boardItems.map((it) =>
              it.id === targetId
                ? {
                    ...it,
                    imageUrl: savedMedia.url,
                    imageCaption: savedMedia.title || it.imageCaption,
                  }
                : it
            );
            setBoardItems(nextItems);
            setSelectedItem((prev) =>
              prev && prev.id === targetId
                ? {
                    ...prev,
                    imageUrl: savedMedia.url,
                    imageCaption: savedMedia.title || prev.imageCaption,
                  }
                : prev
            );
            setFailedImages((prev) => ({ ...prev, [targetId]: false }));
            try {
              localStorage.setItem(storageKey, JSON.stringify({ items: nextItems, connections }));
            } catch {}
          }}
          onOpenGitHubBackup={() => setIsGitHubBackupOpen(true)}
        />
      )}

      {/* GitHub Direct Token Backup Modal */}
      <GitHubBackupModal
        isOpen={isGitHubBackupOpen}
        onClose={() => setIsGitHubBackupOpen(false)}
        defaultCommitMessage={`302 Docket: Backup ${caseData.caseNumber} evidence photos & board`}
      />
    </div>
  );
};
