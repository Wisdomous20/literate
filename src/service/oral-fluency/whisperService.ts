import OpenAI from "openai";
import { WhisperTranscriptResponse } from "@/types/oral-reading";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const HALLUCINATION_PATTERNS = [
  /https?:\/\//i,            // URLs with protocol
  /www\./i,                  // URLs without protocol
  /\p{Emoji}/u,              // Any emoji character
  /(.)\1{4,}/u,              // Repeated characters (e.g. "aaaaa")
  /(\b\w+\b)(\s+\1){3,}/i,  // Repeated words (e.g. "the the the the")
  /thank you for watching/i,
  /please subscribe/i,
  /subtitles by/i,
  /translated by/i,
  /amara\.org/i,
  /opensubtitles/i,
];

function isHallucinatedTranscript(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false; // empty is handled separately
  return HALLUCINATION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isLikelySilent(
  segments: WhisperTranscriptResponse["segments"],
  threshold = 0.8
): boolean {
  if (!segments || segments.length === 0) return false;
  const avg =
    segments.reduce((sum, s) => sum + (s.no_speech_prob ?? 0), 0) /
    segments.length;
  return avg > threshold;
}

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

function buildSpellingGuidePrompt(passageText: string): string {
  // Extract unique words from the passage, preserving original casing
  const words = passageText.split(/\s+/).filter((w) => w.length > 0);

  // Identify likely proper nouns (capitalized words not at sentence start)
  const uniqueWords = new Set<string>();

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^\p{L}\p{N}'-]/gu, ""); // strip punctuation
    if (word.length === 0) continue;

    // Add capitalized words (likely proper nouns / names)
    if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
      uniqueWords.add(word);
    }
  }

  if (uniqueWords.size === 0) {
    return "";
  }

  // Return ONLY the word list — no instructional text.
  // Whisper uses the prompt as conditioning context and will parrot back
  // any full sentences included in the prompt.
  return Array.from(uniqueWords).join(", ");
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  language: string,
  passageText?: string
): Promise<WhisperTranscriptResponse> {
  const file = new File([audioBuffer], fileName, { type: "audio/wav" });
  const whisperLang = getWhisperLanguageCode(language);


  // Build a spelling guide prompt from the passage to steer Whisper
  const prompt = passageText ? buildSpellingGuidePrompt(passageText) : undefined;

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"],
    language: whisperLang,
    temperature: 0, // deterministic output
    ...(prompt && { prompt }),
  });

  const result = response as unknown as WhisperTranscriptResponse;
    const text = result.text ?? "";

      if (isHallucinatedTranscript(text) || isLikelySilent(result.segments)) {
    return {
      text: "",
      segments: [],
      words: [],
      duration: result.duration ?? 0,
    };
  }

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