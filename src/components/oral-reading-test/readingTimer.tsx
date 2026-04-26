"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic,
  Play,
  Pause,
  Download,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

import { convertToWav } from "@/utils/convertToWav";

interface ReadingTimerProps {
  hasPassage: boolean;
  hasStudentInfo: boolean;
  onStartReading: () => void;
  hasRecording: boolean;
  recordedSeconds: number;
  recordedAudioURL: string | null;
  onTryAgain: () => void;
  onStartOver?: () => void;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  isAnalyzing?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({
  src,
  externalAudioRef,
}: {
  src: string;
  externalAudioRef?: React.RefObject<HTMLAudioElement | null>;
}) {
  const internalRef = useRef<HTMLAudioElement>(null);
  const audioRef = externalAudioRef || internalRef;
  const rangeRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = rangeRef.current;
    if (!el) return;
    const progress = duration ? (currentTime / duration) * 100 : 0;
    el.style.background = `linear-gradient(to right, #6666FF ${progress}%, #C4C4FF ${progress}%)`;
    el.style.accentColor = "#6666FF";
  }, [currentTime, duration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleSpeedChange = (speed: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const originalBlob = await response.blob();
      const wavBlob = await convertToWav(originalBlob);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `oral-reading-test-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to convert/download as WAV:", err);
    }
  };

  const formatAudioTime = (secs: number) => {
    if (!isFinite(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex w-full items-center gap-2.5 rounded-2xl border-t border-l border-r-4 border-b-4 border-t-[#8D8DEC] border-l-[#8D8DEC] border-r-[#8D8DEC] border-b-[#8D8DEC] bg-[rgba(102,102,255,0.08)] px-3 py-2">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        onClick={togglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6666FF] transition-colors hover:opacity-80"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 text-white" />
        ) : (
          <Play className="ml-0.5 h-4 w-4 text-white" />
        )}
      </button>

      <span className="shrink-0 text-xs tabular-nums text-[#31318A]">
        {formatAudioTime(currentTime)}
      </span>

      <input
        ref={rangeRef}
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        step={0.1}
        title="Audio progress"
        aria-label="Audio progress"
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
      />

      <span className="shrink-0 text-xs tabular-nums text-[#31318A]">
        {formatAudioTime(duration)}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          className="flex shrink-0 items-center gap-0.5 rounded-md bg-[#6666FF] px-1.5 py-1 text-xs font-semibold text-white transition-colors hover:opacity-80"
        >
          {playbackRate}x
          <ChevronDown className="h-3 w-3" />
        </button>

        {showSpeedMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowSpeedMenu(false)}
            />
            <div className="absolute bottom-full right-0 z-20 mb-1 rounded-lg border border-[#8D8DEC] bg-white py-1 shadow-lg">
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handleSpeedChange(speed)}
                  className={`flex w-full items-center px-4 py-1.5 text-xs transition-colors hover:bg-[#E4F4FF] ${
                    playbackRate === speed
                      ? "font-bold text-[#6666FF]"
                      : "font-medium text-[#31318A]"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#6666FF] transition-colors hover:opacity-80"
        title="Download recording"
      >
        <Download className="h-3.5 w-3.5 text-white" />
      </button>
    </div>
  );
}

export function ReadingTimer({
  hasPassage,
  hasStudentInfo,
  onStartReading,
  hasRecording,
  recordedSeconds,
  recordedAudioURL,
  onTryAgain,
  onStartOver,
  audioRef,
  isAnalyzing = false,
}: ReadingTimerProps) {
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isDisabled = !hasPassage || !hasStudentInfo;
  const disabledReason = !hasStudentInfo
    ? "Enter student information first"
    : !hasPassage
      ? "Add a passage first to start reading"
      : undefined;

  return (
    <div
      data-tour-target="recording-controls"
      className="flex flex-col items-center gap-2 py-2"
    >
      {hasRecording && recordedAudioURL && (
        <AudioPlayer src={recordedAudioURL} externalAudioRef={audioRef} />
      )}

      <span className="text-lg font-medium tabular-nums text-[#00306E]">
        {formatTime(hasRecording ? recordedSeconds : 0)}
      </span>

      <div className="flex items-center gap-4">
        {!hasRecording && (
          <button
            type="button"
            data-tour-target="start-reading-button"
            onClick={onStartReading}
            disabled={isDisabled}
            className={`flex items-center justify-center gap-2 rounded-3xl px-6 py-2.5 text-sm font-semibold text-white ... ${
              isDisabled
                ? "border-t border-l border-r-4 border-b-4 border-t-[#A855F7]/40 border-l-[#A855F7]/40 border-r-[#6653F9]/40 border-b-[#6653F9]/40 bg-[rgba(102,102,255,0.3)] opacity-60"
                : "border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] bg-[#6666FF] shadow-[0px_1px_20px_rgba(102,102,255,0.4)] hover:bg-[#5555EE]"
            }`}
            title={disabledReason}
          >
            <Mic className="h-4 w-4" />
            Start Reading
          </button>
        )}

        {hasRecording && !isAnalyzing && (
          <button
            type="button"
            onClick={onTryAgain}
            className="rounded-[10px] border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] bg-[#6666FF] px-6 py-2.5 text-sm font-semibold text-white shadow-[0px_1px_20px_rgba(102,102,255,0.4)] transition-colors hover:bg-[#5555EE] md:px-8 lg:px-10"
          >
            Try Again
          </button>
        )}

        {hasRecording && !isAnalyzing && onStartOver && (
          <button
            type="button"
            onClick={onStartOver}
            className="flex items-center gap-1.5 rounded-2xl border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9]/80 border-b-[#6653F9]/80 bg-[rgba(102,102,255,0.06)] px-6 py-2.5 text-sm font-semibold text-[#6666FF] transition-all duration-300 hover:bg-[rgba(102,102,255,0.12)] md:px-8 lg:px-10"
          >
            <RotateCcw className="h-4 w-4" />
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}
