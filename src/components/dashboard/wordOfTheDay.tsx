"use client";

import { Star, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

interface WordOfTheDayData {
  word: string;
  definition: string;
  partOfSpeech: string;
}

export function WordOfTheDay() {
  const [data, setData] = useState<WordOfTheDayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/word-of-the-day");
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = (await res.json()) as WordOfTheDayData;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSpeak = () => {
    if (!data?.word || !("speechSynthesis" in window)) return;
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(data.word);
    utterance.onend = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
  };

  return (
    <div
      className="flex flex-col rounded-3xl p-4 md:p-6 min-h-[200px]"
      style={{
        background:
          "linear-gradient(135deg, #5D5DFB 0%, #7A5DFB 50%, #54A4FF 100%)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
        <span className="text-sm font-semibold text-white tracking-wide uppercase">
          Word of the Day
        </span>
      </div>

      {isLoading ? (
        <>
          <div className="h-8 w-40 rounded bg-white/20 animate-pulse mb-3" />
          <div className="h-4 w-full rounded bg-white/20 animate-pulse mb-2" />
          <div className="h-4 w-3/4 rounded bg-white/20 animate-pulse flex-1" />
        </>
      ) : hasError || !data ? (
        <p className="text-sm text-white/90 flex-1">
          Could not load today&apos;s word. Please try again later.
        </p>
      ) : (
        <>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
            {data.word}
          </h2>
          <p className="text-sm md:text-base text-white/90 italic flex-1">
            <span className="font-medium not-italic">{data.partOfSpeech}:</span>{" "}
            {data.definition}
          </p>
        </>
      )}

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/20">
        <button
          type="button"
          onClick={handleSpeak}
          disabled={isPlaying || isLoading || !data}
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
