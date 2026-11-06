import React, { useState } from 'react';
import {
  Mic,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  FileText,
  User,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { InterviewRecord, TranscriptLine } from '../../types.ts';
import { archiveInterviewRecords } from '../../data/archiveVaultData.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface InterviewRecordVaultProps {
  onOpenCase?: (slug: string) => void;
}

export const InterviewRecordVault: React.FC<InterviewRecordVaultProps> = ({ onOpenCase }) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(archiveInterviewRecords[0].id);
  const [isPlayingTape, setIsPlayingTape] = useState(false);
  const [typewriterProgress, setTypewriterProgress] = useState(100);
  const [filterQuoteType, setFilterQuoteType] = useState<'all' | 'quotes_only' | 'summaries_only'>('all');

  const activeRecord = archiveInterviewRecords.find((r) => r.id === selectedRecordId) || archiveInterviewRecords[0];

  const togglePlayTape = () => {
    soundEngine.playKeyClick();
    setIsPlayingTape((prev) => !prev);
  };

  const handleSelectRecord = (id: string) => {
    soundEngine.playFileAccess();
    setSelectedRecordId(id);
    setIsPlayingTape(false);
  };

  const filteredTranscripts = activeRecord.transcripts.filter((line) => {
    if (filterQuoteType === 'quotes_only') return line.isDirectQuote;
    if (filterQuoteType === 'summaries_only') return !line.isDirectQuote;
    return true;
  });

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0a0c10] text-zinc-300 font-tech select-none overflow-hidden">
      {/* Left Sidebar: Tape Selector Reel */}
      <div className="w-full md:w-80 bg-[#0f1217] border-b md:border-b-0 md:border-r border-[#262c36] flex flex-col">
        <div className="p-3 border-b border-[#262c36] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-amber-400">
            <Mic className="w-4 h-4 text-red-500" />
            <span className="font-bold">FD-302 INTERVIEW VAULT</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {archiveInterviewRecords.length} ARCHIVES
          </span>
        </div>

        {/* Vintage Cassette Tape Animation Deck */}
        <div className="p-4 bg-[#141820] border-b border-[#262c36] flex flex-col items-center">
          <div className="w-full h-24 bg-zinc-900 border-2 border-zinc-700 rounded-lg p-2.5 flex flex-col justify-between shadow-inner relative overflow-hidden">
            {/* Cassette label */}
            <div className="bg-amber-100/90 text-zinc-900 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase truncate border border-amber-300">
              AUDIO TAPE REEL // {activeRecord.recordingMedium}
            </div>

            {/* Tape spools */}
            <div className="flex items-center justify-around py-1">
              <div
                className={`w-9 h-9 rounded-full border-4 border-zinc-600 bg-zinc-800 flex items-center justify-center ${
                  isPlayingTape ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '3s' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
              </div>

              {/* Tape window */}
              <div className="w-20 h-6 bg-zinc-950/80 border border-zinc-700 rounded flex items-center justify-center space-x-0.5">
                {[4, 8, 14, 18, 12, 16, 6, 10].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-red-500 transition-all ${isPlayingTape ? 'opacity-90' : 'opacity-20'}`}
                    style={{ height: isPlayingTape ? `${Math.sin(i + Date.now()) * 6 + 10}px` : '4px' }}
                  />
                ))}
              </div>

              <div
                className={`w-9 h-9 rounded-full border-4 border-zinc-600 bg-zinc-800 flex items-center justify-center ${
                  isPlayingTape ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '3s' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
              </div>
            </div>

            {/* Counter */}
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
              <span>INDEX: 0492</span>
              <span className="text-emerald-400 font-bold">{isPlayingTape ? 'PLAYING' : 'READY'}</span>
            </div>
          </div>

          {/* Tape Controls */}
          <div className="flex items-center justify-center space-x-2 mt-3 w-full">
            <button
              onClick={togglePlayTape}
              className="flex-1 py-1 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 font-mono text-xs rounded flex items-center justify-center space-x-1.5 transition-colors"
            >
              {isPlayingTape ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPlayingTape ? 'PAUSE PLAYBACK' : 'PLAY REEL'}</span>
            </button>
          </div>
        </div>

        {/* Record List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
          {archiveInterviewRecords.map((rec) => {
            const isSelected = rec.id === activeRecord.id;
            return (
              <button
                key={rec.id}
                onClick={() => handleSelectRecord(rec.id)}
                className={`w-full p-3 text-left transition-colors flex flex-col space-y-1 ${
                  isSelected
                    ? 'bg-zinc-800/90 border-l-4 border-amber-500'
                    : 'hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500 uppercase">{rec.caseNumber}</span>
                  <span className="text-amber-400 font-bold">{rec.recordingMedium.split(' ')[0]}</span>
                </div>
                <div className="text-xs font-bold text-zinc-200 line-clamp-1 font-mono">
                  {rec.interviewee}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {rec.location}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content Area: Transcript Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {/* Record Header Strip */}
        <div className="p-4 bg-[#11141b] border-b border-[#262c36] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block">
                {activeRecord.classification}
              </span>
              <h2 className="text-base sm:text-lg font-bold font-editorial text-zinc-100">
                {activeRecord.title}
              </h2>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1 bg-zinc-900 p-1 border border-zinc-800 rounded text-[10px] font-mono">
              <button
                onClick={() => setFilterQuoteType('all')}
                className={`px-2 py-0.5 rounded ${
                  filterQuoteType === 'all' ? 'bg-zinc-800 text-phosphor' : 'text-zinc-500'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setFilterQuoteType('quotes_only')}
                className={`px-2 py-0.5 rounded ${
                  filterQuoteType === 'quotes_only' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500'
                }`}
              >
                DIRECT QUOTES
              </button>
              <button
                onClick={() => setFilterQuoteType('summaries_only')}
                className={`px-2 py-0.5 rounded ${
                  filterQuoteType === 'summaries_only' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-500'
                }`}
              >
                SUMMARIES
              </button>
            </div>
          </div>

          {/* Metadata pill badges */}
          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-zinc-400 pt-1">
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
              INTERVIEWEE: <strong className="text-zinc-200">{activeRecord.interviewee}</strong>
            </span>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
              DATE: <strong className="text-zinc-200">{activeRecord.date}</strong>
            </span>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
              VENUE: <strong className="text-zinc-200">{activeRecord.location}</strong>
            </span>
          </div>

          {/* Constitution Guarantee */}
          <div className="text-[10px] font-mono text-zinc-500 flex items-center space-x-1 pt-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>ETHICAL MANDATE: No invented dialogue. Original citations strictly preserved.</span>
          </div>
        </div>

        {/* Transcript Dialogue Scroll Window */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-mono text-xs">
          {filteredTranscripts.map((line, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded border transition-all ${
                line.isDirectQuote
                  ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  : 'bg-amber-950/20 border-amber-900/50'
              }`}
            >
              {/* Speaker Header */}
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-zinc-800/80">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded">
                    {line.timestamp}
                  </span>
                  <span
                    className={`font-bold tracking-wide uppercase ${
                      line.isDirectQuote ? 'text-zinc-200' : 'text-amber-400'
                    }`}
                  >
                    {line.speaker}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    ({line.speakerRole})
                  </span>
                </div>

                {/* Badge: Direct Quote vs Summary */}
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider ${
                    line.isDirectQuote
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {line.isDirectQuote ? 'VERIFIED DIRECT QUOTE' : 'OFFICIAL INVESTIGATIVE SUMMARY'}
                </span>
              </div>

              {/* Spoken Text */}
              <p
                className={`leading-relaxed text-sm ${
                  line.isDirectQuote
                    ? 'font-typewriter text-zinc-200 pl-2 border-l-2 border-emerald-600'
                    : 'text-zinc-300 font-mono italic pl-2 border-l-2 border-amber-600'
                }`}
              >
                {line.isDirectQuote ? `"${line.text}"` : line.text}
              </p>

              {line.editorialNote && (
                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  [NOTE: {line.editorialNote}]
                </div>
              )}
            </div>
          ))}

          {/* Citation Box */}
          <div className="mt-6 p-3 bg-zinc-900/60 border border-zinc-800 rounded text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-500 block text-[9px] uppercase">
              ARCHIVE SOURCE CITATION:
            </span>
            <span className="text-amber-300">{activeRecord.sourceCitation}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#0d1015] border-t border-[#262c36] flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500 text-[11px]">
            TRANSCRIPT SEGMENTS: {filteredTranscripts.length} OF {activeRecord.transcripts.length}
          </span>
          {onOpenCase && activeRecord.caseSlug && (
            <button
              onClick={() => onOpenCase(activeRecord.caseSlug)}
              className="px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-mono rounded flex items-center space-x-1"
            >
              <span>INSPECT CASE DOSSIER</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
