import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FileAudio,
  Download,
  Repeat,
  Rewind,
  FastForward,
  FileText,
  Radio,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { CaseFile, CaseMediaItem, MediaItem } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';
import { fetchAllMedia, isAudioMedia, MEDIA_UPDATED_EVENT } from '../../utils/mediaVault.ts';

interface AudioEvidenceProps {
  caseData: CaseFile;
}

interface Mp3Track {
  id: string;
  title: string;
  url: string;
  source: string;
  description: string;
  classification: string;
  recoveredAt?: string;
  transcript?: string;
  fileSizeLabel?: string;
}

const WAVEFORM_BAR_COUNT = 72;

export function isMp3Asset(item: {
  url?: string;
  externalUrl?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  title?: string;
}): boolean {
  const mime = (item.mimeType || '').toLowerCase();
  if (mime === 'audio/mpeg' || mime === 'audio/mp3') return true;

  const candidates = [item.url, item.externalUrl, item.filename, item.originalName, item.title];
  return candidates.some((val) => {
    if (!val) return false;
    const clean = val.split('?')[0].split('#')[0].trim().toLowerCase();
    return clean.endsWith('.mp3');
  });
}

function buildFallbackPeaks(seedStr: string, count = WAVEFORM_BAR_COUNT): number[] {
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    const norm = ((hash >>> 0) % 1000) / 1000;
    const envelope = Math.sin(((i + 1) / (count + 1)) * Math.PI);
    const val = 0.16 + (0.28 + norm * 0.56) * (0.45 + 0.55 * envelope);
    peaks.push(Math.min(1, Math.max(0.14, val)));
  }
  return peaks;
}

