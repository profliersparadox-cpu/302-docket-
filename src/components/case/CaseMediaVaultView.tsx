import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  FileText,
  Image as ImageIcon,
  Radio,
  Clock,
  Shield,
  Download,
  Search,
  X,
  ExternalLink,
  Edit3,
  Save,
  CheckCircle,
  FileAudio,
} from 'lucide-react';
import { CaseFile, CaseMediaItem } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { archiveInterviewRecords } from '../../data/archiveVaultData.ts';

interface CaseMediaVaultViewProps {
  caseData: CaseFile;
}

export const CaseMediaVaultView: React.FC<CaseMediaVaultViewProps> = ({ caseData }) => {
  const [mediaList, setMediaList] = useState<CaseMediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<CaseMediaItem | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Audio player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [bufferProgress, setBufferProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Transcript state & modal
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Populate media items with case labels and authentic transcripts
  useEffect(() => {
    const list: CaseMediaItem[] = [];

    // Find authentic transcripts from archiveInterviewRecords matching this case
    const matchedRecord = archiveInterviewRecords.find(
      (r) => r.caseNumber === caseData.caseNumber || r.caseSlug === caseData.slug
    );

    const formattedTranscript = matchedRecord?.transcripts
      ? matchedRecord.transcripts.map((t) => `[${t.timestamp || '00:00'}] ${t.speaker}: ${t.text}`).join('\n\n')
      : undefined;

    // 1. Explicit case media items if attached via Investigator Access
    if (caseData.mediaItems && caseData.mediaItems.length > 0) {
      caseData.mediaItems.forEach((m) => {
        const customSaved = localStorage.getItem(`docket_audio_transcript_${m.id}`);
        list.push({
          ...m,
          caseNumber: caseData.caseNumber,
          caseSlug: caseData.slug,
          transcript: customSaved || m.transcript || (m.mediaType === 'audio' ? formattedTranscript : undefined),
        });
      });
    }

    // 2. Synthesize audio reels from case evidence
    const audioEvs = caseData.evidence.filter((e) => e.type === 'audio');
    if (audioEvs.length > 0) {
      audioEvs.forEach((ev, idx) => {
        const evId = `media-ev-${caseData.caseNumber}-${idx + 1}`;
        const customSaved = localStorage.getItem(`docket_audio_transcript_${evId}`);
        list.push({
          id: evId,
          title: ev.title,
          mediaType: 'audio',
          url: '',
          description: ev.description,
          source: ev.significance || 'State Police Communications Dispatch Recording',
          recoveredAt: ev.recoveredAt || `${caseData.year}-05-14`,
          duration: '03:42',
          classification: ev.classification || 'Admitted Prosecution Evidence',
          caseNumber: caseData.caseNumber,
          caseSlug: caseData.slug,
          transcript: customSaved || formattedTranscript,
        });
      });
    }

    // 3. Add emergency dispatch / interview reel if no audio yet
    if (list.filter((m) => m.mediaType === 'audio' || m.mediaType === 'recording').length === 0) {
      const defaultId = `media-wiretap-${caseData.caseNumber}-1`;
      const customSaved = localStorage.getItem(`docket_audio_transcript_${defaultId}`);
      list.unshift({
        id: defaultId,
        title: matchedRecord ? matchedRecord.title : `AUDIO DISPATCH & REEL // ${caseData.caseNumber}`,
        mediaType: 'recording',
        url: '',
        description: matchedRecord
          ? matchedRecord.summary
          : `Contemporaneous audio recording from emergency dispatch and investigative transmissions for ${caseData.title}.`,
        source: matchedRecord
          ? `Interviewee: ${matchedRecord.interviewee} | Interrogator: ${matchedRecord.interviewer}`
          : `${caseData.overview?.jurisdiction || 'Federal Field Office'} Dispatch Audio Archive`,
        recoveredAt: caseData.overview?.initialAlertDate || `${caseData.year}-06-22`,
        duration: '04:18',
        classification: 'Admitted Judicial Exhibit',
        caseNumber: caseData.caseNumber,
        caseSlug: caseData.slug,
        transcript: customSaved || formattedTranscript,
      });
    }

    // 4. Add image exhibits from evidence
    caseData.evidence.slice(0, 3).forEach((ev, idx) => {
      list.push({
        id: `media-img-${caseData.caseNumber}-${idx + 1}`,
        title: `FORENSIC DOCUMENT SCAN: ${ev.title.toUpperCase()}`,
        mediaType: 'image',
        url: ev.imageUrl || '',
        description: ev.description,
        source: `Exhibit ${ev.exhibitNumber || idx + 1} • Recovered by: ${ev.recoveredBy || 'Forensic Lab'}`,
        recoveredAt: ev.recoveredAt,
        classification: ev.classification,
        caseNumber: caseData.caseNumber,
        caseSlug: caseData.slug,
      });
    });

    setMediaList(list);
    if (list.length > 0 && !selectedMedia) {
      setSelectedMedia(list[0]);
    }
  }, [caseData]);

  // Audio simulation timer or HTML5 audio playback sync
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        if (audioRef.current && !audioRef.current.paused) {
          setCurrentTime(Math.floor(audioRef.current.currentTime));
          if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
            setDuration(Math.floor(audioRef.current.duration));
          }
        } else {
          setCurrentTime((prev) => {
            if (prev >= duration) {
              setIsPlaying(false);
              return 0;
            }
            return prev + 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, duration]);

  // Handle selecting an audio or media file
  const handleSelectMedia = (m: CaseMediaItem) => {
    soundEngine.playFileAccess();
    setSelectedMedia(m);
    setIsPlaying(false);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (m.mediaType === 'audio' || m.mediaType === 'recording' || m.mediaType === 'wiretap') {
      setIsLoadingAudio(true);
      setBufferProgress(0);

      let p = 0;
      const interval = setInterval(() => {
        p += 25;
        setBufferProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          setIsLoadingAudio(false);
        }
      }, 70);
    }
  };

  const togglePlay = () => {
    soundEngine.playKeyClick();
    if (audioRef.current && selectedMedia?.url) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(!isPlaying);
        });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOpenTranscriptModal = () => {
    soundEngine.playKeyClick();
    if (selectedMedia) {
      setTranscriptDraft(selectedMedia.transcript || '');
      setIsTranscriptModalOpen(true);
    }
  };

  const handleSaveTranscript = () => {
    soundEngine.playBootBeep();
    if (!selectedMedia) return;

    localStorage.setItem(`docket_audio_transcript_${selectedMedia.id}`, transcriptDraft);
    const updated = { ...selectedMedia, transcript: transcriptDraft };
    setSelectedMedia(updated);
    setMediaList((prev) => prev.map((item) => (item.id === selectedMedia.id ? updated : item)));

    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
      setIsTranscriptModalOpen(false);
    }, 900);
  };

  const filteredMedia = mediaList.filter((m) => {
    if (filterType !== 'all' && m.mediaType !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hidden real audio element for authentic audio playback */}
      {selectedMedia?.url && (
        <audio
          ref={audioRef}
          src={selectedMedia.url}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setDuration(Math.floor(audioRef.current.duration));
            }
          }}
          className="hidden"
        />
      )}

      {/* Header Bar with Case-Wise Label */}
      <div className="retro-window p-4 flex flex-wrap items-center justify-between gap-4 bg-[#080b0e]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-950/60 border border-amber-800 text-amber-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-amber-500 uppercase font-bold">
                PROSECUTORIAL AUDIO & MEDIA REPOSITORY
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1.5 text-emerald-400 border-emerald-700">
                CASE {caseData.caseNumber}
              </span>
              <span className="text-zinc-500 text-[10px] font-mono">
                {mediaList.length} ASSETS CATALOGED
              </span>
            </div>
            <h3 className="text-base font-bold font-editorial text-zinc-100">
              {caseData.caseNumber} // {caseData.title} Evidence Vault
            </h3>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/70 border border-zinc-800 text-xs font-tech text-zinc-200 pl-8 pr-3 py-1.5 rounded focus:border-amber-600 focus:outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-black/70 border border-zinc-800 text-xs font-tech text-zinc-300 px-2.5 py-1.5 rounded focus:border-amber-600 focus:outline-none"
          >
            <option value="all">ALL MEDIA ({mediaList.length})</option>
            <option value="audio">Audio / Recordings</option>
            <option value="image">Photographs / Scans</option>
          </select>
        </div>
      </div>

      {/* Main View Area: Selector list on left, Active Player/Viewer on right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Media Asset List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
              CATALOGED EVIDENCE SPOOLS
            </span>
            <span className="text-[10px] font-mono text-amber-500 font-bold">
              CASE {caseData.caseNumber}
            </span>
          </div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredMedia.map((m) => {
              const isSelected = selectedMedia?.id === m.id;
              const isAudio = m.mediaType === 'audio' || m.mediaType === 'recording';

              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMedia(m)}
                  className={`p-3 rounded border font-mono text-xs cursor-pointer transition-all flex flex-col space-y-1.5 ${
                    isSelected
                      ? 'bg-zinc-800 border-amber-500 text-zinc-100 font-bold shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                      : 'bg-[#090b0e] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber-400 uppercase font-pixel flex items-center">
                      {isAudio ? <Volume2 className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
                      {m.mediaType}
                    </span>
                    <span className="px-1.5 py-0.2 bg-zinc-900 border border-zinc-700 text-zinc-400 rounded text-[9px]">
                      {m.caseNumber || caseData.caseNumber}
                    </span>
                  </div>

                  <h5 className="font-bold text-xs text-zinc-100 line-clamp-1 font-editorial">
                    {m.title}
                  </h5>

                  <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>

                  {isAudio && m.transcript && (
                    <div className="flex items-center space-x-1 text-[9px] text-emerald-400 font-mono pt-1">
                      <FileText className="w-2.5 h-2.5 text-emerald-400" />
                      <span>TRANSCRIPT VERIFIED</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Media File Viewer */}
        <div className="md:col-span-2 retro-window p-6 bg-[#07090b] border-2 border-zinc-700 flex flex-col justify-between space-y-4">
          {selectedMedia ? (
            <>
              {/* Media Title & Classification */}
              <div className="border-b border-zinc-800 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="retro-stamp text-[8px] py-0 px-2 text-red-400 border-red-700">
                      {selectedMedia.classification || 'OFFICIAL EVIDENCE EXHIBIT'}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/80 text-amber-300 font-pixel text-[9px]">
                      CASE {selectedMedia.caseNumber || caseData.caseNumber}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold font-editorial text-zinc-100">
                    {selectedMedia.title}
                  </h4>
                </div>
                <div className="text-xs font-tech text-zinc-400 text-right">
                  <div>DATE: {selectedMedia.recoveredAt || caseData.year}</div>
                  <div>CASE: {caseData.caseNumber} ({caseData.title})</div>
                </div>
              </div>

              {/* AUDIO PLAYER VIEW */}
              {selectedMedia.mediaType === 'audio' ||
              selectedMedia.mediaType === 'recording' ||
              selectedMedia.mediaType === 'wiretap' ? (
                <div className="space-y-5 font-mono text-xs">
                  {/* Brief Loading Animation */}
                  {isLoadingAudio ? (
                    <div className="p-8 text-center space-y-3 bg-black/80 border border-zinc-800 rounded">
                      <div className="font-pixel text-xs text-amber-400 animate-pulse">
                        SPOOLING MAGNETIC TAPE CASSETTE... [{bufferProgress}%]
                      </div>
                      <div className="w-48 mx-auto h-2 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-100"
                          style={{ width: `${bufferProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Retro Reel-to-Reel Tape Deck Graphic */
                    <div className="p-6 bg-gradient-to-b from-[#14181f] to-[#0a0d12] border-2 border-zinc-700 rounded-lg shadow-2xl flex flex-col items-center justify-center space-y-5">
                      <div className="flex items-center justify-around w-full max-w-md">
                        {/* Left Reel */}
                        <div
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center relative shadow-inner ${
                            isPlaying ? 'animate-spin' : ''
                          }`}
                          style={{ animationDuration: '3s' }}
                        >
                          <div className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-zinc-400" />
                          </div>
                          <div className="absolute w-1 h-8 bg-zinc-600" />
                          <div className="absolute h-1 w-8 bg-zinc-600" />
                        </div>

                        {/* Center Tape Window */}
                        <div className="text-center font-mono space-y-1">
                          <span className="text-[10px] font-pixel text-emerald-400 block tracking-widest">
                            {isPlaying ? 'MAGNETIC TAPE RUNNING' : 'AUDIO DECK READY'}
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-amber-400 tracking-wider">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>

                        {/* Right Reel */}
                        <div
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center relative shadow-inner ${
                            isPlaying ? 'animate-spin' : ''
                          }`}
                          style={{ animationDuration: '3s' }}
                        >
                          <div className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-zinc-400" />
                          </div>
                          <div className="absolute w-1 h-8 bg-zinc-600" />
                          <div className="absolute h-1 w-8 bg-zinc-600" />
                        </div>
                      </div>

                      {/* Scrubber Progress Bar */}
                      <div className="w-full space-y-1">
                        <div
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickPos = (e.clientX - rect.left) / rect.width;
                            const newTime = Math.floor(clickPos * duration);
                            setCurrentTime(newTime);
                            if (audioRef.current) {
                              audioRef.current.currentTime = newTime;
                            }
                          }}
                          className="w-full bg-zinc-900 h-2 border border-zinc-800 rounded overflow-hidden cursor-pointer"
                        >
                          <div
                            className="bg-amber-500 h-full transition-all duration-150"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-pixel">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Playback Controls & Action */}
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => {
                            soundEngine.playKeyClick();
                            setCurrentTime(0);
                            if (audioRef.current) audioRef.current.currentTime = 0;
                          }}
                          title="Rewind to start"
                          className="retro-btn p-2"
                        >
                          <RotateCcw className="w-4 h-4 text-zinc-400" />
                        </button>

                        <button
                          onClick={togglePlay}
                          className="retro-btn px-6 py-2 border-amber-600 text-amber-300 font-pixel flex items-center space-x-2 text-xs hover:bg-amber-950/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-4 h-4" />
                              <span>PAUSE TAPE</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span>START PLAYBACK</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleOpenTranscriptModal}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono rounded flex items-center space-x-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{selectedMedia.transcript ? 'EDIT TRANSCRIPT' : '+ ADD TRANSCRIPT'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Audio Provenance & Context */}
                  <div className="p-3.5 bg-black/60 border border-zinc-800 rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[10px] text-amber-400 uppercase">
                        Audio Origin & Provenance Context
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        CASE: {caseData.caseNumber}
                      </span>
                    </div>
                    <p className="text-zinc-300 font-tech text-xs leading-relaxed">
                      {selectedMedia.description}
                    </p>
                    <div className="text-[10px] font-pixel text-zinc-500 pt-1 border-t border-zinc-900">
                      RECORD SOURCE: {selectedMedia.source}
                    </div>
                  </div>

                  {/* Audio Transcript Viewer Section */}
                  <div className="p-3.5 bg-black/80 border border-zinc-800 rounded space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                      <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>VERBATIM SPOKEN TRANSCRIPT // FD-302 DEPOSITION RECORD</span>
                      </div>
                      <button
                        onClick={handleOpenTranscriptModal}
                        className="px-2 py-0.5 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 font-mono rounded flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3 text-amber-400" />
                        <span>EDIT / UPDATE</span>
                      </button>
                    </div>

                    {selectedMedia.transcript ? (
                      <div className="max-h-48 overflow-y-auto bg-zinc-950 p-3 rounded border border-zinc-900 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed select-text">
                        {selectedMedia.transcript}
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-zinc-950/60 rounded border border-dashed border-zinc-800 space-y-2">
                        <p className="text-xs text-zinc-500 font-mono">
                          No written transcript attached to this audio spool yet.
                        </p>
                        <button
                          onClick={handleOpenTranscriptModal}
                          className="px-3 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-300 text-xs font-mono font-bold rounded"
                        >
                          + Add Spoken Audio Transcript
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* IMAGE / SCAN VIEW */
                <div className="space-y-4 font-mono text-xs">
                  <div className="min-h-[260px] max-h-[360px] bg-black/90 border border-zinc-800 rounded flex items-center justify-center p-4 relative overflow-hidden">
                    {selectedMedia.url ? (
                      <img
                        src={selectedMedia.url}
                        alt={selectedMedia.title}
                        className="max-h-full max-w-full object-contain filter grayscale contrast-125"
                      />
                    ) : (
                      <div className="text-center space-y-2 text-zinc-500">
                        <ImageIcon className="w-12 h-12 mx-auto opacity-30 text-zinc-400" />
                        <div className="font-pixel text-xs text-zinc-400">
                          SCANNED FORENSIC DOCUMENT ARCHIVE
                        </div>
                        <p className="text-[11px] font-tech text-zinc-500 max-w-sm">
                          Public criminal records filing authenticated under federal discovery rules for Case {caseData.caseNumber}.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 bg-black/60 border border-zinc-800 rounded space-y-1">
                    <span className="font-pixel text-[10px] text-zinc-400 uppercase block">
                      Exhibit Metadata & Chain of Custody
                    </span>
                    <p className="text-zinc-300 font-tech text-xs leading-relaxed">
                      {selectedMedia.description}
                    </p>
                    <div className="text-[10px] font-pixel text-zinc-500 pt-1 border-t border-zinc-900">
                      SOURCE: {selectedMedia.source}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-zinc-500 font-mono text-xs">
              No media asset selected.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Transcript Modal */}
      {isTranscriptModalOpen && selectedMedia && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#0d1117] border-2 border-amber-600 rounded-lg p-5 shadow-2xl space-y-4 font-mono text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <FileAudio className="w-4 h-4 text-amber-400" />
                <span>ATTACH AUDIO TRANSCRIPT // CASE {caseData.caseNumber}</span>
              </div>
              <button
                onClick={() => setIsTranscriptModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-zinc-400 text-xs">
                Asset: <span className="text-zinc-200 font-bold">{selectedMedia.title}</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Transcribe contemporaneous speech, interrogator exchanges, witness testimonies, or radio transmissions:
              </p>
            </div>

            <textarea
              rows={9}
              value={transcriptDraft}
              onChange={(e) => setTranscriptDraft(e.target.value)}
              placeholder="[00:00] DISPATCH: Boulder Police emergency dispatch...&#10;[00:14] WITNESS: We found a note on the back staircase..."
              className="w-full bg-black/80 border border-zinc-700 rounded p-3 text-xs text-zinc-200 font-mono focus:border-amber-500 focus:outline-none"
            />

            {saveSuccessNotice && (
              <div className="p-2 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded flex items-center space-x-2 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Transcript saved and cached to local archive!</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-mono">
                {transcriptDraft.length} characters
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTranscriptModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTranscript}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Transcript</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
