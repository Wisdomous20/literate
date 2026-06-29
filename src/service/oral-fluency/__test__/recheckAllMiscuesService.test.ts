import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTx = {
  oralFluencyMiscue: {
    delete: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    createMany: vi.fn(),
  },
  oralFluencyBehavior: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  oralFluencyResult: {
    update: vi.fn(),
  },
  wordTimestamp: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
};

const mockPrisma = vi.hoisted(() => ({
  oralFluencyResult: { findUnique: vi.fn(), findFirst: vi.fn() },
  $transaction: vi.fn(),
}));

const mockCreateOralReadingService = vi.hoisted(() => vi.fn());
const mockInitPhoneticDict = vi.hoisted(() => vi.fn());
const mockAnalyzeOralFluency = vi.hoisted(() => vi.fn());
const mockDownloadTrustedAudio = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/service/oral-reading/createOralReadingService", () => ({
  createOralReadingService: mockCreateOralReadingService,
}));
vi.mock("../analysisService", () => ({
  analyzeOralFluency: mockAnalyzeOralFluency,
}));
vi.mock("@/service/media/downloadTrustedAudio", () => ({
  downloadTrustedAudio: mockDownloadTrustedAudio,
}));
vi.mock("@/utils/phoneticUtils", () => ({
  initPhoneticDict: mockInitPhoneticDict,
}));
vi.mock("../phoneticPostCorrection", () => ({
  phoneticPostCorrection: vi.fn((words) => words),
}));

import { recheckAllMiscuesService } from "../recheckAllMiscuesService";

function wordTimestamp(word: string, index: number) {
  return {
    id: `w-${index}`,
    sessionId: "s-1",
    word,
    startTime: index * 0.5,
    endTime: index * 0.5 + 0.4,
    confidence: null,
    index,
  };
}

function buildSession({
  transcript = "the cat",
  passage = "the cat",
  miscues = [],
}: {
  transcript?: string;
  passage?: string;
  miscues?: Array<{
    id: string;
    sessionId: string;
    miscueType:
      | "OMISSION"
      | "MISPRONUNCIATION"
      | "SUBSTITUTION"
      | "REVERSAL"
      | "TRANSPOSITION"
      | "INSERTION"
      | "SELF_CORRECTION"
      | "REPETITION";
    expectedWord: string;
    spokenWord: string | null;
    wordIndex: number;
    timestamp: number | null;
    isSelfCorrected: boolean;
  }>;
}) {
  const words = transcript.split(/\s+/).filter(Boolean);

  return {
    id: "s-1",
    assessmentId: "a-1",
    audioUrl: "https://example.com/audio.wav",
    transcript,
    wordsPerMinute: 80,
    accuracy: 90,
    totalWords: 2,
    totalMiscues: miscues.length,
    duration: 2,
    oralFluencyScore: 90,
    classificationLevel: "INSTRUCTIONAL",
    miscues,
    behaviors: [],
    wordTimestamps: words.map(wordTimestamp),
    assessment: {
      id: "a-1",
      passage: { content: passage, language: "english" },
      student: { class: { userId: "teacher-1" } },
    },
  };
}

