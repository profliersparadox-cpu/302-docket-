import React, { useState } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Shield,
  FileCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine.ts';
import { HighlightText } from '../../context/DocumentHighlightContext.tsx';

interface RetroPdfViewerProps {
  url: string;
  title: string;
  caseNumber?: string;
  classification?: string;
  date?: string;
  authorOrAgency?: string;
  description?: string;
  transcript?: string;
  sizeBytes?: number;
}

export const RetroPdfViewer: React.FC<RetroPdfViewerProps> = ({
  url,
  title,
  caseNumber = 'CASE-DOC',
  classification = 'OFFICIAL COURT RECORD',
  date,
  authorOrAgency = 'UNITED STATES DISTRICT COURT / CLERK OF RECORD',
  description,
  transcript,
  sizeBytes,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(Boolean(transcript || description));
  const [zoomLevel, setZoomLevel] = useState(100);
  const [loadError, setLoadError] = useState(false);

  const handleDownload = () => {
    soundEngine.playKeyClick();
    const a = document.createElement('a');
    a.href = url;
    a.download = title.endsWith('.pdf') ? title : `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenExternal = () => {
    soundEngine.playKeyClick();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleFullscreen = () => {
    soundEngine.playKeyClick();
    setIsFullscreen((prev) => !prev);
  };

  const formattedSize = sizeBytes ? `${Math.round(sizeBytes / 1024)} KB` : undefined;

  return (
    <div
      className={`flex flex-col bg-[#07090c] border-2 border-zinc-800 rounded text-zinc-300 font-tech shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-3 z-50 bg-[#07090c]' : 'w-full my-2'
      }`}
    >
      {/* Top 90s Docket Header */}
      <div className="bg-[#12161f] border-b border-[#2d333b] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-red-950/80 border border-red-700 text-red-400 rounded">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-red-400 font-bold tracking-wider">
                PDF DOCKET RECORD // {caseNumber}
              </span>
              <span className="px-1.5 py-0.2 bg-red-950 border border-red-600 text-red-300 text-[9px] font-pixel rounded uppercase">
                {classification}
              </span>
              {formattedSize && (
                <span className="text-[10px] font-mono text-zinc-500">[{formattedSize}]</span>
              )}
            </div>
            <h4 className="font-bold text-zinc-100 font-editorial text-sm truncate max-w-sm sm:max-w-md">
              {title}
            </h4>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-1.5">
          {(transcript || description) && (
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setShowNotesDrawer((prev) => !prev);
              }}
              className={`px-2 py-1 text-xs font-mono rounded flex items-center space-x-1 border transition-colors ${
                showNotesDrawer
                  ? 'bg-amber-950 border-amber-600 text-amber-300'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle Transcript & Judicial Notes"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">NOTES / TRANSCRIPT</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 rounded text-xs font-mono flex items-center space-x-1 transition-colors"
            title="Download PDF File"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">EXPORT PDF</span>
          </button>

          <button
            onClick={handleOpenExternal}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 rounded text-xs font-mono flex items-center space-x-1 transition-colors"
            title="Open in Native PDF Viewer Tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">POP-OUT</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-100 rounded transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen PDF'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
        {/* PDF Iframe Embed */}
        <div className="flex-1 relative bg-zinc-950 flex flex-col min-h-[460px]">
          {!loadError ? (
            <iframe
              src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full flex-1 border-none min-h-[460px] bg-zinc-900"
              title={title}
              onError={() => setLoadError(true)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <div className="font-pixel text-zinc-200 text-sm">PDF EMBED RESTRICTED IN IFRAME</div>
              <p className="text-xs font-mono text-zinc-400 max-w-md">
                Your browser prevented inline iframe rendering. You can view this PDF directly in full resolution.
              </p>
              <button
                onClick={handleOpenExternal}
                className="retro-btn px-4 py-2 text-xs font-mono flex items-center space-x-2 border-red-600 text-red-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span>OPEN DOCUMENT IN DEDICATED TAB</span>
              </button>
            </div>
          )}

          {/* Quick status footer bar inside PDF frame */}
          <div className="bg-[#0b0e13] border-t border-zinc-800 px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>PDF EMBED SECURED // ADOBE ACROBAT PROTOCOL 3.0</span>
            </div>
            <div>
              {authorOrAgency} {date ? `• ${date}` : ''}
            </div>
          </div>
        </div>

        {/* Optional Notes & Transcript Sidebar */}
        {showNotesDrawer && (transcript || description) && (
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 bg-[#0e1117] p-4 flex flex-col overflow-y-auto space-y-4">
            <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
              <span className="font-pixel text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                JUDICIAL TRANSCRIPTION & NOTES
              </span>
              <button
                onClick={() => setShowNotesDrawer(false)}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
              >
                [HIDE]
              </button>
            </div>

            {description && (
              <div className="space-y-1">
                <span className="text-[10px] font-pixel text-zinc-400 uppercase">
                  DOCKET SUMMARY:
                </span>
                <p className="text-xs text-zinc-300 font-mono leading-relaxed bg-black/50 p-2.5 border border-zinc-900 rounded">
                  <HighlightText text={description} />
                </p>
              </div>
            )}

            {transcript && (
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-pixel text-emerald-400 uppercase">
                  ATTACHED TRANSCRIPT EXCERPT:
                </span>
                <pre className="text-xs text-zinc-300 font-mono leading-relaxed bg-black/70 p-3 border border-zinc-900 rounded whitespace-pre-wrap overflow-y-auto max-h-72">
                  <HighlightText text={transcript} />
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
