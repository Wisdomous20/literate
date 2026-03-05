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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

const progressWidthClass = (() => {
  const p = Math.max(0, Math.min(100, progress));
  const bucket = Math.round(p / 5) * 5;
  const map: Record<number, string> = {
    0: "w-0",
    5: "w-[5%]",
    10: "w-[10%]",
    15: "w-[15%]",
    20: "w-[20%]",
    25: "w-[25%]",
    30: "w-[30%]",
    35: "w-[35%]",
    40: "w-[40%]",
    45: "w-[45%]",
    50: "w-1/2",
    55: "w-[55%]",
    60: "w-[60%]",
    65: "w-[65%]",
    70: "w-[70%]",
    75: "w-3/4",
    80: "w-[80%]",
    85: "w-[85%]",
    90: "w-[90%]",
    95: "w-[95%]",
    100: "w-full",
  };
  return map[bucket] ?? "w-0";
})();

const thumbLeftClass = (() => {
  const p = Math.max(0, Math.min(100, progress));
  const bucket = Math.round(p / 5) * 5;
  const map: Record<number, string> = {
    0: "left-[-10px]",
    5: "left-[calc(5%-10px)]",
    10: "left-[calc(10%-10px)]",
    15: "left-[calc(15%-10px)]",
    20: "left-[calc(20%-10px)]",
    25: "left-[calc(25%-10px)]",
    30: "left-[calc(30%-10px)]",
    35: "left-[calc(35%-10px)]",
    40: "left-[calc(40%-10px)]",
    45: "left-[calc(45%-10px)]",
    50: "left-[calc(50%-10px)]",
    55: "left-[calc(55%-10px)]",
    60: "left-[calc(60%-10px)]",
    65: "left-[calc(65%-10px)]",
    70: "left-[calc(70%-10px)]",
    75: "left-[calc(75%-10px)]",
    80: "left-[calc(80%-10px)]",
    85: "left-[calc(85%-10px)]",
    90: "left-[calc(90%-10px)]",
    95: "left-[calc(95%-10px)]",
    100: "left-[calc(100%-10px)]",
  };
  return map[bucket] ?? "left-[-10px]";
})();

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
         <div className={`absolute left-0 top-0 h-full rounded-full bg-[#7A7AFB] ${progressWidthClass}`} />
          <div
  className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-[#00306E] bg-[#E5FCFF] transition-[left] duration-100 ${thumbLeftClass}`}
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
