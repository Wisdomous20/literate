import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TranscriptResponse, TranscriptWord } from "@/types/oral-reading";

const mockGoogleTranscribe = vi.hoisted(() => vi.fn());
const mockOpenAITranscribe = vi.hoisted(() => vi.fn());
const mockReconcileTranscripts = vi.hoisted(() => vi.fn());

vi.mock("@/service/googleService/googleSTTService", () => ({
  transcribeAudio: mockGoogleTranscribe,
}));

vi.mock("../openAITranscriptionService", () => ({
  transcribeAudioWithOpenAI: mockOpenAITranscribe,
}));

vi.mock("../transcriptReconciliationService", () => ({
  reconcileTranscripts: mockReconcileTranscripts,
}));

import { transcribeAudioWithConsensus } from "../dualTranscriptionService";

function transcript(words: TranscriptWord[], duration = 1): TranscriptResponse {
  const text = words.map((word) => word.word).join(" ");

  return {
    text,
    words,
    duration,
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

const audioBuffer = Buffer.from("audio");
const googleTranscript = transcript([{ word: "the", start: 0, end: 0.2 }]);
const openAITranscript = transcript([{ word: "the", start: 0, end: 0.2 }]);
const reconciledTranscript = transcript([
  { word: "the", start: 0, end: 0.2 },
  { word: "cat", start: 0.2, end: 0.4 },
]);

describe("transcribeAudioWithConsensus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mockReconcileTranscripts.mockReturnValue(reconciledTranscript);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts Google and OpenAI transcription before waiting for either result", async () => {
    let resolveGoogle!: (value: TranscriptResponse) => void;
    mockGoogleTranscribe.mockReturnValue(
      new Promise<TranscriptResponse>((resolve) => {
        resolveGoogle = resolve;
      }),
    );
    mockOpenAITranscribe.mockResolvedValue(openAITranscript);

    const resultPromise = transcribeAudioWithConsensus(
      audioBuffer,
      "audio.wav",
      "english",
      "the cat",
    );

    expect(mockGoogleTranscribe).toHaveBeenCalledOnce();
    expect(mockOpenAITranscribe).toHaveBeenCalledOnce();

    resolveGoogle(googleTranscript);
    const result = await resultPromise;

    expect(mockReconcileTranscripts).toHaveBeenCalledWith(
      googleTranscript,
      openAITranscript,
      "the cat",
    );
    expect(result).toBe(reconciledTranscript);
  });

  it("falls back to Google when OpenAI transcription fails", async () => {
    mockGoogleTranscribe.mockResolvedValue(googleTranscript);
    mockOpenAITranscribe.mockRejectedValue(new Error("OpenAI unavailable"));

    const result = await transcribeAudioWithConsensus(
      audioBuffer,
      "audio.wav",
      "english",
      "the cat",
    );

    expect(result).toBe(googleTranscript);
    expect(mockReconcileTranscripts).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI when Google transcription fails", async () => {
    mockGoogleTranscribe.mockRejectedValue(new Error("Google unavailable"));
    mockOpenAITranscribe.mockResolvedValue(openAITranscript);

    const result = await transcribeAudioWithConsensus(
      audioBuffer,
      "audio.wav",
      "english",
      "the cat",
    );

    expect(result).toBe(openAITranscript);
    expect(mockReconcileTranscripts).not.toHaveBeenCalled();
  });

  it("throws when all transcription providers fail", async () => {
    mockGoogleTranscribe.mockRejectedValue(new Error("Google unavailable"));
    mockOpenAITranscribe.mockRejectedValue(new Error("OpenAI unavailable"));

    await expect(
      transcribeAudioWithConsensus(audioBuffer, "audio.wav", "english", "the cat"),
    ).rejects.toThrow("All transcription providers failed.");
  });
});
