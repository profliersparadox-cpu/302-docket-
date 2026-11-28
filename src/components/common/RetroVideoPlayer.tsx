import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Repeat,
  Video,
  Maximize,
  ExternalLink,
} from 'lucide-react';
import { getEmbedVideoUrl } from '../../utils/mediaVault.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface RetroVideoPlayerProps {
  url: string;
  title: string;
  caseNumber?: string;
}

export const RetroVideoPlayer: React.FC<RetroVideoPlayerProps> = ({
  url,
  title,
  caseNumber,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoError, setVideoError] = useState(false);

  const embedUrl = getEmbedVideoUrl(url);

  if (embedUrl) {
    return (
      <div className="retro-window bg-[#07090d] border-2 border-zinc-700 rounded overflow-hidden font-mono text-xs">
        <div className="bg-[#12161e] border-b border-zinc-800 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 truncate">
            <Video className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-bold text-amber-300 truncate">{title}</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {caseNumber && (
              <span className="text-[10px] text-zinc-400 font-pixel">{caseNumber}</span>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-amber-300 rounded flex items-center space-x-1 text-[10px]"
            >
              <ExternalLink className="w-3 h-3" />
              <span>SOURCE</span>
            </a>
          </div>
        </div>
        <div className="aspect-video bg-black w-full">
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    soundEngine.playKeyClick();
    if (vid.paused) {
      vid.play().catch(() => setVideoError(true));
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleCycleSpeed = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const handleFullscreen = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.requestFullscreen) {
      vid.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="retro-window bg-[#07090d] border-2 border-zinc-700 rounded overflow-hidden font-mono text-xs">
      <div className="bg-[#12161e] border-b border-zinc-800 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 truncate">
          <Video className="w-4 h-4 text-red-400 shrink-0" />
          <span className="font-bold text-amber-300 truncate">{title}</span>
        </div>
        {caseNumber && (
          <span className="text-[10px] text-zinc-400 font-pixel shrink-0">
            VIDEO REEL // {caseNumber}
          </span>
        )}
      </div>

      <div className="bg-black relative flex items-center justify-center">
        {!videoError ? (
          <video
            ref={videoRef}
            src={url}
            controls
            loop={isLooping}
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => setVideoError(true)}
            className="w-full max-h-[420px] bg-black"
          />
        ) : (
          <div className="p-8 text-center text-zinc-400 space-y-2">
            <Video className="w-8 h-8 mx-auto text-red-400 opacity-60" />
            <div className="font-bold text-red-300">Unable to stream video format inline</div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn retro-btn-amber inline-flex items-center space-x-1 px-3 py-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>OPEN VIDEO FILE DIRECTLY</span>
            </a>
          </div>
        )}
      </div>

      <div className="bg-[#0e1219] border-t border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={togglePlay}
            className="retro-btn px-2.5 py-1 flex items-center space-x-1 text-emerald-300 border-emerald-700"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
              }
            }}
            className="retro-btn px-2 py-1"
            title="Restart video"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleCycleSpeed}
            className="retro-btn px-2 py-1 text-amber-300"
            title="Cycle playback speed"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            onClick={() => setIsLooping((l) => !l)}
            className={`retro-btn px-2 py-1 ${isLooping ? 'border-emerald-500 text-emerald-300' : ''}`}
            title="Loop video"
          >
            <Repeat className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="retro-btn px-2 py-1"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            className="retro-btn px-2 py-1"
            title="Fullscreen"
          >
            <Maximize className="w-3 h-3" />
          </button>

          <a
            href={url}
            download
            className="retro-btn px-2 py-1 flex items-center space-x-1 text-zinc-200"
            title="Download video file"
          >
            <Download className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
