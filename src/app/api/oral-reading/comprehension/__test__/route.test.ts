import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  assessment: { findUnique: vi.fn() },
  comprehensionTest: { create: vi.fn() },
}));
const mockGradingQueue = vi.hoisted(() => ({ add: vi.fn() }));
const mockOralReadingLevelQueue = vi.hoisted(() => ({ add: vi.fn() }));
const mockClassifyComprehensionLevel = vi.hoisted(() => vi.fn());
const mockCreateOralReadingService = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/queues", () => ({
  gradingQueue: mockGradingQueue,
  oralReadingLevelQueue: mockOralReadingLevelQueue,
}));
vi.mock("@/service/comprehension-test/classifyComprehensionLevel", () => ({
  default: mockClassifyComprehensionLevel,
}));
vi.mock("@/service/oral-reading/createOralReadingService", () => ({
  createOralReadingService: mockCreateOralReadingService,
}));
vi.mock("@/generated/prisma/enums", () => ({
  Tags: { LITERAL: "LITERAL", INFERENTIAL: "INFERENTIAL", CRITICAL: "CRITICAL" },
}));

import { POST } from "../route";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/oral-reading/comprehension", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const mcQuestion = {
  id: "q-1",
  type: "MULTIPLE_CHOICE",
  questionText: "What happened first?",
  correctAnswer: "A",
  tags: "LITERAL",
};

const assessmentWithQuiz = {
  id: "assessment-1",
  passage: {
    quiz: {
      id: "quiz-1",
      questions: [mcQuestion],
    },
  },
};

describe("POST /api/oral-reading/comprehension", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when assessmentId is missing", async () => {
    const res = await POST(makeRequest({ answers: [{ questionId: "q-1", answer: "A" }] }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Missing required fields/i);
  });

  it("returns 400 when answers array is empty", async () => {
    const res = await POST(makeRequest({ assessmentId: "assessment-1", answers: [] }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Missing required fields/i);
  });

  it("returns 400 when answers have invalid format", async () => {
    const res = await POST(
      makeRequest({
        assessmentId: "assessment-1",
        answers: [{ badField: "nope" }],
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/questionId and answer/i);
  });

  it("returns 404 when the assessment or quiz is not found", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        assessmentId: "assessment-1",
        answers: [{ questionId: "q-1", answer: "A" }],
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it("grades MC answers and calls createOralReadingService when no essays", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(assessmentWithQuiz);
    mockClassifyComprehensionLevel.mockReturnValue("HIGH");
    mockPrisma.comprehensionTest.create.mockResolvedValue({ id: "ct-1" });
    mockCreateOralReadingService.mockResolvedValue({ success: true, level: "INDEPENDENT" });

    const res = await POST(
      makeRequest({
        assessmentId: "assessment-1",
        answers: [{ questionId: "q-1", answer: "A" }],
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.score).toBe(1);
    expect(data.essaysPending).toBe(false);
    expect(mockCreateOralReadingService).toHaveBeenCalledOnce();
  });

  it("enqueues oral reading level job when essays are pending", async () => {
    const essayQuestion = {
      ...mcQuestion,
      id: "q-2",
      type: "ESSAY",
      correctAnswer: null,
    };
    mockPrisma.assessment.findUnique.mockResolvedValue({
      ...assessmentWithQuiz,
      passage: { quiz: { id: "quiz-1", questions: [essayQuestion] } },
    });
    mockClassifyComprehensionLevel.mockReturnValue("LOW");
    mockPrisma.comprehensionTest.create.mockResolvedValue({ id: "ct-1" });
    mockGradingQueue.add.mockResolvedValue({});
    mockOralReadingLevelQueue.add.mockResolvedValue({});

    const res = await POST(
      makeRequest({
        assessmentId: "assessment-1",
        answers: [{ questionId: "q-2", answer: "My essay" }],
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.essaysPending).toBe(true);
    expect(mockGradingQueue.add).toHaveBeenCalledOnce();
    expect(mockOralReadingLevelQueue.add).toHaveBeenCalledOnce();
  });

  it("returns 500 on unexpected error", async () => {
    mockPrisma.assessment.findUnique.mockRejectedValue(new Error("DB down"));

    const res = await POST(
      makeRequest({
        assessmentId: "assessment-1",
        answers: [{ questionId: "q-1", answer: "A" }],
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
  });
});
