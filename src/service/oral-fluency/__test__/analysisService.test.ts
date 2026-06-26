import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTranscribeAudioWithConsensus = vi.hoisted(() => vi.fn());
const mockAlignWords = vi.hoisted(() => vi.fn());
const mockPhoneticPostCorrection = vi.hoisted(() => vi.fn());
const mockDetectMiscues = vi.hoisted(() => vi.fn());
const mockDetectBehaviors = vi.hoisted(() => vi.fn());
const mockAnalyzePitch = vi.hoisted(() => vi.fn());
const mockPostCorrectTranscription = vi.hoisted(() => vi.fn());
const mockInitPhoneticDict = vi.hoisted(() => vi.fn());

vi.mock("@/service/transcription/dualTranscriptionService", () => ({
  transcribeAudioWithConsensus: mockTranscribeAudioWithConsensus,
}));
vi.mock("../alignmentService", () => ({
  alignWords: mockAlignWords,
}));
vi.mock("../phoneticPostCorrection", () => ({
  phoneticPostCorrection: mockPhoneticPostCorrection,
}));
vi.mock("../miscueDetectionService", () => ({
  detectMiscues: mockDetectMiscues,
}));
vi.mock("../behaviorDetectionService", () => ({
  detectBehaviors: mockDetectBehaviors,
}));
vi.mock("../pitchAnalysisService", () => ({
  analyzePitch: mockAnalyzePitch,
}));
vi.mock("@/utils/postCorrectTranscription", () => ({
  postCorrectTranscription: mockPostCorrectTranscription,
}));
vi.mock("@/utils/phoneticUtils", () => ({
  initPhoneticDict: mockInitPhoneticDict,
}));

import { analyzeOralFluency } from "../analysisService";

describe("analyzeOralFluency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInitPhoneticDict.mockResolvedValue(undefined);
    mockPhoneticPostCorrection.mockImplementation((words) => words);
    mockDetectBehaviors.mockResolvedValue([]);
  });

  it("treats a silent recording as unread even if STT hallucinates passage words", async () => {
    mockTranscribeAudioWithConsensus.mockResolvedValue({
      text: "the cat sat on the mat",
      words: [
        { word: "the", start: 0, end: 0.2 },
        { word: "cat", start: 0.2, end: 0.4 },
      ],
      segments: [],
      duration: 2,
    });
    mockAnalyzePitch.mockReturnValue({
      pitchCoV: 0,
      meanF0: 0,
      voicedFrames: 0,
      totalFrames: 90,
      voicedRatio: 0,
    });
    mockPostCorrectTranscription.mockReturnValue([]);
    mockAlignWords.mockReturnValue([
      {
        expected: "the",
        spoken: null,
        expectedIndex: 0,
        spokenIndex: null,
        timestamp: null,
        endTimestamp: null,
        confidence: null,
        match: "OMISSION",
      },
      {
        expected: "cat",
        spoken: null,
        expectedIndex: 1,
        spokenIndex: null,
        timestamp: null,
        endTimestamp: null,
        confidence: null,
        match: "OMISSION",
      },
    ]);
    mockDetectMiscues.mockReturnValue([
      {
        miscueType: "OMISSION",
        expectedWord: "the",
        spokenWord: null,
        wordIndex: 0,
        timestamp: null,
        isSelfCorrected: false,
      },
      {
        miscueType: "OMISSION",
        expectedWord: "cat",
        spokenWord: null,
        wordIndex: 1,
        timestamp: null,
        isSelfCorrected: false,
      },
    ]);

    const result = await analyzeOralFluency(
      Buffer.from("audio"),
      "audio.wav",
      "the cat",
      "english",
    );

    expect(result.transcript).toBe("");
    expect(result.totalMiscues).toBe(2);
    expect(result.oralFluencyScore).toBe(0);
    expect(result.classificationLevel).toBe("FRUSTRATION");
  });
});
