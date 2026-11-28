import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Sliders,
  Square,
  PenTool,
  Type,
  Undo2,
  Trash2,
  Save,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GitBranch,
  Image as ImageIcon,
} from 'lucide-react';
import { MediaItem } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { uploadMediaFile, replaceMediaImage } from '../../utils/mediaVault.ts';

type EditorTool = 'crop' | 'redact' | 'highlight' | 'pen' | 'stamp';

interface RectAnnotation {
  kind: 'redact' | 'highlight';
  x: number; // normalized 0..1 of working canvas
  y: number;
  w: number;
  h: number;
}

interface PenAnnotation {
  kind: 'pen';
  points: Array<{ x: number; y: number }>; // normalized 0..1
  color: string;
}

interface StampAnnotation {
  kind: 'stamp';
  x: number; // normalized 0..1
  y: number;
  text: string;
}

type Annotation = RectAnnotation | PenAnnotation | StampAnnotation;

interface CropRegion {
  x: number; // normalized 0..1
  y: number;
  w: number;
  h: number;
}

interface RetroPhotoEditorProps {
  isOpen: boolean;
  imageUrl: string;
  initialTitle: string;
  initialDescription?: string;
  caseSlug: string;
  caseNumber: string;
  existingMediaId?: string;
  allowOverwrite?: boolean;
  onClose: () => void;
  onSaved: (savedMedia: MediaItem) => void;
  onOpenGitHubBackup?: () => void;
}

