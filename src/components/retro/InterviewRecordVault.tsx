import React, { useState, useEffect } from 'react';
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
  Plus,
  Edit3,
  X,
  Save,
  Tag,
  Upload,
} from 'lucide-react';
import { InterviewRecord, TranscriptLine, MediaItem } from '../../types.ts';
import { archiveInterviewRecords } from '../../data/archiveVaultData.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { RetroAudioPlayer } from '../common/RetroAudioPlayer.tsx';
import {
  fetchAllMedia,
  uploadMediaFile,
  isAudioMedia,
  isVideoMedia,
  MEDIA_UPDATED_EVENT,
} from '../../utils/mediaVault.ts';

interface InterviewRecordVaultProps {
  onOpenCase?: (slug: string) => void;
}

const CASE_FILTERS = [
  { id: 'all', label: 'ALL CASES' },
  { id: '001', label: '#001 RAMSEY' },
  { id: '002', label: '#002 GSK' },
  { id: '003', label: '#003 PETITO' },
  { id: '004', label: '#004 LINDBERGH' },
  { id: '005', label: '#005 WETTERLING' },
  { id: '006', label: '#006 NASSAR' },
  { id: '007', label: '#007 EPSTEIN' },
];

const CASE_OPTIONS = [
  { slug: 'jonbenet-ramsey-boulder', number: 'CASE 001', label: 'CASE 001 — JonBenét Ramsey' },
  { slug: 'golden-state-killer-deangelo', number: 'CASE 002', label: 'CASE 002 — Golden State Killer' },
  { slug: 'gabby-petito-brian-laundrie', number: 'CASE 003', label: 'CASE 003 — Gabby Petito' },
  { slug: 'lindbergh-kidnapping-hauptmann', number: 'CASE 004', label: 'CASE 004 — Lindbergh Kidnapping' },
  { slug: 'jacob-wetterling-abduction', number: 'CASE 005', label: 'CASE 005 — Jacob Wetterling' },
  { slug: 'larry-nassar-msu-usag', number: 'CASE 006', label: 'CASE 006 — Larry Nassar & USAG' },
  { slug: 'epstein-maxwell-trafficking', number: 'CASE 007', label: 'CASE 007 — Epstein & Maxwell' },
  { slug: 'general-archive', number: 'GENERAL', label: 'GENERAL ARCHIVE EXHIBIT' },
];

const parseTranscriptToLines = (text?: string): TranscriptLine[] => {
  if (!text || !text.trim()) return [];
  const rawLines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return rawLines.map((line, i) => {
    const match = line.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.+)$/);
    if (match) {
      return {
        timestamp: match[1].trim(),
        speaker: match[2].trim().toUpperCase(),
        speakerRole: 'Recorded Audio Participant',
        text: match[3].trim(),
        isDirectQuote: true,
      };
    }
    const colonMatch = line.match(/^([A-Za-z0-9 _.-]{2,25}):\s*(.+)$/);
    if (colonMatch) {
      return {
        timestamp: `00:${(i * 15).toString().padStart(2, '0')}`,
        speaker: colonMatch[1].trim().toUpperCase(),
        speakerRole: 'Recorded Audio Participant',
        text: colonMatch[2].trim(),
        isDirectQuote: true,
      };
    }
    return {
      timestamp: `00:${(i * 15).toString().padStart(2, '0')}`,
      speaker: 'RECORDING TRANSCRIPT',
      speakerRole: 'Verbatim Audio Log',
      text: line,
      isDirectQuote: true,
    };
  });
};

