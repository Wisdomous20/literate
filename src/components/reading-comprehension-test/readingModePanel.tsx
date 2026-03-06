"use client";

import {
  Volume2,
  Pause,
  Square,
  Play,
  Minus,
  Plus,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface VoiceOption {
  name: string;
  label: string;
  lang: string;
}

interface ReadingModePanelProps {
  isSpeaking: boolean;
  isPausedTTS: boolean;
  onPlayTTS: () => void;
  onPauseTTS: () => void;
  onResumeTTS: () => void;
  onStopTTS: () => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  hasPassage: boolean;
  wordCount: number;
  selectedVoiceName: string;
  onVoiceChange: (voiceName: string) => void;
  availableVoices: VoiceOption[];
}

export function ReadingModePanel({
  isSpeaking,
  isPausedTTS,
  onPlayTTS,
  onPauseTTS,
  onResumeTTS,
  onStopTTS,
  speechRate,
  onSpeechRateChange,
  hasPassage,
  wordCount,
  selectedVoiceName,
  onVoiceChange,
  availableVoices,
}: ReadingModePanelProps) {
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalDurationMs = wordCount > 0 ? (wordCount / (150 * speechRate)) * 60 * 1000 : 0;

  function formatTime(ms: number): string {
    const totalSec = Math.max(0, Math.round(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min === 0) return `${sec}s`;
    return `${min}m ${sec < 10 ? "0" + sec : sec}s`;
  }

  useEffect(() => {
    if (isSpeaking && !isPausedTTS) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed =
          accumulatedMsRef.current +
          (Date.now() - (startTimeRef.current ?? Date.now()));
        const pct =
          totalDurationMs > 0
            ? Math.min(100, (elapsed / totalDurationMs) * 100)
            : 0;
        setProgress(pct);
      }, 250);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isSpeaking, isPausedTTS, totalDurationMs]);

  useEffect(() => {
    if (isPausedTTS && startTimeRef.current !== null) {
      accumulatedMsRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
  }, [isPausedTTS]);

  useEffect(() => {
    if (!isSpeaking && !isPausedTTS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset triggered by external TTS state change
      setProgress(0);
      accumulatedMsRef.current = 0;
      startTimeRef.current = null;
    }
  }, [isSpeaking, isPausedTTS]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setVoiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    availableVoices.find((v) => v.name === selectedVoiceName)?.label ??
    "Select a voice";

  return (
    <div className="flex h-full flex-col rounded-4xl border border-[#54A4FF] bg-[#EFFDFF] px-5 py-4 shadow-[0px_1px_20px_rgba(108,164,239,0.37)]">
      <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-[#6666FF]">
        Read Aloud
      </span>

      <div className="mt-4 flex flex-col gap-3" style={{ flex: hasPassage ? "0 0 auto" : 1, marginBottom: hasPassage ? "1rem" : 0 }}>
        <span className="text-xs font-semibold text-[#00306E]">Voice</span>

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setVoiceDropdownOpen((o) => !o)}
            disabled={!hasPassage || isSpeaking}
            className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-all duration-200 ${
              voiceDropdownOpen
                ? "border-[#6666FF] bg-[rgba(102,102,255,0.08)] shadow-[0_0_10px_rgba(102,102,255,0.15)]"
                : "border-[#DAE6FF] bg-white/50 hover:border-[#6666FF]/40"
            } ${!hasPassage || isSpeaking ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <span className="truncate font-medium text-[#00306E]">
              {selectedLabel}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-[#6666FF] transition-transform ${voiceDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {voiceDropdownOpen && (
            <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#DAE6FF] bg-white shadow-lg">
              {availableVoices.map((voice) => {
                const isActive = voice.name === selectedVoiceName;
                return (
                  <button
                    key={voice.name}
                    type="button"
                    onClick={() => {
                      onVoiceChange(voice.name);
                      setVoiceDropdownOpen(false);
                    }}
                    className={`flex w-full flex-col px-3 py-2 text-left transition-colors ${
                      isActive
                        ? "bg-[rgba(102,102,255,0.08)] text-[#6666FF]"
                        : "text-[#00306E] hover:bg-[rgba(102,102,255,0.04)]"
                    }`}
                  >
                    <span className="text-xs font-semibold">{voice.label}</span>
                    <span className="text-[10px] text-[#00306E]/50">
                      {voice.lang}
                    </span>
                  </button>
                );
              })}
              {availableVoices.length === 0 && (
                <span className="block px-3 py-2 text-[10px] text-[#00306E]/50">
                  No voices available
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 h-px bg-[rgba(18,48,220,0.15)]" />

      {hasPassage && (
        <div className="flex flex-1 flex-col justify-between pt-1 pb-2">
          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-semibold text-[#00306E]">Voice Controls</span>
              {totalDurationMs > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-[rgba(102,102,255,0.08)] px-2 py-0.5 text-[10px] font-medium text-[#6666FF]">
                  <Clock className="h-3 w-3" />
                  {isSpeaking || isPausedTTS
                    ? formatTime(totalDurationMs * (1 - progress / 100)) + " left"
                    : "~" + formatTime(totalDurationMs)}
                </span>
              )}
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
            {!isSpeaking && !isPausedTTS && (
              <button
                type="button"
                onClick={onPlayTTS}
                aria-label="Start reading"
                title="Start reading"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6666FF] text-white shadow-[0_0_12px_rgba(102,102,255,0.4)] transition-all hover:bg-[#5555EE]"
              >
                <Play className="h-4.5 w-4.5" />
              </button>
            )}

            {isSpeaking && !isPausedTTS && (
              <button
                type="button"
                onClick={onPauseTTS}
                aria-label="Pause reading"
                title="Pause reading"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFB020] text-white shadow-[0_0_12px_rgba(255,176,32,0.4)] transition-all hover:bg-[#E5A01C]"
              >
                <Pause className="h-4.5 w-4.5" />
              </button>
            )}

            {isPausedTTS && (
              <button
                type="button"
                onClick={onResumeTTS}
                aria-label="Resume reading"
                title="Resume reading"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16A34A] text-white shadow-[0_0_12px_rgba(22,163,74,0.4)] transition-all hover:bg-[#15803D]"
              >
                <Play className="h-4.5 w-4.5" />
              </button>
            )}

            {(isSpeaking || isPausedTTS) && (
              <button
                type="button"
                onClick={onStopTTS}
                aria-label="Stop reading"
                title="Stop reading"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DC2626] text-white shadow-[0_0_12px_rgba(220,38,38,0.4)] transition-all hover:bg-[#B91C1C]"
              >
                <Square className="h-4 w-4" />
              </button>
            )}
          </div>

          {(isSpeaking || isPausedTTS) && (
            <div className="w-full">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(102,102,255,0.15)]">
                <div
                  className="h-full rounded-full bg-[#6666FF] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {isSpeaking && !isPausedTTS && (
            <div className="flex items-center justify-center gap-2">
              <Volume2 className="h-3.5 w-3.5 animate-pulse text-[#6666FF]" />
              <span className="text-[10px] font-medium text-[#6666FF]">
                Reading passage...
              </span>
            </div>
          )}
          {isPausedTTS && (
            <div className="flex items-center justify-center gap-2">
              <Pause className="h-3.5 w-3.5 text-[#FFB020]" />
              <span className="text-[10px] font-medium text-[#FFB020]">
                Paused
              </span>
            </div>
          )}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[rgba(102,102,255,0.06)] px-4 py-3">
            <span className="text-xs font-semibold text-[#31318A]">Speed</span>
            <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                onSpeechRateChange(
                  Math.max(0.5, Math.round((speechRate - 0.25) * 100) / 100),
                )
              }
              disabled={isSpeaking}
              aria-label="Decrease speech rate"
              title="Decrease speech rate"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(102,102,255,0.15)] transition-colors hover:opacity-70 disabled:opacity-40"
            >
              <Minus className="h-3 w-3 text-[#6666FF]" />
            </button>
            <span className="w-10 text-center text-sm font-bold tabular-nums text-[#6666FF]">
              {speechRate}x
            </span>
            <button
              type="button"
              onClick={() =>
                onSpeechRateChange(
                  Math.min(2, Math.round((speechRate + 0.25) * 100) / 100),
                )
              }
              disabled={isSpeaking}
              aria-label="Increase speech rate"
              title="Increase speech rate"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(102,102,255,0.15)] transition-colors hover:opacity-70 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5 text-[#6666FF]" />
            </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
