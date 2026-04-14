import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  assessment: { findUnique: vi.fn() },
  oralFluencySession: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));
const mockTranscriptionQueue = vi.hoisted(() => ({
  add: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/queues", () => ({ transcriptionQueue: mockTranscriptionQueue }));

import { POST, GET } from "../route";

// JSDOM hangs when a File object is used as a FormData body in NextRequest.
// Using plain strings avoids the serialization issue; routes use audioFile.name
// with a fallback so behavior is identical.
function makePostRequest(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return new NextRequest("http://localhost/api/oral-reading/transcribe", {
    method: "POST",
    body: formData,
  });
}

function makeGetRequest(assessmentId?: string) {
  const url = assessmentId
    ? `http://localhost/api/oral-reading/transcribe?assessmentId=${assessmentId}`
    : "http://localhost/api/oral-reading/transcribe";
  return new NextRequest(url);
}

describe("POST /api/oral-reading/transcribe", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when assessmentId is missing", async () => {
    const req = makePostRequest({ audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when audio file is missing", async () => {
    const req = makePostRequest({ assessmentId: "assessment-1" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 404 when the assessment does not exist", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(null);

    const req = makePostRequest({ assessmentId: "assessment-999", audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/Assessment not found/i);
  });

  it("creates a new session when none exists and returns 202", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue({ id: "assessment-1" });
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue(null);
    mockPrisma.oralFluencySession.create.mockResolvedValue({ id: "session-1" });
    mockTranscriptionQueue.add.mockResolvedValue({ id: "job-1" });

    const req = makePostRequest({ assessmentId: "assessment-1", audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.success).toBe(true);
    expect(data.sessionId).toBe("session-1");
    expect(data.status).toBe("PENDING");
    expect(mockPrisma.oralFluencySession.create).toHaveBeenCalledOnce();
    expect(mockPrisma.oralFluencySession.update).not.toHaveBeenCalled();
  });

  it("updates an existing session instead of creating a new one", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue({ id: "assessment-1" });
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue({ id: "existing-session" });
    mockPrisma.oralFluencySession.update.mockResolvedValue({});
    mockTranscriptionQueue.add.mockResolvedValue({ id: "job-1" });

    const req = makePostRequest({ assessmentId: "assessment-1", audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.sessionId).toBe("existing-session");
    expect(mockPrisma.oralFluencySession.update).toHaveBeenCalledOnce();
    expect(mockPrisma.oralFluencySession.create).not.toHaveBeenCalled();
  });

  it("enqueues a transcription job and includes the job id in the response", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue({ id: "assessment-1" });
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue(null);
    mockPrisma.oralFluencySession.create.mockResolvedValue({ id: "session-1" });
    mockTranscriptionQueue.add.mockResolvedValue({ id: "job-42" });

    const req = makePostRequest({ assessmentId: "assessment-1", audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(data.jobId).toBe("job-42");
    expect(mockTranscriptionQueue.add).toHaveBeenCalledWith(
      expect.stringContaining("assessment-1"),
      expect.objectContaining({ assessmentId: "assessment-1" }),
      expect.any(Object),
    );
  });

  it("returns 500 on unexpected error", async () => {
    mockPrisma.assessment.findUnique.mockRejectedValue(new Error("DB error"));

    const req = makePostRequest({ assessmentId: "assessment-1", audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
  });
});

describe("GET /api/oral-reading/transcribe", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when assessmentId is missing", async () => {
    const res = await GET(makeGetRequest());
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 404 when the session does not exist", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue(null);

    const res = await GET(makeGetRequest("assessment-1"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it("returns PENDING status when session is still processing", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue({
      id: "session-1",
      status: "PENDING",
      miscues: [],
      behaviors: [],
      wordTimestamps: [],
    });

    const res = await GET(makeGetRequest("assessment-1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("PENDING");
  });

  it("returns FAILED status when transcription failed", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue({
      id: "session-1",
      status: "FAILED",
      miscues: [],
      behaviors: [],
      wordTimestamps: [],
    });

    const res = await GET(makeGetRequest("assessment-1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("FAILED");
    expect(data.error).toBeTruthy();
  });

  it("returns full analysis when session is completed", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue({
      id: "session-1",
      status: "COMPLETED",
      transcript: "The dog ran fast.",
      wordsPerMinute: 120,
      accuracy: 0.95,
      totalWords: 10,
      totalMiscues: 1,
      duration: 5,
      classificationLevel: "INDEPENDENT",
      oralFluencyScore: 90,
      miscues: [
        {
          miscueType: "SUBSTITUTION",
          expectedWord: "ran",
          spokenWord: "run",
          wordIndex: 2,
          timestamp: 1.5,
          isSelfCorrected: false,
        },
      ],
      behaviors: [],
      wordTimestamps: [
        {
          word: "The",
          startTime: 0,
          endTime: 0.3,
          confidence: 0.99,
          index: 0,
        },
      ],
    });

    const res = await GET(makeGetRequest("assessment-1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("COMPLETED");
    expect(data.analysis.wordsPerMinute).toBe(120);
    expect(data.analysis.miscues).toHaveLength(1);
    expect(data.analysis.alignedWords).toHaveLength(1);
  });
});