export const InterviewRecordVault: React.FC<InterviewRecordVaultProps> = ({ onOpenCase }) => {
  const [uploadedAudioRecords, setUploadedAudioRecords] = useState<InterviewRecord[]>([]);
  const [uploadedAudioUrls, setUploadedAudioUrls] = useState<Record<string, string>>({});
  const [selectedRecordId, setSelectedRecordId] = useState<string>(archiveInterviewRecords[0].id);
  const [isPlayingTape, setIsPlayingTape] = useState(false);
  const [filterQuoteType, setFilterQuoteType] = useState<'all' | 'quotes_only' | 'summaries_only'>('all');
  const [activeCaseFilter, setActiveCaseFilter] = useState<string>('all');

  // Upload MP3 modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaseSlug, setUploadCaseSlug] = useState('jonbenet-ramsey-boulder');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTranscript, setUploadTranscript] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Custom transcript entries added by investigator
  const [customTranscripts, setCustomTranscripts] = useState<Record<string, TranscriptLine[]>>(() => {
    try {
      const saved = localStorage.getItem('docket_custom_transcripts');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  // Add transcript modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTimestamp, setNewTimestamp] = useState('00:15:30');
  const [newSpeaker, setNewSpeaker] = useState('');
  const [newRole, setNewRole] = useState('Witness / Examiner');
  const [newText, setNewText] = useState('');
  const [newIsQuote, setNewIsQuote] = useState(true);

  const loadUploadedAudio = async () => {
    try {
      const allMedia: MediaItem[] = await fetchAllMedia();
      const audioMedia = allMedia.filter((m) => isAudioMedia(m) || isVideoMedia(m));
      const urlMap: Record<string, string> = {};
      const recs: InterviewRecord[] = audioMedia.map((m) => {
        const recId = `audio-${m.id}`;
        urlMap[recId] = m.url;
        const lines = parseTranscriptToLines(m.transcript);
        if (lines.length === 0) {
          lines.push({
            timestamp: '00:00:00',
            speaker: 'ARCHIVE LOG',
            speakerRole: 'Audio Exhibit Metadata',
            text:
              m.description ||
              `Uploaded MP3/audio recording (${m.originalName}). Click "+ ADD TRANSCRIPT" above to transcribe spoken segments.`,
            isDirectQuote: false,
          });
        }
        return {
          id: recId,
          caseSlug: m.caseSlug || 'general-archive',
          caseNumber: m.caseNumber || 'CASE-AUDIO',
          title: m.title || m.originalName,
          interviewee: m.title || m.originalName,
          interviewer: 'Uploaded Case Audio Exhibit',
          date: m.uploadedAt.split('T')[0],
          location: `File: ${m.originalName} (${Math.round(m.size / 1024)} KB)`,
          recordingMedium: 'Magnetic Reel Audio',
          classification: 'Declassified FD-302',
          summary: m.description || `Uploaded audio exhibit (${m.originalName})`,
          transcripts: lines,
          sourceCitation: `Uploaded Archive Media • ${m.originalName}`,
        };
      });
      setUploadedAudioUrls(urlMap);
      setUploadedAudioRecords(recs);
    } catch (err) {
      console.warn('Failed to fetch uploaded audio for vault:', err);
    }
  };

  useEffect(() => {
    loadUploadedAudio();
    const handleUpdate = () => loadUploadedAudio();
    window.addEventListener(MEDIA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(MEDIA_UPDATED_EVENT, handleUpdate);
  }, []);

  const allRecords = [...uploadedAudioRecords, ...archiveInterviewRecords];
  const activeRecord = allRecords.find((r) => r.id === selectedRecordId) || allRecords[0];
  const activeAudioUrl = uploadedAudioUrls[activeRecord.id] || '';

  const togglePlayTape = () => {
    soundEngine.playKeyClick();
    setIsPlayingTape((prev) => !prev);
  };

  const handleSelectRecord = (id: string) => {
    soundEngine.playFileAccess();
    setSelectedRecordId(id);
    setIsPlayingTape(false);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      soundEngine.playKeyClick();
      const matchingCase = CASE_OPTIONS.find((c) => c.slug === uploadCaseSlug);
      const saved = await uploadMediaFile(uploadFile, {
        caseSlug: uploadCaseSlug,
        caseNumber: matchingCase?.number,
        title: uploadTitle.trim() || uploadFile.name,
        description: uploadDesc.trim(),
        transcript: uploadTranscript.trim(),
      });

      soundEngine.playBootBeep();
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDesc('');
      setUploadTranscript('');
      await loadUploadedAudio();
      setSelectedRecordId(`audio-${saved.id}`);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload MP3 audio file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTranscriptLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeaker.trim() || !newText.trim()) return;

    soundEngine.playKeyClick();
    const newLine: TranscriptLine = {
      timestamp: newTimestamp.trim() || '00:00:00',
      speaker: newSpeaker.trim().toUpperCase(),
      speakerRole: newRole.trim(),
      text: newText.trim(),
      isDirectQuote: newIsQuote,
    };

    const updatedMap = {
      ...customTranscripts,
      [activeRecord.id]: [...(customTranscripts[activeRecord.id] || []), newLine],
    };

    setCustomTranscripts(updatedMap);
    try {
      localStorage.setItem('docket_custom_transcripts', JSON.stringify(updatedMap));
    } catch (_) {}

    setIsAddModalOpen(false);
    setNewText('');
    setNewSpeaker('');
    soundEngine.playBootBeep();
  };

  // Combine static and custom transcripts
  const allTranscripts = [
    ...activeRecord.transcripts,
    ...(customTranscripts[activeRecord.id] || []),
  ];

  const filteredTranscripts = allTranscripts.filter((line) => {
    if (filterQuoteType === 'quotes_only') return line.isDirectQuote;
    if (filterQuoteType === 'summaries_only') return !line.isDirectQuote;
    return true;
  });

  const filteredRecords = allRecords.filter((rec) => {
    if (activeCaseFilter === 'all') return true;
    return rec.caseNumber.includes(activeCaseFilter);
  });

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0a0c10] text-zinc-300 font-tech select-none overflow-hidden">
      {/* Left Sidebar: Tape Selector Reel */}
      <div className="w-full md:w-84 bg-[#0f1217] border-b md:border-b-0 md:border-r border-[#262c36] flex flex-col shrink-0">
        <div className="p-3 border-b border-[#262c36] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-amber-400">
            <Mic className="w-4 h-4 text-red-500" />
            <span className="font-bold">FD-302 INTERVIEW VAULT</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {allRecords.length} REELS
          </span>
        </div>

        {/* Upload Audio Button */}
        <div className="p-2 border-b border-[#262c36] bg-[#0e1218]">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setIsUploadModalOpen(true);
            }}
            className="w-full py-1.5 px-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-200 text-xs font-mono font-bold rounded flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>+ UPLOAD AUDIO REEL (MP3)</span>
          </button>
        </div>

        {/* Vintage Cassette Tape Animation Deck */}
        <div className="p-3 bg-[#141820] border-b border-[#262c36] flex flex-col items-center">
          <div className="w-full h-24 bg-zinc-900 border-2 border-zinc-700 rounded-lg p-2.5 flex flex-col justify-between shadow-inner relative overflow-hidden">
            {/* Cassette label */}
            <div className="bg-amber-100/90 text-zinc-900 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase truncate border border-amber-300 flex items-center justify-between">
              <span className="truncate">TAPE REEL // {activeRecord.caseNumber}</span>
              <span className="text-[8px] text-zinc-700">
                {activeAudioUrl ? 'MP3 FILE' : activeRecord.recordingMedium.split(' ')[0]}
              </span>
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

            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
              <span>{activeAudioUrl ? 'DIRECT MP3 STREAM' : 'MAGNETIC TAPE BIAS: NORMAL'}</span>
              <span className={isPlayingTape ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                {isPlayingTape ? 'ROLLING [PLAY]' : 'READY'}
              </span>
            </div>
          </div>
        </div>

        {/* Case-Wise Filter Pills */}
        <div className="p-2 bg-[#0c0e12] border-b border-[#262c36] flex items-center space-x-1 overflow-x-auto text-[10px] font-mono">
          {CASE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveCaseFilter(f.id)}
              className={`px-2 py-0.5 rounded whitespace-nowrap ${
                activeCaseFilter === f.id
                  ? 'bg-amber-950 text-amber-300 border border-amber-600 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Record List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
          {filteredRecords.map((rec) => {
            const isSelected = rec.id === activeRecord.id;
            const isUploaded = Boolean(uploadedAudioUrls[rec.id]);
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
                  <span className="px-1.5 py-0.2 bg-red-950/80 text-red-300 border border-red-800 rounded font-bold">
                    {rec.caseNumber.split('-')[1] ? `CASE ${rec.caseNumber.split('-')[1]}` : rec.caseNumber}
                  </span>
                  {isUploaded ? (
                    <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded font-bold text-[9px]">
                      MP3 UPLOAD
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold">{rec.recordingMedium.split(' ')[0]}</span>
                  )}
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
              <div className="flex items-center space-x-2 text-[10px] font-mono mb-1">
                <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded font-bold uppercase">
                  {activeRecord.caseNumber}
                </span>
                <span className="text-zinc-500 uppercase tracking-widest">
                  {activeRecord.classification}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-editorial text-zinc-100">
                {activeRecord.title}
              </h2>
            </div>

            {/* Actions: Add Transcript & Quote Filter */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-xs font-mono rounded flex items-center space-x-1 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                title="Add new dialogue or witness statement to this audio reel"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ ADD TRANSCRIPT</span>
              </button>

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
          </div>

          {/* Metadata Badges */}
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

          <div className="text-[10px] font-mono text-zinc-500 flex items-center space-x-1 pt-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>ETHICAL MANDATE: No invented dialogue. Original citations strictly preserved.</span>
          </div>
        </div>

        {/* Embedded Audio Reel Player */}
        <div className="p-3 bg-black/70 border-b border-[#262c36]">
          <RetroAudioPlayer
            key={activeRecord.id}
            url={activeAudioUrl}
            title={activeRecord.title}
            caseNumber={activeRecord.caseNumber}
            transcript={allTranscripts.map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`).join('\n')}
            mediaType="audio"
            defaultDuration={240}
            compact
          />
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

                <div className="flex items-center space-x-2">
                  {/* Speaker Listen Button */}
                  <button
                    type="button"
                    onClick={() => soundEngine.speakTranscriptLine(line.text, line.speaker)}
                    title="Listen to this line via radio speech synthesizer"
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 rounded text-[9px] flex items-center space-x-1 border border-zinc-700 transition-colors"
                  >
                    <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                    <span>LISTEN</span>
                  </button>

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
            TRANSCRIPT SEGMENTS: {filteredTranscripts.length} OF {allTranscripts.length}
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

      {/* Modal: Add Custom Transcript Segment */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161f] border-2 border-emerald-500/80 rounded-lg max-w-md w-full p-5 shadow-2xl font-mono text-xs text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>APPEND AUDIO TRANSCRIPT ENTRY</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTranscriptLine} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                    Timestamp *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTimestamp}
                    onChange={(e) => setNewTimestamp(e.target.value)}
                    placeholder="00:15:30"
                    className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                    Dialogue Classification
                  </label>
                  <select
                    value={newIsQuote ? 'quote' : 'summary'}
                    onChange={(e) => setNewIsQuote(e.target.value === 'quote')}
                    className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1.5 rounded text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="quote">Direct Quote</option>
                    <option value="summary">Investigative Summary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Speaker Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={newSpeaker}
                  onChange={(e) => setNewSpeaker(e.target.value)}
                  placeholder="e.g. DETECTIVE / WITNESS / DEFENDANT"
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Speaker Professional Role
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Forensic Examiner / Case Agent"
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Spoken Dialogue / Testimony Transcript *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter the verbatim spoken words or documented witness account..."
                  className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!newSpeaker.trim() || !newText.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>SAVE TO REEL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload MP3 / Audio Reel */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161f] border-2 border-amber-500/80 rounded-lg max-w-md w-full p-5 shadow-2xl font-mono text-xs text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>UPLOAD AUDIO REEL TO INTERVIEW VAULT</span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              {uploadError && (
                <div className="p-2 bg-red-950/80 border border-red-600 text-red-300 rounded flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Select Audio File (MP3, WAV, M4A, MP4) *
                </label>
                <input
                  type="file"
                  required
                  accept="audio/*,video/*,.mp3,.mp4,.m4a,.wav,.ogg,.aac,.flac,.mpeg,.mpg"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      if (!uploadTitle) {
                        setUploadTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                      }
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-200 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:font-mono file:bg-amber-950 file:text-amber-300"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Assign Case Docket *
                </label>
                <select
                  value={uploadCaseSlug}
                  onChange={(e) => setUploadCaseSlug(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  {CASE_OPTIONS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Recording Title / Witness *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. 911 Emergency Call / Witness Deposition"
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                  Context &amp; Provenance
                </label>
                <input
                  type="text"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Admitted recording exhibit source..."
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-amber-400 uppercase mb-1">
                  Audio Transcript Lines (Optional)
                </label>
                <textarea
                  rows={4}
                  value={uploadTranscript}
                  onChange={(e) => setUploadTranscript(e.target.value)}
                  placeholder="[00:00] DISPATCH: State your emergency...&#10;[00:12] WITNESS: Please send police..."
                  className="w-full bg-zinc-950 border border-zinc-700 p-2 rounded text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'UPLOADING...' : 'MOUNT AUDIO REEL'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
