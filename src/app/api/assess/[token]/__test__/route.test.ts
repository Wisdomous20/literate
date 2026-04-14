import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  assessmentLink: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET } from "../route";

const baseLink = {
  id: "link-1",
  token: "valid-token",
  used: false,
  expiresAt: new Date(Date.now() + 60_000),
  assessment: {
    id: "assessment-1",
    type: "COMPREHENSION",
    student: { id: "student-1", name: "Juan", level: "GRADE_1" },
    passage: {
      id: "passage-1",
      title: "Sample Passage",
      content: "Once upon a time...",
      language: "ENGLISH",
      level: "GRADE_1",
      testType: "COMPREHENSION",
      quiz: {
        id: "quiz-1",
        questions: [],
      },
    },
    comprehension: null,
    oralFluency: null,
  },
};

function makeRequest(token: string) {
  return new NextRequest(`http://localhost/api/assess/${token}`);
}

describe("GET /api/assess/[token]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when the link does not exist", async () => {
    mockPrisma.assessmentLink.findUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("bad-token"), {
      params: Promise.resolve({ token: "bad-token" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it("returns 410 when the link has already been used", async () => {
    mockPrisma.assessmentLink.findUnique.mockResolvedValue({
      ...baseLink,
      used: true,
    });

    const res = await GET(makeRequest("valid-token"), {
      params: Promise.resolve({ token: "valid-token" }),
    });
    const data = await res.json();

    expect(res.status).toBe(410);
    expect(data.success).toBe(false);
  });

  it("returns 410 when the link has expired", async () => {
    mockPrisma.assessmentLink.findUnique.mockResolvedValue({
      ...baseLink,
      expiresAt: new Date(Date.now() - 1),
    });

    const res = await GET(makeRequest("valid-token"), {
      params: Promise.resolve({ token: "valid-token" }),
    });
    const data = await res.json();

    expect(res.status).toBe(410);
    expect(data.success).toBe(false);
  });

  it("marks link as used and returns 410 when assessment is already completed", async () => {
    mockPrisma.assessmentLink.findUnique.mockResolvedValue({
      ...baseLink,
      assessment: {
        ...baseLink.assessment,
        type: "COMPREHENSION",
        comprehension: { score: 5, totalItems: 10, classificationLevel: "AVERAGE" },
      },
    });
    mockPrisma.assessmentLink.update.mockResolvedValue({});

    const res = await GET(makeRequest("valid-token"), {
      params: Promise.resolve({ token: "valid-token" }),
    });
    const data = await res.json();

    expect(res.status).toBe(410);
    expect(data.success).toBe(false);
    expect(mockPrisma.assessmentLink.update).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: { used: true },
    });
  });

  it("returns assessment data on a valid, unused, unexpired link", async () => {
    mockPrisma.assessmentLink.findUnique.mockResolvedValue(baseLink);

    const res = await GET(makeRequest("valid-token"), {
      params: Promise.resolve({ token: "valid-token" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.assessmentId).toBe("assessment-1");
    expect(data.student).toMatchObject({ id: "student-1", name: "Juan" });
  });

  it("returns 500 when prisma throws", async () => {
    mockPrisma.assessmentLink.findUnique.mockRejectedValue(new Error("DB down"));

    const res = await GET(makeRequest("valid-token"), {
      params: Promise.resolve({ token: "valid-token" }),
    });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
