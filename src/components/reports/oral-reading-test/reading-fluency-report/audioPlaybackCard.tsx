"use client";

import { Mic, SkipBack, Play, SkipForward } from "lucide-react";
import { useState } from "react";

export default function AudioPlaybackCard() {
  const [currentTime] = useState("20:00");

  return (
    <div className="bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(74,74,252,0.08)]">
          <Mic size={16} className="text-[#1E1E1E]" />
        </div>
        <h3 className="text-sm font-medium text-[#00306E]">Playback Audio History</h3>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 h-1.5 rounded-full bg-[#036570]">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#E5FCFF] border border-[#00306E]" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(74,74,252,0.08)] hover:bg-[rgba(74,74,252,0.15)] transition-colors"
          aria-label="Skip back"
        >
          <SkipBack size={14} className="text-[#7A7AFB]" />
        </button>
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(74,74,252,0.08)] hover:bg-[rgba(74,74,252,0.15)] transition-colors"
          aria-label="Play"
        >
          <Play size={18} className="text-[#7A7AFB]" fill="#7A7AFB" />
        </button>
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(74,74,252,0.08)] hover:bg-[rgba(74,74,252,0.15)] transition-colors"
          aria-label="Skip forward"
        >
          <SkipForward size={14} className="text-[#7A7AFB]" />
        </button>
      </div>

      {/* Time */}
      <p className="text-center text-xs font-medium text-[#00306E] mt-3">{currentTime}</p>
    </div>
  );
}