function formatClock(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const AudioEvidence: React.FC<AudioEvidenceProps> = ({ caseData }) => {
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isLooping, setIsLooping] = useState(false);
  const [peaks, setPeaks] = useState<number[]>(() => buildFallbackPeaks(caseData.slug));
  const [isDecodingWaveform, setIsDecodingWaveform] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      try {
        const items = await fetchAllMedia(caseData.slug);
        if (active) setUploadedMedia(items);
      } catch {
        // Non-fatal fallback
      }
    };
    sync();
    window.addEventListener(MEDIA_UPDATED_EVENT, sync);
    return () => {
      active = false;
      window.removeEventListener(MEDIA_UPDATED_EVENT, sync);
    };
  }, [caseData.slug]);

  // Detect all .mp3 tracks across caseData.mediaItems, uploaded case media, and evidence URLs
  const mp3Tracks: Mp3Track[] = useMemo(() => {
    const tracks: Mp3Track[] = [];
    const seenUrls = new Set<string>();
    const seenIds = new Set<string>();

    const addTrack = (t: Mp3Track) => {
      const urlKey = t.url.trim().toLowerCase();
      if (!t.url || seenIds.has(t.id) || (urlKey && seenUrls.has(urlKey))) return;
      seenIds.add(t.id);
      if (urlKey) seenUrls.add(urlKey);
      tracks.push(t);
    };

    // 1. Uploaded audio items for this case (.mp3, .wav, .m4a, .ogg, etc.)
    uploadedMedia
      .filter((m) => (isMp3Asset(m) || isAudioMedia(m)) && Boolean(m.url))
      .forEach((m) => {
        const savedTranscript = localStorage.getItem(`docket_audio_transcript_${m.id}`);
        addTrack({
          id: m.id,
          title: m.title || m.originalName,
          url: m.url,
          source: `Uploaded Case Audio (${m.originalName})`,
          description:
            m.description || `MP3 evidentiary recording logged under ${caseData.caseNumber}.`,
          classification: 'MP3 AUDIO EVIDENCE',
          recoveredAt: m.uploadedAt?.split('T')[0],
          transcript: savedTranscript || m.transcript,
          fileSizeLabel: m.size ? `${Math.round(m.size / 1024)} KB` : undefined,
        });
      });

    // 2. Explicit caseData.mediaItems array
    (caseData.mediaItems || [])
      .filter((m: CaseMediaItem) => isMp3Asset(m) && Boolean(m.url || m.externalUrl))
      .forEach((m) => {
        const savedTranscript = localStorage.getItem(`docket_audio_transcript_${m.id}`);
        addTrack({
          id: m.id,
          title: m.title,
          url: m.url || m.externalUrl || '',
          source: m.source || 'Case Media Archive',
          description: m.description || 'Cataloged MP3 audio exhibit.',
          classification: m.classification || 'MP3 AUDIO EVIDENCE',
          recoveredAt: m.recoveredAt,
          transcript: savedTranscript || m.transcript,
        });
      });

    // 3. Any evidence item referencing an .mp3 file
    (caseData.evidence || [])
      .filter((ev) => ev.imageUrl && isMp3Asset({ url: ev.imageUrl, title: ev.title }))
      .forEach((ev, idx) => {
        addTrack({
          id: `ev-mp3-${ev.id || idx}`,
          title: ev.title,
          url: ev.imageUrl || '',
          source: ev.recoveredBy || 'Evidence Archive',
          description: ev.description,
          classification: ev.classification || 'EXHIBIT AUDIO',
          recoveredAt: ev.recoveredAt,
          transcript: ev.redactedSnippet,
        });
      });

    return tracks;
  }, [caseData, uploadedMedia]);

  const activeTrack = mp3Tracks.find((t) => t.id === selectedTrackId) || mp3Tracks[0] || null;

  // Keep selectedTrackId aligned when tracks update
  useEffect(() => {
    if (mp3Tracks.length > 0 && !mp3Tracks.some((t) => t.id === selectedTrackId)) {
      setSelectedTrackId(mp3Tracks[0].id);
    }
  }, [mp3Tracks, selectedTrackId]);

  // Decode actual MP3 waveform peaks via Web Audio API with deterministic fallback
  useEffect(() => {
    if (!activeTrack) return;
    let cancelled = false;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioError(null);
    setPeaks(buildFallbackPeaks(activeTrack.id + activeTrack.url));

    const decodePeaks = async () => {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx || !activeTrack.url) return;
      setIsDecodingWaveform(true);
      let ctx: AudioContext | null = null;
      try {
        const res = await fetch(activeTrack.url);
        if (!res.ok) throw new Error('Audio fetch error');
        const buffer = await res.arrayBuffer();
        ctx = new AudioCtx();
        const audioBuffer = await ctx.decodeAudioData(buffer);
        if (cancelled) return;

        const channelData = audioBuffer.getChannelData(0);
        const blockSize = Math.max(1, Math.floor(channelData.length / WAVEFORM_BAR_COUNT));
        const computed: number[] = [];
        let maxPeak = 0.01;

        for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
          const start = i * blockSize;
          const end = Math.min(channelData.length, start + blockSize);
          let sumSq = 0;
          for (let j = start; j < end; j++) {
            const sample = channelData[j];
            sumSq += sample * sample;
          }
          const rms = Math.sqrt(sumSq / Math.max(1, end - start));
          if (rms > maxPeak) maxPeak = rms;
          computed.push(rms);
        }

        const normalized = computed.map((v) =>
          Math.max(0.12, Math.min(1, v / maxPeak))
        );
        if (!cancelled) {
          setPeaks(normalized);
          if (!duration && Number.isFinite(audioBuffer.duration)) {
            setDuration(audioBuffer.duration);
          }
        }
      } catch {
        // Keep deterministic fallback peaks if fetch/decode fails (e.g. cross-origin restriction)
      } finally {
        setIsDecodingWaveform(false);
        if (ctx && ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      }
    };

    decodePeaks();
    return () => {
      cancelled = true;
    };
  }, [activeTrack?.id, activeTrack?.url]);

  // Sync audio element volume, rate, loop
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = isMuted ? 0 : volume;
    el.playbackRate = playbackRate;
    el.loop = isLooping;
  }, [volume, isMuted, playbackRate, isLooping]);

  if (mp3Tracks.length === 0 || !activeTrack) {
    return null;
  }

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    soundEngine.playKeyClick();
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      setAudioError(null);
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setAudioError('Unable to stream MP3 file directly. Verify asset URL or download file.');
          setIsPlaying(false);
        });
    }
  };

  const seekToRatio = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    const el = audioRef.current;
    const effectiveDur = duration || el?.duration || 0;
    if (effectiveDur > 0 && el) {
      const target = clamped * effectiveDur;
      el.currentTime = target;
      setCurrentTime(target);
    }
  };

  const getRatioFromPointer = (clientX: number): number => {
    if (!waveformRef.current) return 0;
    const rect = waveformRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
  };

  const handleWaveformPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const ratio = getRatioFromPointer(e.clientX);
    seekToRatio(ratio);
  };

  const handleWaveformPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ratio = getRatioFromPointer(e.clientX);
    setHoverRatio(ratio);
    if (isDragging) {
      seekToRatio(ratio);
    }
  };

  const handleWaveformPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
    }
  };

  const jumpSeconds = (delta: number) => {
    const el = audioRef.current;
    if (!el) return;
    soundEngine.playKeyClick();
    const maxDur = duration || el.duration || 0;
    const next = Math.max(0, Math.min(maxDur, el.currentTime + delta));
    el.currentTime = next;
    setCurrentTime(next);
  };

  const cycleSpeed = () => {
    soundEngine.playKeyClick();
    const speeds = [0.75, 1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <section
      aria-label="MP3 Audio Evidence Waveform Player"
      className="retro-window bg-[#090d13] border-2 border-emerald-900/70 rounded p-4 sm:p-5 space-y-4 shadow-xl"
    >
      <audio
        ref={audioRef}
        src={activeTrack.url}
        preload="metadata"
        onLoadedMetadata={() => {
          if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onEnded={() => {
          if (!isLooping) {
            setIsPlaying(false);
          }
        }}
        onError={() => {
          setIsPlaying(false);
          setAudioError('Audio stream could not be decoded from the source path.');
        }}
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-950/70 border border-emerald-700/80 text-emerald-400 rounded">
            <Radio className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-emerald-300' : ''}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-emerald-400 uppercase tracking-wider font-bold">
                AUDIO EVIDENCE WAVEFORM DECK // AUDIO DETECTED ({mp3Tracks.length})
              </span>
              <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-amber-300 font-mono text-[9px] rounded">
                {activeTrack.classification}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-editorial text-zinc-100 mt-0.5">
              {activeTrack.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-[11px]">
          <span className="px-2 py-0.5 bg-black border border-zinc-800 text-amber-400 font-bold rounded">
            {formatClock(currentTime)} / {formatClock(duration)}
          </span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              window.dispatchEvent(
                new CustomEvent('docket_open_studio', {
                  detail: { tab: 'add_media', caseSlug: caseData.slug },
                })
              );
            }}
            className="retro-btn px-2.5 py-1 flex items-center space-x-1 text-[10px] text-emerald-300 border-emerald-700"
            title="Add another audio or video file to this case"
          >
            <Plus className="w-3 h-3" />
            <span>ADD AUDIO</span>
          </button>
          <a
            href={activeTrack.url}
            download
            className="retro-btn px-2.5 py-1 flex items-center space-x-1 text-[10px]"
            title="Download audio exhibit"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">AUDIO</span>
          </a>
        </div>
      </div>

      {/* Multi-Track Selector Strip (when more than 1 .mp3 is detected in case media) */}
      {mp3Tracks.length > 1 && (
        <div className="flex flex-wrap gap-1.5 pb-1">
          {mp3Tracks.map((track, idx) => {
            const active = track.id === activeTrack.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => {
                  soundEngine.playFileAccess();
                  setSelectedTrackId(track.id);
                }}
                className={`px-2.5 py-1 rounded border font-mono text-[11px] flex items-center space-x-1.5 transition-colors ${
                  active
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <FileAudio className="w-3 h-3 text-amber-400" />
                <span>
                  {String(idx + 1).padStart(2, '0')}. {track.title}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Interactive Forensic Waveform Display */}
      <div className="bg-[#05080c] border border-zinc-800 rounded p-3 sm:p-4 space-y-2 relative">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>
            {isDecodingWaveform
              ? 'ANALYZING MP3 SPECTRAL ENVELOPE...'
              : 'INTERACTIVE WAVEFORM SCRUBBER (CLICK OR DRAG TO SEEK)'}
          </span>
          {hoverRatio !== null && duration > 0 && (
            <span className="text-amber-400">SEEK &rarr; {formatClock(hoverRatio * duration)}</span>
          )}
        </div>

        <div
          ref={waveformRef}
          onPointerDown={handleWaveformPointerDown}
          onPointerMove={handleWaveformPointerMove}
          onPointerUp={handleWaveformPointerUp}
          onPointerLeave={() => setHoverRatio(null)}
          role="slider"
          aria-label="MP3 Audio Waveform Scrubber"
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuenow={Math.floor(currentTime)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') jumpSeconds(5);
            if (e.key === 'ArrowLeft') jumpSeconds(-5);
            if (e.key === ' ') {
              e.preventDefault();
              togglePlay();
            }
          }}
          className="relative h-24 sm:h-28 w-full flex items-center gap-[2px] sm:gap-[3px] px-1 cursor-ew-resize select-none touch-none bg-[linear-gradient(to_bottom,transparent_49%,rgba(52,211,153,0.12)_50%,transparent_51%)]"
        >
          {peaks.map((amp, idx) => {
            const barRatio = (idx + 0.5) / peaks.length;
            const isPlayed = barRatio <= progressRatio;
            const isHovered = hoverRatio !== null && Math.abs(barRatio - hoverRatio) < 0.025;
            const heightPct = Math.round(amp * 92);

            return (
              <div
                key={idx}
                className="flex-1 h-full flex items-center justify-center"
              >
                <div
                  className={`w-full rounded-[1px] transition-colors duration-75 ${
                    isPlayed
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.45)]'
                      : isHovered
                      ? 'bg-amber-400/90'
                      : 'bg-zinc-700/80 hover:bg-amber-500/70'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}

          {/* Playhead Needle */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
            style={{ left: `${progressRatio * 100}%` }}
          />

          {/* Hover Crosshair */}
          {hoverRatio !== null && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-amber-400/60"
              style={{ left: `${hoverRatio * 100}%` }}
            />
          )}
        </div>
      </div>

      {audioError && (
        <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Transport Controls & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => jumpSeconds(-10)}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
            title="Rewind 10 seconds"
          >
            <Rewind className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className={`px-4 py-1.5 rounded font-pixel text-xs font-bold flex items-center space-x-2 border transition-all ${
              isPlaying
                ? 'bg-amber-950 border-amber-500 text-amber-200 hover:bg-amber-900'
                : 'bg-emerald-950 border-emerald-600 text-emerald-200 hover:bg-emerald-900'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY MP3'}</span>
          </button>

          <button
            type="button"
            onClick={() => jumpSeconds(10)}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
            title="Forward 10 seconds"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              seekToRatio(0);
            }}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
            title="Reset to start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] font-mono rounded"
            title="Cycle playback rate"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setIsLooping((v) => !v);
            }}
            className={`p-1.5 border rounded transition-colors ${
              isLooping
                ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle loop playback"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {activeTrack.transcript && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyClick();
                setShowTranscript((v) => !v);
              }}
              className={`px-2.5 py-1 border rounded font-mono text-[10px] flex items-center space-x-1 ${
                showTranscript
                  ? 'bg-amber-950/70 border-amber-600 text-amber-200'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-amber-600'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>{showTranscript ? 'HIDE TRANSCRIPT' : 'TRANSCRIPT'}</span>
            </button>
          )}

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyClick();
                setIsMuted((m) => !m);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-100"
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (v > 0 && isMuted) setIsMuted(false);
              }}
              className="w-16 sm:w-20 accent-emerald-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
              aria-label="Audio volume"
            />
          </div>
        </div>
      </div>

      {/* Provenance & Optional Transcript */}
      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-tech text-zinc-400">
        <span>
          <strong className="text-zinc-200">Source:</strong> {activeTrack.source}
          {activeTrack.recoveredAt ? ` (${activeTrack.recoveredAt})` : ''}
        </span>
        {activeTrack.fileSizeLabel && (
          <span className="font-mono text-[10px] text-zinc-500">{activeTrack.fileSizeLabel}</span>
        )}
      </div>

      {showTranscript && activeTrack.transcript && (
        <div className="p-3 bg-black/75 border border-zinc-800 rounded font-mono text-xs text-zinc-300 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
          {activeTrack.transcript}
        </div>
      )}
    </section>
  );
};
