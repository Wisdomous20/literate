"use client";

import { Star, Volume2 } from "lucide-react";
import { useState } from "react";

interface WordOfTheDayProps {
  word?: string;
  definition?: string;
  partOfSpeech?: string;
}

export function WordOfTheDay({
  word = "LiteRate",
  definition = "playfully quaint or fanciful, especially in an appealing and amusing way.",
  partOfSpeech = "Adjective",
}: WordOfTheDayProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div 
      className="flex flex-col rounded-3xl p-4 md:p-6 min-h-[200px]"
      style={{
        background: "linear-gradient(135deg, #5D5DFB 0%, #7A5DFB 50%, #54A4FF 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
        <span className="text-sm font-semibold text-white tracking-wide uppercase">
          Word of the Day
        </span>
      </div>

      {/* Word */}
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
        {word}
      </h2>

      {/* Definition */}
      <p className="text-sm md:text-base text-white/90 italic flex-1">
        <span className="font-medium not-italic">{partOfSpeech}:</span> {definition}
      </p>

      {/* Audio player */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/20">
        <button
          type="button"
          onClick={handleSpeak}
          disabled={isPlaying}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-50"
          aria-label="Listen to pronunciation"
        >
          <Volume2 className="h-5 w-5" />
        </button>
        <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-white rounded-full transition-all duration-1000 ${
              isPlaying ? "w-full" : "w-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
