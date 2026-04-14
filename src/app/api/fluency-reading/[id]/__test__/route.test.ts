import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockCreateAssessmentService = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  oralFluencySession: { create: vi.fn() },
}));
const mockTranscriptionQueue = vi.hoisted(() => ({ add: vi.fn() }));

vi.mock("@/service/assessment/createAssessmentService", () => ({
  createAssessmentService: mockCreateAssessmentService,
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/queues", () => ({ transcriptionQueue: mockTranscriptionQueue }));

import { POST } from "../route";

// JSDOM hangs when a File object is used as a FormData body in NextRequest.
// Using plain strings avoids the serialization issue; routes use audioFile.name
// with a fallback so behavior is identical.
function makeFormDataRequest(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return new NextRequest("http://localhost/api/fluency-reading/session", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/fluency-reading/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when studentId is missing", async () => {
    const req = makeFormDataRequest({ passageId: "p-1", audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when passageId is missing", async () => {
    const req = makeFormDataRequest({ studentId: "s-1", audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when audio field is missing", async () => {
    const req = makeFormDataRequest({ studentId: "s-1", passageId: "p-1" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when assessment creation fails", async () => {
    mockCreateAssessmentService.mockResolvedValue({
      success: false,
      error: "Daily limit exceeded",
    });

    const req = makeFormDataRequest({ studentId: "s-1", passageId: "p-1", audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Daily limit exceeded");
  });

  it("creates a pending session, enqueues transcription, and returns 202", async () => {
    mockCreateAssessmentService.mockResolvedValue({
      success: true,
      assessment: { id: "assessment-1" },
    });
    mockPrisma.oralFluencySession.create.mockResolvedValue({ id: "session-1" });
    mockTranscriptionQueue.add.mockResolvedValue({});

    const req = makeFormDataRequest({ studentId: "s-1", passageId: "p-1", audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.assessmentId).toBe("assessment-1");
    expect(data.sessionId).toBe("session-1");
    expect(data.status).toBe("PENDING");
    expect(mockPrisma.oralFluencySession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assessmentId: "assessment-1", status: "PENDING" }),
      }),
    );
    expect(mockTranscriptionQueue.add).toHaveBeenCalledOnce();
  });

  it("returns 500 on unexpected error", async () => {
    mockCreateAssessmentService.mockRejectedValue(new Error("Unexpected"));

    const req = makeFormDataRequest({ studentId: "s-1", passageId: "p-1", audio: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
  });
});