describe("recheckAllMiscuesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateOralReadingService.mockResolvedValue({ success: true });
    mockInitPhoneticDict.mockResolvedValue(undefined);
    mockPrisma.$transaction.mockImplementation(
      (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
    );
    mockTx.oralFluencyMiscue.delete.mockResolvedValue({});
    mockTx.oralFluencyMiscue.deleteMany.mockResolvedValue({});
    mockTx.oralFluencyMiscue.update.mockResolvedValue({});
    mockTx.oralFluencyMiscue.createMany.mockResolvedValue({});
    mockTx.oralFluencyBehavior.deleteMany.mockResolvedValue({});
    mockTx.oralFluencyBehavior.createMany.mockResolvedValue({});
    mockTx.oralFluencyResult.update.mockResolvedValue({});
    mockTx.wordTimestamp.deleteMany.mockResolvedValue({});
    mockTx.wordTimestamp.createMany.mockResolvedValue({});
    mockAnalyzeOralFluency.mockReset();
    mockDownloadTrustedAudio.mockResolvedValue(Buffer.from([1, 2, 3]));
  });

  it("returns VALIDATION_ERROR when sessionId is empty", async () => {
    const result = await recheckAllMiscuesService("");

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.oralFluencyResult.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the session does not exist", async () => {
    mockPrisma.oralFluencyResult.findUnique.mockResolvedValue(null);

    const result = await recheckAllMiscuesService("missing");

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
  });

  it("deletes a current miscue when the recheck no longer detects it", async () => {
    const currentMiscue = {
      id: "m-1",
      sessionId: "s-1",
      miscueType: "MISPRONUNCIATION" as const,
      expectedWord: "cat",
      spokenWord: "kat",
      wordIndex: 1,
      timestamp: 0.5,
      isSelfCorrected: false,
    };

    mockPrisma.oralFluencyResult.findFirst.mockResolvedValue(
      buildSession({ miscues: [currentMiscue] }),
    );
    mockTx.oralFluencyMiscue.findMany.mockResolvedValue([]);

    const result = await recheckAllMiscuesService("s-1", "teacher-1");

    expect(result.success).toBe(true);
    expect(result.summary).toEqual({
      checked: 1,
      removed: 1,
      changed: 0,
      kept: 0,
      added: 0,
      reranTranscription: false,
    });
    expect(mockTx.oralFluencyMiscue.delete).toHaveBeenCalledWith({
      where: { id: "m-1" },
    });
    expect(result.analysis?.totalMiscues).toBe(0);
    expect(result.analysis?.oralFluencyScore).toBe(100);
  });

  it("updates a current miscue when recheck finds the same word with a better type", async () => {
    const currentMiscue = {
      id: "m-1",
      sessionId: "s-1",
      miscueType: "MISPRONUNCIATION" as const,
      expectedWord: "cat",
      spokenWord: "dog",
      wordIndex: 1,
      timestamp: 0.5,
      isSelfCorrected: false,
    };
    const updatedMiscue = {
      ...currentMiscue,
      miscueType: "SUBSTITUTION" as const,
    };

    mockPrisma.oralFluencyResult.findFirst.mockResolvedValue(
      buildSession({
        transcript: "the dog",
        passage: "the cat",
        miscues: [currentMiscue],
      }),
    );
    mockTx.oralFluencyMiscue.findMany.mockResolvedValue([updatedMiscue]);

    const result = await recheckAllMiscuesService("s-1", "teacher-1");

    expect(result.success).toBe(true);
    expect(result.summary).toEqual({
      checked: 1,
      removed: 0,
      changed: 1,
      kept: 0,
      added: 0,
      reranTranscription: false,
    });
    expect(mockTx.oralFluencyMiscue.update).toHaveBeenCalledWith({
      where: { id: "m-1" },
      data: expect.objectContaining({ miscueType: "SUBSTITUTION" }),
    });
    expect(result.analysis?.miscues[0].miscueType).toBe("SUBSTITUTION");
  });

  it("does not create new miscues during the cleanup pass", async () => {
    mockPrisma.oralFluencyResult.findFirst.mockResolvedValue(
      buildSession({
        transcript: "the bat",
        passage: "the cat",
        miscues: [],
      }),
    );
    mockTx.oralFluencyMiscue.findMany.mockResolvedValue([]);

    const result = await recheckAllMiscuesService("s-1", "teacher-1");

    expect(result.success).toBe(true);
    expect(result.summary).toEqual({
      checked: 0,
      removed: 0,
      changed: 0,
      kept: 0,
      added: 0,
      reranTranscription: false,
    });
    expect(mockTx.oralFluencyMiscue.delete).not.toHaveBeenCalled();
    expect(mockTx.oralFluencyMiscue.update).not.toHaveBeenCalled();
    expect(result.analysis?.miscues).toEqual([]);
  });

  it("rejects access when the session belongs to a different teacher", async () => {
    mockPrisma.oralFluencyResult.findFirst.mockResolvedValue(null);

    const result = await recheckAllMiscuesService("s-1", "teacher-99");

    expect(result.success).toBe(false);
    expect(result.code).toBe("FORBIDDEN");
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("falls back to audio retranscription when transcript recheck is a no-op", async () => {
    const currentMiscue = {
      id: "m-1",
      sessionId: "s-1",
      miscueType: "SUBSTITUTION" as const,
      expectedWord: "cat",
      spokenWord: "dog",
      wordIndex: 1,
      timestamp: 0.5,
      isSelfCorrected: false,
    };

    mockPrisma.oralFluencyResult.findFirst.mockResolvedValue(
      buildSession({
        transcript: "the dog",
        passage: "the cat",
        miscues: [currentMiscue],
      }),
    );
    mockTx.oralFluencyMiscue.findMany.mockResolvedValue([currentMiscue]);
    mockAnalyzeOralFluency.mockResolvedValue({
      transcript: "the cat",
      wordsPerMinute: 82,
      accuracy: 100,
      totalWords: 2,
      totalMiscues: 0,
      duration: 2,
      oralFluencyScore: 100,
      classificationLevel: "INDEPENDENT",
      miscues: [],
      behaviors: [],
      alignedWords: [
        {
          expected: "the",
          spoken: "the",
          expectedIndex: 0,
          spokenIndex: 0,
          timestamp: 0,
          endTimestamp: 0.4,
          confidence: null,
          match: "EXACT",
        },
        {
          expected: "cat",
          spoken: "cat",
          expectedIndex: 1,
          spokenIndex: 1,
          timestamp: 0.5,
          endTimestamp: 0.9,
          confidence: null,
          match: "EXACT",
        },
      ],
    });

    const result = await recheckAllMiscuesService("s-1", "teacher-1");

    expect(result.success).toBe(true);
    expect(result.summary).toEqual({
      checked: 1,
      removed: 1,
      changed: 0,
      kept: 0,
      added: 0,
      reranTranscription: true,
    });
    expect(mockDownloadTrustedAudio).toHaveBeenCalledWith(
      "https://example.com/audio.wav",
    );
    expect(mockAnalyzeOralFluency).toHaveBeenCalledOnce();
    expect(mockTx.oralFluencyMiscue.deleteMany).toHaveBeenCalledWith({
      where: { sessionId: "s-1" },
    });
    expect(result.analysis?.transcript).toBe("the cat");
    expect(result.analysis?.totalMiscues).toBe(0);
  });
});
