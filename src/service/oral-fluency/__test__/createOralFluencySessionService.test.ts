import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTx = {
  oralFluencySession: { update: vi.fn() },
  wordTimestamp: { createMany: vi.fn() },
  oralFluencyMiscue: { createMany: vi.fn() },
  oralFluencyBehavior: { createMany: vi.fn() },
};

const mockPrisma = vi.hoisted(() => ({
  assessment: { findUnique: vi.fn() },
  oralFluencySession: { create: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
}));

const mockAnalyzeOralFluency = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("../analysisService", () => ({ analyzeOralFluency: mockAnalyzeOralFluency }));

import { createOralFluencySessionService } from "../createOralFluencySessionService";

const baseAssessment = {
  id: "a-1",
  passage: { content: "The cat sat on the mat.", language: "english" },
};

const baseAnalysis = {
  transcript: "the cat sat on the mat",
  wordsPerMinute: 90,
  accuracy: 100,
  totalWords: 6,
  totalMiscues: 0,
  duration: 4.0,
  oralFluencyScore: 100,
  classificationLevel: "INDEPENDENT",
  miscues: [],
  behaviors: [],
  alignedWords: [
    { spoken: "the", timestamp: 0.0, endTimestamp: 0.3, confidence: 0.9 },
    { spoken: "cat", timestamp: 0.3, endTimestamp: 0.6, confidence: 0.9 },
  ],
};

describe("createOralFluencySessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) =>
      fn(mockTx),
    );
    mockTx.oralFluencySession.update.mockResolvedValue({});
    mockTx.wordTimestamp.createMany.mockResolvedValue({});
    mockTx.oralFluencyMiscue.createMany.mockResolvedValue({});
    mockTx.oralFluencyBehavior.createMany.mockResolvedValue({});
  });

  it("returns VALIDATION_ERROR when assessmentId is missing", async () => {
    const result = await createOralFluencySessionService({
      assessmentId: "",
      audioBuffer: Buffer.from("audio"),
      fileName: "audio.wav",
      audioUrl: "http://example.com/audio.wav",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.assessment.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when assessment does not exist", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(null);

    const result = await createOralFluencySessionService({
      assessmentId: "a-1",
      audioBuffer: Buffer.from("audio"),
      fileName: "audio.wav",
      audioUrl: "http://example.com/audio.wav",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
    expect(mockPrisma.oralFluencySession.create).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when assessment has no passage", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue({ id: "a-1", passage: null });

    const result = await createOralFluencySessionService({
      assessmentId: "a-1",
      audioBuffer: Buffer.from("audio"),
      fileName: "audio.wav",
      audioUrl: "http://example.com/audio.wav",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
  });

  it("creates the session with PROCESSING status before running analysis", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(baseAssessment);
    mockPrisma.oralFluencySession.create.mockResolvedValue({ id: "s-1" });
    mockAnalyzeOralFluency.mockResolvedValue(baseAnalysis);

    await createOralFluencySessionService({
      assessmentId: "a-1",
      audioBuffer: Buffer.from("audio"),
      fileName: "audio.wav",
      audioUrl: "http://example.com/audio.wav",
    });

    expect(mockPrisma.oralFluencySession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PROCESSING" }),
      }),
    );
  });

  it("returns success with sessionId and analysis on happy path", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(baseAssessment);
    mockPrisma.oralFluencySession.create.mockResolvedValue({ id: "s-1" });
    mockAnalyzeOralFluency.mockResolvedValue(baseAnalysis);

    const result = await createOralFluencySessionService({
      assessmentId: "a-1",
      audioBuffer: Buffer.from("audio"),
      fileName: "audio.wav",
      audioUrl: "http://example.com/audio.wav",
    });

    expect(result.success).toBe(true);
    expect(result.sessionId).toBe("s-1");
    expect(result.analysis).toMatchObject({ totalWords: 6 });
  });

  it("persists analysis results inside a transaction", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(baseAssessment);
    mockPrisma.oralFluencySession.create.mockResolvedValue({ id: "s-1" });
    mockAnalyzeOralFluency.mockResolvedValue(baseAnalysis);

    await createOralFluencySessionService({
      assessmentId: "a-1",
      audioBuffer: Buffer.from("audio"),
      fileName: "audio.wav",
      audioUrl: "http://example.com/audio.wav",
    });

    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockTx.oralFluencySession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLETED", transcript: baseAnalysis.transcript }),
      }),
    );
  });

  it("persists word timestamps from alignedWords that have a spoken word and timestamp", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(baseAssessment);
    mockPrisma.oralFluencySession.create.mockResolvedValue({ id: "s-1" });
    mockAnalyzeOralFluency.mockResolvedValue(baseAnalysis);

    await createOralFluencySessionService({
      assessmentId: "a-1",
      audioBuffer: Buffer.from("audio"),
      fileName: "audio.wav",
      audioUrl: "http://example.com/audio.wav",
    });

    expect(mockTx.wordTimestamp.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ word: "the" })]) }),
    );
  });

  it("marks session as FAILED and returns ANALYSIS_FAILED when analysis throws", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(baseAssessment);
    mockPrisma.oralFluencySession.create.mockResolvedValue({ id: "s-1" });
    mockAnalyzeOralFluency.mockRejectedValue(new Error("STT failure"));
    mockPrisma.oralFluencySession.update.mockResolvedValue({});

    const result = await createOralFluencySessionService({
      assessmentId: "a-1",
      audioBuffer: Buffer.from("audio"),
      fileName: "audio.wav",
      audioUrl: "http://example.com/audio.wav",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("ANALYSIS_FAILED");
    expect(mockPrisma.oralFluencySession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED" } }),
    );
  });
});
