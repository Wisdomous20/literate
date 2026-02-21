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

function buildSpellingGuidePrompt(passageText: string): string {
  // Extract unique words from the passage, preserving original casing
  const words = passageText.split(/\s+/).filter((w) => w.length > 0);
  
  // Identify likely proper nouns (capitalized words not at sentence start)
  // and all unique words for the spelling guide
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

  // Format as a spelling guide that Whisper will use to match spellings
  const spellingList = Array.from(uniqueWords).join(", ");
  return `Spelling guide: ${spellingList}. The following is a reading of a passage containing these words.`;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  language: string,
  passageText?: string
): Promise<WhisperTranscriptResponse> {
  const file = new File([audioBuffer], fileName, { type: "audio/webm" });
  const whisperLang = getWhisperLanguageCode(language);

  // Build a spelling guide prompt from the passage to steer Whisper
  const prompt = passageText ? buildSpellingGuidePrompt(passageText) : undefined;

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"],
    language: whisperLang,
    ...(prompt && { prompt }),
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