export const RetroPhotoEditor: React.FC<RetroPhotoEditorProps> = ({
  isOpen,
  imageUrl,
  initialTitle,
  initialDescription = '',
  caseSlug,
  caseNumber,
  existingMediaId,
  allowOverwrite = false,
  onClose,
  onSaved,
  onOpenGitHubBackup,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const [sourceUrl, setSourceUrl] = useState(imageUrl);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Transform & crop
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [draftCrop, setDraftCrop] = useState<CropRegion | null>(null);

  // Darkroom sliders
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [invert, setInvert] = useState(false);

  // Drawing / redaction tools
  const [activeTool, setActiveTool] = useState<EditorTool>('redact');
  const [penColor, setPenColor] = useState('#ef4444');
  const [stampText, setStampText] = useState(`EXHIBIT // ${caseNumber}`);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  // Save options
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [overwriteExisting, setOverwriteExisting] = useState(
    Boolean(allowOverwrite && existingMediaId && existingMediaId.startsWith('media-'))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedSuccessMedia, setSavedSuccessMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSourceUrl(imageUrl);
    setTitle(initialTitle);
    setDescription(initialDescription);
    setOverwriteExisting(
      Boolean(allowOverwrite && existingMediaId && existingMediaId.startsWith('media-'))
    );
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropRegion(null);
    setDraftCrop(null);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSepia(0);
    setInvert(false);
    setAnnotations([]);
    setActiveAnnotation(null);
    setSaveError(null);
    setSavedSuccessMedia(null);
  }, [isOpen, imageUrl, initialTitle, initialDescription, allowOverwrite, existingMediaId]);

  useEffect(() => {
    if (!isOpen || !sourceUrl) return;
    setImageLoaded(false);
    setLoadError(null);

    const img = new Image();
    if (!sourceUrl.startsWith('/') && !sourceUrl.startsWith('blob:') && !sourceUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      loadedImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      loadedImageRef.current = null;
      setLoadError('Could not load source image for canvas editing. You can upload a local image below.');
    };
    img.src = sourceUrl;
  }, [isOpen, sourceUrl]);

  const drawCanvas = (includeInteractiveOverlay = true) => {
    const canvas = canvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Render rotated/flipped base image onto offscreen canvas
    const isQuarterTurn = rotation === 90 || rotation === 270;
    const baseW = isQuarterTurn ? img.naturalHeight : img.naturalWidth;
    const baseH = isQuarterTurn ? img.naturalWidth : img.naturalHeight;

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, baseW);
    offscreen.height = Math.max(1, baseH);
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.save();
    offCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) invert(${invert ? 100 : 0}%)`;
    offCtx.translate(offscreen.width / 2, offscreen.height / 2);
    offCtx.rotate((rotation * Math.PI) / 180);
    offCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    offCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    offCtx.restore();

    // 2. Apply active crop region if committed
    const sx = cropRegion ? Math.round(cropRegion.x * offscreen.width) : 0;
    const sy = cropRegion ? Math.round(cropRegion.y * offscreen.height) : 0;
    const sw = cropRegion ? Math.max(16, Math.round(cropRegion.w * offscreen.width)) : offscreen.width;
    const sh = cropRegion ? Math.max(16, Math.round(cropRegion.h * offscreen.height)) : offscreen.height;

    canvas.width = sw;
    canvas.height = sh;
    ctx.clearRect(0, 0, sw, sh);
    ctx.drawImage(offscreen, sx, sy, sw, sh, 0, 0, sw, sh);

    // 3. Draw committed & active annotations
    const allAnn = activeAnnotation ? [...annotations, activeAnnotation] : annotations;
    for (const ann of allAnn) {
      if (ann.kind === 'redact') {
        ctx.fillStyle = '#050505';
        ctx.fillRect(ann.x * sw, ann.y * sh, ann.w * sw, ann.h * sh);
      } else if (ann.kind === 'highlight') {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = Math.max(3, Math.round(sw * 0.005));
        ctx.setLineDash([10, 6]);
        ctx.strokeRect(ann.x * sw, ann.y * sh, ann.w * sw, ann.h * sh);
        ctx.restore();
      } else if (ann.kind === 'pen' && ann.points.length > 1) {
        ctx.save();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = Math.max(3, Math.round(sw * 0.006));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x * sw, ann.points[0].y * sh);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x * sw, ann.points[i].y * sh);
        }
        ctx.stroke();
        ctx.restore();
      } else if (ann.kind === 'stamp' && ann.text.trim()) {
        ctx.save();
        const fontSize = Math.max(16, Math.round(sw * 0.032));
        ctx.font = `bold ${fontSize}px monospace`;
        const metrics = ctx.measureText(ann.text);
        const padX = fontSize * 0.45;
        const padY = fontSize * 0.3;
        const boxW = metrics.width + padX * 2;
        const boxH = fontSize + padY * 2;
        const rx = ann.x * sw - boxW / 2;
        const ry = ann.y * sh - boxH / 2;

        ctx.fillStyle = 'rgba(12, 10, 10, 0.78)';
        ctx.fillRect(rx, ry, boxW, boxH);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.1));
        ctx.strokeRect(rx, ry, boxW, boxH);
        ctx.fillStyle = '#fca5a5';
        ctx.textBaseline = 'middle';
        ctx.fillText(ann.text, rx + padX, ry + boxH / 2);
        ctx.restore();
      }
    }

    // 4. Draw transient crop preview box (not exported into final image)
    if (includeInteractiveOverlay && draftCrop) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, sw, sh);
      ctx.clearRect(draftCrop.x * sw, draftCrop.y * sh, draftCrop.w * sw, draftCrop.h * sh);
      ctx.drawImage(
        offscreen,
        sx + draftCrop.x * sw,
        sy + draftCrop.y * sh,
        draftCrop.w * sw,
        draftCrop.h * sh,
        draftCrop.x * sw,
        draftCrop.y * sh,
        draftCrop.w * sw,
        draftCrop.h * sh
      );
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = Math.max(2, Math.round(sw * 0.004));
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(draftCrop.x * sw, draftCrop.y * sh, draftCrop.w * sw, draftCrop.h * sh);
      ctx.restore();
    }
  };

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas(true);
    }
  }, [
    imageLoaded,
    rotation,
    flipH,
    flipV,
    cropRegion,
    draftCrop,
    brightness,
    contrast,
    saturation,
    sepia,
    invert,
    annotations,
    activeAnnotation,
  ]);

  if (!isOpen) return null;

  const getNormalizedCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded) return;
    const pt = getNormalizedCoords(e);

    if (activeTool === 'stamp') {
      soundEngine.playKeyClick();
      setAnnotations((prev) => [...prev, { kind: 'stamp', x: pt.x, y: pt.y, text: stampText }]);
      return;
    }

    dragOriginRef.current = pt;

    if (activeTool === 'crop') {
      setDraftCrop({ x: pt.x, y: pt.y, w: 0, h: 0 });
    } else if (activeTool === 'redact' || activeTool === 'highlight') {
      setActiveAnnotation({ kind: activeTool, x: pt.x, y: pt.y, w: 0, h: 0 });
    } else if (activeTool === 'pen') {
      setActiveAnnotation({ kind: 'pen', points: [pt], color: penColor });
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const origin = dragOriginRef.current;
    if (!origin) return;
    const pt = getNormalizedCoords(e);

    if (activeTool === 'crop') {
      setDraftCrop({
        x: Math.min(origin.x, pt.x),
        y: Math.min(origin.y, pt.y),
        w: Math.abs(pt.x - origin.x),
        h: Math.abs(pt.y - origin.y),
      });
    } else if (activeTool === 'redact' || activeTool === 'highlight') {
      setActiveAnnotation({
        kind: activeTool,
        x: Math.min(origin.x, pt.x),
        y: Math.min(origin.y, pt.y),
        w: Math.abs(pt.x - origin.x),
        h: Math.abs(pt.y - origin.y),
      });
    } else if (activeTool === 'pen') {
      setActiveAnnotation((prev) =>
        prev && prev.kind === 'pen' ? { ...prev, points: [...prev.points, pt] } : prev
      );
    }
  };

  const handlePointerUp = () => {
    if (!dragOriginRef.current) return;
    dragOriginRef.current = null;

    if (activeTool === 'crop' && draftCrop) {
      if (draftCrop.w < 0.03 || draftCrop.h < 0.03) {
        setDraftCrop(null);
      }
      return;
    }

    if (activeAnnotation) {
      if (
        (activeAnnotation.kind === 'redact' || activeAnnotation.kind === 'highlight') &&
        (activeAnnotation.w < 0.015 || activeAnnotation.h < 0.015)
      ) {
        setActiveAnnotation(null);
        return;
      }
      setAnnotations((prev) => [...prev, activeAnnotation]);
      setActiveAnnotation(null);
    }
  };

  const handleCommitCrop = () => {
    if (!draftCrop || draftCrop.w < 0.03 || draftCrop.h < 0.03) return;
    soundEngine.playKeyClick();
    if (cropRegion) {
      setCropRegion({
        x: cropRegion.x + draftCrop.x * cropRegion.w,
        y: cropRegion.y + draftCrop.y * cropRegion.h,
        w: draftCrop.w * cropRegion.w,
        h: draftCrop.h * cropRegion.h,
      });
    } else {
      setCropRegion(draftCrop);
    }
    setDraftCrop(null);
    setAnnotations([]);
  };

  const applyPreset = (preset: 'reset' | 'bw' | 'high_contrast' | 'warm' | 'negative') => {
    soundEngine.playKeyClick();
    if (preset === 'reset') {
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setSepia(0);
      setInvert(false);
    } else if (preset === 'bw') {
      setBrightness(102);
      setContrast(125);
      setSaturation(0);
      setSepia(10);
      setInvert(false);
    } else if (preset === 'high_contrast') {
      setBrightness(106);
      setContrast(160);
      setSaturation(85);
      setSepia(0);
      setInvert(false);
    } else if (preset === 'warm') {
      setBrightness(98);
      setContrast(118);
      setSaturation(75);
      setSepia(55);
      setInvert(false);
    } else if (preset === 'negative') {
      setBrightness(100);
      setContrast(115);
      setSaturation(100);
      setSepia(0);
      setInvert(true);
    }
  };

  const handleResetAll = () => {
    soundEngine.playKeyClick();
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropRegion(null);
    setDraftCrop(null);
    setAnnotations([]);
    applyPreset('reset');
  };

  const handleSaveEditedPhoto = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    setIsSaving(true);
    setSaveError(null);
    soundEngine.playKeyClick();

    try {
      // Draw cleanly without crop selection dashed box
      drawCanvas(false);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Could not export edited canvas image.'))),
          'image/png',
          0.95
        );
      });

      const safeSlug = (title || 'edited_exhibit')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '_')
        .slice(0, 40);
      const editedFile = new File([blob], `${safeSlug || 'exhibit'}_edited.png`, {
        type: 'image/png',
      });

      let saved: MediaItem;
      if (overwriteExisting && existingMediaId && existingMediaId.startsWith('media-')) {
        saved = await replaceMediaImage(existingMediaId, editedFile, {
          title: title.trim() || initialTitle,
          description: description.trim() || undefined,
        });
      } else {
        saved = await uploadMediaFile(editedFile, {
          caseSlug,
          caseNumber,
          title: title.trim() || `${initialTitle} (Edited)`,
          description:
            description.trim() || `Forensic darkroom edited exhibit (${caseNumber})`,
        });
      }

      soundEngine.playBootBeep();
      setSavedSuccessMedia(saved);
      onSaved(saved);
    } catch (err: any) {
      soundEngine.playWarning();
      setSaveError(
        err.message ||
          'Failed to export or save edited photo. If the source image is from an external domain blocking CORS, replace it with a local photo upload.'
      );
    } finally {
      drawCanvas(true);
      setIsSaving(false);
    }
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="retro-window bg-[#0a0d12] border-2 border-amber-500 max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#10151d] border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="font-pixel text-xs text-amber-300 uppercase">
              FORENSIC PHOTO DARKROOM &amp; REDACTION STUDIO
            </span>
            <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-zinc-300">
              {caseNumber}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1"
            title="Close photo editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Left / Center Canvas Preview */}
          <div className="lg:col-span-2 flex flex-col space-y-3">
            {/* Tool Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 p-2 rounded text-xs font-mono">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTool('redact')}
                  className={`px-2.5 py-1 rounded border flex items-center space-x-1 ${
                    activeTool === 'redact'
                      ? 'bg-red-950 border-red-600 text-red-200 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>REDACT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('highlight')}
                  className={`px-2.5 py-1 rounded border flex items-center space-x-1 ${
                    activeTool === 'highlight'
                      ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>HIGHLIGHT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('pen')}
                  className={`px-2.5 py-1 rounded border flex items-center space-x-1 ${
                    activeTool === 'pen'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>MARKER</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('stamp')}
                  className={`px-2.5 py-1 rounded border flex items-center space-x-1 ${
                    activeTool === 'stamp'
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-200 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>STAMP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('crop')}
                  className={`px-2.5 py-1 rounded border flex items-center space-x-1 ${
                    activeTool === 'crop'
                      ? 'bg-amber-900/70 border-amber-400 text-amber-200 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>CROP</span>
                </button>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setAnnotations((prev) => prev.slice(0, -1))}
                  disabled={annotations.length === 0}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded hover:border-zinc-600 disabled:opacity-40 flex items-center space-x-1"
                  title="Undo last mark"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>UNDO</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 rounded flex items-center space-x-1"
                  title="Reset all adjustments and marks"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>RESET</span>
                </button>
              </div>
            </div>

            {/* Active Tool Sub-bar */}
            {activeTool === 'crop' && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-950/30 border border-amber-800/70 px-3 py-2 rounded text-xs font-mono text-amber-200">
                <span>Drag across the image below to frame a crop region.</span>
                <div className="flex items-center space-x-2">
                  {draftCrop && (
                    <button
                      type="button"
                      onClick={handleCommitCrop}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded"
                    >
                      APPLY CROP
                    </button>
                  )}
                  {cropRegion && (
                    <button
                      type="button"
                      onClick={() => {
                        setCropRegion(null);
                        setDraftCrop(null);
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded"
                    >
                      RESET CROP
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTool === 'pen' && (
              <div className="flex items-center space-x-3 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded text-xs font-mono">
                <span className="text-zinc-400">Marker Ink:</span>
                {['#ef4444', '#f59e0b', '#10b981', '#ffffff'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setPenColor(col)}
                    style={{ backgroundColor: col }}
                    className={`w-5 h-5 rounded-full border-2 ${
                      penColor === col ? 'border-white scale-110' : 'border-zinc-700'
                    }`}
                  />
                ))}
              </div>
            )}

            {activeTool === 'stamp' && (
              <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded text-xs font-mono">
                <span className="text-zinc-400 shrink-0">Stamp Text (click photo to place):</span>
                <input
                  type="text"
                  value={stampText}
                  onChange={(e) => setStampText(e.target.value)}
                  className="flex-1 bg-black border border-zinc-700 px-2 py-1 rounded text-amber-300"
                />
              </div>
            )}

            {/* Canvas Frame */}
            <div className="flex-1 min-h-[340px] bg-black border border-zinc-800 rounded flex items-center justify-center p-3 overflow-hidden relative">
              {loadError ? (
                <div className="text-center space-y-3 max-w-md p-4">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-mono text-zinc-300">{loadError}</p>
                </div>
              ) : !imageLoaded ? (
                <div className="text-xs font-mono text-zinc-500 animate-pulse">
                  LOADING EXHIBIT FILM PLATE...
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  className="max-w-full max-h-[460px] object-contain cursor-crosshair border border-zinc-800 shadow-2xl"
                />
              )}
            </div>

            {/* Bottom Source Replace & Transform Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded text-xs font-mono">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (((r + 270) % 360) as 0 | 90 | 180 | 270))}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded hover:border-amber-500 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>-90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (((r + 90) % 360) as 0 | 90 | 180 | 270))}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded hover:border-amber-500 flex items-center space-x-1"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>+90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipH((v) => !v)}
                  className={`px-2 py-1 border rounded flex items-center space-x-1 ${
                    flipH
                      ? 'bg-amber-950 border-amber-500 text-amber-200'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>FLIP H</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV((v) => !v)}
                  className={`px-2 py-1 border rounded flex items-center space-x-1 ${
                    flipV
                      ? 'bg-amber-950 border-amber-500 text-amber-200'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>FLIP V</span>
                </button>
              </div>

              <label className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded cursor-pointer flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>LOAD DIFFERENT PHOTO</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const localUrl = URL.createObjectURL(f);
                      setSourceUrl(localUrl);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="bg-[#0d1117] border border-zinc-800 rounded p-4 flex flex-col justify-between space-y-4 font-mono text-xs">
            <div className="space-y-4">
              {/* Forensic Presets */}
              <div>
                <div className="flex items-center space-x-1.5 text-[10px] font-pixel text-amber-400 uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>FORENSIC FILTER PRESETS</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('reset')}
                    className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-200 text-[11px]"
                  >
                    Original
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('bw')}
                    className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-200 text-[11px]"
                  >
                    Archival B&amp;W
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('high_contrast')}
                    className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-200 text-[11px]"
                  >
                    High Contrast
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('warm')}
                    className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-200 text-[11px]"
                  >
                    Crime Lab Warm
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('negative')}
                    className="col-span-2 px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-200 text-[11px]"
                  >
                    Film Negative ({invert ? 'ON' : 'OFF'})
                  </button>
                </div>
              </div>

              {/* Exposure Sliders */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                    <span>Brightness</span>
                    <span className="text-amber-300">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={180}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                    <span>Contrast</span>
                    <span className="text-amber-300">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                    <span>Saturation</span>
                    <span className="text-amber-300">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={180}
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                    <span>Aged Sepia Tone</span>
                    <span className="text-amber-300">{sepia}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sepia}
                    onChange={(e) => setSepia(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                    Edited Exhibit Label
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black border border-zinc-700 px-2.5 py-1.5 rounded text-zinc-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                    Revision Notes
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Cropped/annotated forensic photo note..."
                    className="w-full bg-black border border-zinc-700 px-2.5 py-1.5 rounded text-zinc-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {allowOverwrite && existingMediaId && existingMediaId.startsWith('media-') && (
                  <label className="flex items-center space-x-2 text-[11px] text-zinc-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={overwriteExisting}
                      onChange={(e) => setOverwriteExisting(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span>Overwrite existing archived photo file</span>
                  </label>
                )}
              </div>
            </div>

            {/* Save Status & Actions */}
            <div className="space-y-2.5 pt-3 border-t border-zinc-800">
              {saveError && (
                <div className="p-2 bg-red-950/80 border border-red-700 text-red-200 rounded text-[11px] flex items-start space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}

              {savedSuccessMedia && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-600 text-emerald-200 rounded text-[11px] space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Edited photo saved to case vault!</span>
                  </div>
                  {onOpenGitHubBackup && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenGitHubBackup();
                      }}
                      className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-black font-bold rounded flex items-center justify-center space-x-1.5"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>BACKUP EDITED PHOTO TO GITHUB</span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded"
                >
                  {savedSuccessMedia ? 'DONE' : 'CANCEL'}
                </button>
                <button
                  type="button"
                  disabled={!imageLoaded || isSaving}
                  onClick={handleSaveEditedPhoto}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'SAVING PHOTO...' : 'SAVE EDITED PHOTO'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
