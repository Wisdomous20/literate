import OpenAI from "openai";
import { WhisperTranscriptResponse } from "@/types/oral-reading";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Maps passage language field to Whisper ISO-639-1 code.
 */
function getWhisperLanguageCode(language: string): string {
  const normalized = language.toLowerCase().trim();

  const languageMap: Record<string, string> = {
    english: "en",
    en: "en",
    tagalog: "tl",
    tl: "tl",
    filipino: "tl",
    fil: "tl",
  };

  return languageMap[normalized] ?? "en";
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  language: string
): Promise<WhisperTranscriptResponse> {
  const file = new File([audioBuffer], fileName, { type: "audio/webm" });
  const whisperLang = getWhisperLanguageCode(language);

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"],
    language: whisperLang,
  });

  const result = response as unknown as WhisperTranscriptResponse;

  return {
    text: result.text ?? "",
    segments: result.segments ?? [],
    words: result.words ?? [],
    duration: result.duration ?? 0,
  };
}

/**
 * Normalize a word for comparison.
 * Handles both English and Tagalog (which uses Latin script + ñ/ng digraph).
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-zñ'\-]/g, "") // keep ñ for Tagalog, apostrophes, hyphens
    .trim();
}