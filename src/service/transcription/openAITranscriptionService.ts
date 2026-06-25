import OpenAI, { toFile } from "openai";
import type { TranscriptResponse, TranscriptWord } from "@/types/oral-reading";

const WAV_HEADER_BYTES = 44;
const BYTES_PER_SECOND = 48000;
const DEFAULT_MODEL = "gpt-4o-transcribe";

let client: OpenAI | null = null;

function getClient() {
  if (client) return client;

  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return client;
}

function getOpenAILanguageCode(language: string): string | undefined {
  const normalized = language.toLowerCase().trim();
  const languageMap: Record<string, string> = {
    english: "en",
    en: "en",
    tagalog: "tl",
    tl: "tl",
    filipino: "tl",
    fil: "tl",
  };

  return languageMap[normalized];
}

function estimateWavDurationSeconds(audioBuffer: Buffer) {
  return Math.max(0, (audioBuffer.length - WAV_HEADER_BYTES) / BYTES_PER_SECOND);
}

function tokenizeTranscript(text: string) {
  return text.split(/\s+/).filter((word) => word.length > 0);
}

function estimateWordTimings(text: string, duration: number): TranscriptWord[] {
  const tokens = tokenizeTranscript(text);
  if (tokens.length === 0) return [];

  const safeDuration = duration > 0 ? duration : tokens.length * 0.2;
  const wordDuration = safeDuration / tokens.length;

  return tokens.map((word, index) => ({
    word,
    start: wordDuration * index,
    end: wordDuration * (index + 1),
  }));
}

function buildPrompt(passageText?: string) {
  if (!passageText?.trim()) return undefined;

  return [
    "This audio is a student reading the following passage aloud.",
    "Transcribe exactly what the student says. Do not silently correct reading mistakes.",
    "Use the passage only as vocabulary and context for names, short words, and unclear audio.",
    "",
    passageText.slice(0, 1500),
  ].join("\n");
}

export async function transcribeAudioWithOpenAI(
  audioBuffer: Buffer,
  fileName: string,
  language: string,
  passageText?: string,
): Promise<TranscriptResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const duration = estimateWavDurationSeconds(audioBuffer);
  const file = await toFile(audioBuffer, fileName || "audio.wav", {
    type: "audio/wav",
  });

  const response = await getClient().audio.transcriptions.create({
    file,
    model: DEFAULT_MODEL,
    language: getOpenAILanguageCode(language),
    prompt: buildPrompt(passageText),
    response_format: "json",
    temperature: 0,
  });

  const text = response.text.trim();
  const words = estimateWordTimings(text, duration);

  return {
    text,
    words,
    duration: Math.round(duration * 10) / 10,
    segments:
      words.length === 0
        ? []
        : [
            {
              id: 0,
              text,
              start: words[0].start,
              end: words[words.length - 1].end,
              words,
            },
          ],
  };
}
