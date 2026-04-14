import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockCreateAssessmentService = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  passage: { findUnique: vi.fn() },
  comprehensionTest: { create: vi.fn() },
}));
const mockGradingQueue = vi.hoisted(() => ({ add: vi.fn() }));
const mockClassifyComprehensionLevel = vi.hoisted(() => vi.fn());

vi.mock("@/service/assessment/createAssessmentService", () => ({
  createAssessmentService: mockCreateAssessmentService,
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/queues", () => ({ gradingQueue: mockGradingQueue }));
vi.mock("@/service/comprehension-test/classifyComprehensionLevel", () => ({
  default: mockClassifyComprehensionLevel,
}));
vi.mock("@/generated/prisma/enums", () => ({
  Tags: { LITERAL: "LITERAL", INFERENTIAL: "INFERENTIAL", CRITICAL: "CRITICAL" },
}));

import { POST } from "../route";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/comprehension/submit", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const mcQuestion = {
  id: "q-1",
  type: "MULTIPLE_CHOICE",
  questionText: "What is the main idea?",
  correctAnswer: "Unity",
  tags: "LITERAL",
};

describe("POST /api/comprehension/submit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makeRequest({ studentId: "s-1", passageId: "p-1" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Missing required fields/i);
  });

  it("returns 400 when answers is not an array", async () => {
    const res = await POST(
      makeRequest({ studentId: "s-1", passageId: "p-1", answers: "bad" }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
  });

  it("returns 400 when assessment creation fails", async () => {
    mockCreateAssessmentService.mockResolvedValue({
      success: false,
      error: "Daily limit reached",
    });

    const res = await POST(
      makeRequest({ studentId: "s-1", passageId: "p-1", answers: [] }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Daily limit reached");
  });

  it("returns 400 when no quiz is found for the passage", async () => {
    mockCreateAssessmentService.mockResolvedValue({
      success: true,
      assessment: { id: "assessment-1" },
    });
    mockPrisma.passage.findUnique.mockResolvedValue({ quiz: null });

    const res = await POST(
      makeRequest({ studentId: "s-1", passageId: "p-1", answers: [] }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/No quiz/i);
  });

  it("grades multiple-choice answers and returns the score", async () => {
    mockCreateAssessmentService.mockResolvedValue({
      success: true,
      assessment: { id: "assessment-1" },
    });
    mockPrisma.passage.findUnique.mockResolvedValue({
      quiz: { id: "quiz-1", questions: [mcQuestion] },
    });
    mockClassifyComprehensionLevel.mockReturnValue("AVERAGE");
    mockPrisma.comprehensionTest.create.mockResolvedValue({ id: "ct-1" });

    const res = await POST(
      makeRequest({
        studentId: "s-1",
        passageId: "p-1",
        answers: [{ questionId: "q-1", answer: "Unity" }],
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.score).toBe(1);
    expect(data.totalItems).toBe(1);
    expect(data.percentage).toBe(100);
    expect(data.essaysPending).toBe(false);
  });

  it("marks essays as pending and enqueues grading job", async () => {
    const essayQuestion = {
      ...mcQuestion,
      id: "q-2",
      type: "ESSAY",
      correctAnswer: null,
    };
    mockCreateAssessmentService.mockResolvedValue({
      success: true,
      assessment: { id: "assessment-1" },
    });
    mockPrisma.passage.findUnique.mockResolvedValue({
      quiz: { id: "quiz-1", questions: [essayQuestion] },
    });
    mockClassifyComprehensionLevel.mockReturnValue("LOW");
    mockPrisma.comprehensionTest.create.mockResolvedValue({ id: "ct-1" });
    mockGradingQueue.add.mockResolvedValue({});

    const res = await POST(
      makeRequest({
        studentId: "s-1",
        passageId: "p-1",
        answers: [{ questionId: "q-2", answer: "My essay answer" }],
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.essaysPending).toBe(true);
    expect(mockGradingQueue.add).toHaveBeenCalledOnce();
  });

  it("returns 500 on unexpected error", async () => {
    mockCreateAssessmentService.mockRejectedValue(new Error("Unexpected"));

    const res = await POST(
      makeRequest({ studentId: "s-1", passageId: "p-1", answers: [] }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
  });
});
