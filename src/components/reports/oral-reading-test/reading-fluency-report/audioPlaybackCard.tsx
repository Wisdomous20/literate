"use client";

import { Mic, SkipBack, Play, Pause, SkipForward } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

interface AudioPlaybackCardProps {
  audioSrc?: string | null;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlaybackCard({ audioSrc }: AudioPlaybackCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioSrc]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const skipBack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  }, []);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * duration;
    },
    [duration]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-2xl px-5 py-3">
      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="metadata" />}

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(74,74,252,0.08)]">
          <Mic size={14} className="text-[#1E1E1E]" />
        </div>
        <h3 className="text-sm font-medium text-[#00306E]">Playback Audio History</h3>
      </div>

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="flex items-center gap-3 mb-3 cursor-pointer"
        onClick={handleProgressClick}
      >
        <div className="relative flex-1 h-1.5 rounded-full bg-[#036570]">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[#7A7AFB]"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#E5FCFF] border border-[#00306E] transition-[left] duration-100"
            style={{ left: `calc(${progress}% - 10px)` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={skipBack}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(74,74,252,0.08)] hover:bg-[rgba(74,74,252,0.15)] transition-colors"
          aria-label="Skip back 5s"
        >
          <SkipBack size={12} className="text-[#7A7AFB]" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          disabled={!audioSrc}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(74,74,252,0.08)] hover:bg-[rgba(74,74,252,0.15)] transition-colors disabled:opacity-40"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={16} className="text-[#7A7AFB]" fill="#7A7AFB" />
          ) : (
            <Play size={16} className="text-[#7A7AFB]" fill="#7A7AFB" />
          )}
        </button>
        <button
          type="button"
          onClick={skipForward}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(74,74,252,0.08)] hover:bg-[rgba(74,74,252,0.15)] transition-colors"
          aria-label="Skip forward 5s"
        >
          <SkipForward size={12} className="text-[#7A7AFB]" />
        </button>
      </div>

      {/* Time */}
      <p className="text-center text-xs font-medium text-[#00306E] mt-2">
        {formatTime(currentTime)} / {formatTime(duration)}
      </p>

      {!audioSrc && (
        <p className="text-center text-xs text-[#7A8BA0] mt-2">No audio recording available</p>
      )}
    </div>
  );
}
