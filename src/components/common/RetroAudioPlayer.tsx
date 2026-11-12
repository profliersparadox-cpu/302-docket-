import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Volume2,
  VolumeX,
  Radio,
  FileAudio,
  Video,
  Sparkles,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine.ts';

interface RetroAudioPlayerProps {
  url?: string;
  title: string;
  caseNumber?: string;
  transcript?: string;
  mediaType?: 'audio' | 'recording' | 'wiretap' | 'video' | string;
  defaultDuration?: number; // seconds
  compact?: boolean;
}

export const RetroAudioPlayer: React.FC<RetroAudioPlayerProps> = ({
  url,
  title,
  caseNumber,
  transcript,
  mediaType = 'audio',
  defaultDuration = 180,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(defaultDuration);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [readAloud, setReadAloud] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stopProceduralRef = useRef<(() => void) | null>(null);

  const isVideoFile =
    mediaType === 'video' ||
    (url && /\.(mp4|m4v|mpeg|mpg|webm|mov|avi)$/i.test(url)) ||
    /\.(mp4|m4v|mpeg|mpg|webm|mov|avi)$/i.test(title);

  const isMpFile =
    (url && /\.(mp3|mp4|m4a|mpeg|mpg)$/i.test(url)) ||
    /\.(mp3|mp4|m4a|mpeg|mpg)$/i.test(title);

  // Sync HTML5 media element duration & time
  useEffect(() => {
    const el = isVideoFile ? videoRef.current : audioRef.current;
    if (el) {
      el.volume = isMuted ? 0 : volume;
      el.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate, isVideoFile]);

  // Clean up procedural sound on unmount or URL switch
  useEffect(() => {
    return () => {
      stopProceduralRef.current?.();
      soundEngine.stopSpeech();
    };
  }, [url]);

  // Handle synthetic timer when no real file URL exists
  useEffect(() => {
    let timer: any;
    if (isPlaying && !url) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            handlePause();
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackRate);
    }
    return () => clearInterval(timer);
  }, [isPlaying, url, duration, playbackRate]);

  const handlePlay = () => {
    soundEngine.playKeyClick();
    setIsPlaying(true);

    if (url) {
      const el = isVideoFile ? videoRef.current : audioRef.current;
      if (el) {
        el.play().catch(() => {
          // Fallback to procedural tape audio if browser autoplay blocked
          startProceduralPlayback();
        });
      }
    } else {
      startProceduralPlayback();
    }
  };

  const startProceduralPlayback = () => {
    stopProceduralRef.current?.();
    const textToSpeak = readAloud ? transcript || title : undefined;
    const stopFn = soundEngine.startTapeAudioReel(textToSpeak, () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    stopProceduralRef.current = stopFn;
  };

  const handlePause = () => {
    soundEngine.playKeyClick();
    setIsPlaying(false);

    if (url) {
      const el = isVideoFile ? videoRef.current : audioRef.current;
      el?.pause();
    }
    stopProceduralRef.current?.();
    soundEngine.stopSpeech();
  };

  const togglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handleRewind = () => {
    soundEngine.playKeyClick();
    setCurrentTime(0);
    const el = isVideoFile ? videoRef.current : audioRef.current;
    if (el) el.currentTime = 0;
  };

  const handleSkip = (seconds: number) => {
    soundEngine.playKeyClick();
    const target = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(target);
    const el = isVideoFile ? videoRef.current : audioRef.current;
    if (el) el.currentTime = target;
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = Math.floor(ratio * duration);
    setCurrentTime(targetTime);
    const el = isVideoFile ? videoRef.current : audioRef.current;
    if (el) el.currentTime = targetTime;
  };

  const toggleRate = () => {
    soundEngine.playKeyClick();
    const nextRate = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
    setPlaybackRate(nextRate);
  };

  const testAudioTone = () => {
    soundEngine.playRadioSquelch();
    soundEngine.playBootBeep();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatBadge = isVideoFile
    ? 'MP4 VIDEO / AUDIO'
    : isMpFile
    ? 'MP3 AUDIO REEL'
    : url
    ? 'AUTHENTIC RECORDING'
    : 'ARCHIVAL TAPE REEL';

  return (
    <div className={`retro-window bg-gradient-to-b from-[#131720] to-[#090c10] border-2 border-zinc-700 rounded-lg p-3 sm:p-4 font-mono shadow-2xl ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Real HTML5 Audio Element */}
      {url && !isVideoFile && (
        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(Math.floor(audioRef.current.currentTime));
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
              setDuration(Math.floor(audioRef.current.duration));
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          className="hidden"
        />
      )}

      {/* Real HTML5 Video Element for MP4 / Video Recordings */}
      {url && isVideoFile && (
        <div className="mb-3 bg-black rounded border border-zinc-800 overflow-hidden relative group">
          <video
            ref={videoRef}
            src={url}
            playsInline
            controls
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(Math.floor(videoRef.current.currentTime));
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration)) {
                setDuration(Math.floor(videoRef.current.duration));
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            className="w-full max-h-56 object-contain"
          />
        </div>
      )}

      {/* Top Header Badge Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          {isVideoFile ? (
            <Video className="w-4 h-4 text-amber-400" />
          ) : (
            <Radio className={`w-4 h-4 ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-red-500'}`} />
          )}
          <span className="font-pixel text-[10px] text-amber-400 font-bold uppercase tracking-wider">
            {formatBadge}
          </span>
          {caseNumber && (
            <span className="px-1.5 py-0.2 bg-zinc-900 border border-zinc-700 text-zinc-300 text-[9px] rounded font-mono">
              {caseNumber}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
          <button
            type="button"
            onClick={testAudioTone}
            className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-700 rounded transition-colors"
            title="Send test police radio squelch tone"
          >
            TEST SQUELCH
          </button>
          {!url && transcript && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyClick();
                setReadAloud(!readAloud);
              }}
              className={`px-2 py-0.5 border rounded transition-colors ${
                readAloud
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
              title="Toggle reading verbatim spoken dialogue via radio synthesizer"
            >
              VOICE SYNTH: {readAloud ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      </div>

      {/* Reel-to-Reel Tape Animation Graphic (for audio reels) */}
      {!isVideoFile && (
        <div className="py-2.5 px-4 bg-[#0a0d12] border border-zinc-800/80 rounded-lg mb-3 flex items-center justify-around shadow-inner">
          {/* Left Reel */}
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center relative shadow-inner ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: `${2 / playbackRate}s` }}
          >
            <div className="w-5 h-5 rounded-full bg-zinc-950 border border-zinc-600 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            </div>
            <div className="absolute w-0.5 h-6 bg-zinc-600" />
            <div className="absolute h-0.5 w-6 bg-zinc-600" />
          </div>

          {/* Center Playback Counter */}
          <div className="text-center font-mono space-y-0.5">
            <span className="text-[9px] font-pixel text-emerald-400 block tracking-widest uppercase">
              {isPlaying ? 'MAGNETIC TAPE PLAYING' : 'AUDIO DECK PAUSED'}
            </span>
            <div className="text-lg sm:text-xl font-bold text-amber-400 tracking-wider">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className="text-[9px] text-zinc-500">
              SPEED: {playbackRate}x {url ? '• DIRECT FILE' : '• SYNTHESIZED REEL'}
            </div>
          </div>

          {/* Right Reel */}
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center relative shadow-inner ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: `${2 / playbackRate}s` }}
          >
            <div className="w-5 h-5 rounded-full bg-zinc-950 border border-zinc-600 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            </div>
            <div className="absolute w-0.5 h-6 bg-zinc-600" />
            <div className="absolute h-0.5 w-6 bg-zinc-600" />
          </div>
        </div>
      )}

      {/* Scrubber Progress Bar */}
      <div className="space-y-1 mb-3">
        <div
          onClick={handleScrub}
          className="w-full bg-zinc-950 h-2.5 border border-zinc-800 rounded overflow-hidden cursor-pointer hover:border-amber-500 transition-colors"
          title="Click to seek"
        >
          <div
            className="bg-amber-500 h-full transition-all duration-150"
            style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 font-pixel">
          <span>{formatTime(currentTime)}</span>
          <span className="text-zinc-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Transport Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2">
          {/* Rewind */}
          <button
            type="button"
            onClick={handleRewind}
            title="Rewind to start"
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={togglePlay}
            className={`px-4 sm:px-6 py-2 rounded font-pixel text-xs font-bold flex items-center space-x-2 border shadow-lg transition-all ${
              isPlaying
                ? 'bg-amber-950 border-amber-500 text-amber-200 hover:bg-amber-900 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-emerald-950 border-emerald-600 text-emerald-200 hover:bg-emerald-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>PAUSE AUDIO</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>PLAY AUDIO REEL</span>
              </>
            )}
          </button>

          {/* Skip +15s */}
          <button
            type="button"
            onClick={() => handleSkip(15)}
            title="Skip forward 15 seconds"
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Speed Toggle */}
          <button
            type="button"
            onClick={toggleRate}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-pixel rounded"
            title="Change playback speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Volume & Audio Output Controls */}
        <div className="flex items-center space-x-2 text-zinc-400">
          <button
            type="button"
            onClick={() => {
              soundEngine.playKeyClick();
              setIsMuted(!isMuted);
            }}
            className="p-1 text-zinc-400 hover:text-zinc-100"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
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
            className="w-16 sm:w-20 accent-amber-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
            title="Volume slider"
          />
        </div>
      </div>
    </div>
  );
};
