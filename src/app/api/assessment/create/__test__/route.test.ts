import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockCreateAssessmentService = vi.hoisted(() => vi.fn());

vi.mock("@/service/assessment/createAssessmentService", () => ({
  createAssessmentService: mockCreateAssessmentService,
}));

import { POST } from "../route";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/assessment/create", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/assessment/create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when studentId is missing", async () => {
    const res = await POST(makeRequest({ passageId: "p-1", type: "COMPREHENSION" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when passageId is missing", async () => {
    const res = await POST(makeRequest({ studentId: "s-1", type: "COMPREHENSION" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when type is missing", async () => {
    const res = await POST(makeRequest({ studentId: "s-1", passageId: "p-1" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when the service reports failure", async () => {
    mockCreateAssessmentService.mockResolvedValue({
      success: false,
      error: "Duplicate assessment",
    });

    const res = await POST(
      makeRequest({ studentId: "s-1", passageId: "p-1", type: "COMPREHENSION" }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Duplicate assessment");
  });

  it("returns 201 with the created assessment on success", async () => {
    const assessment = { id: "assessment-1", studentId: "s-1", passageId: "p-1" };
    mockCreateAssessmentService.mockResolvedValue({ success: true, assessment });

    const res = await POST(
      makeRequest({ studentId: "s-1", passageId: "p-1", type: "COMPREHENSION" }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.assessment).toMatchObject({ id: "assessment-1" });
  });

  it("returns 500 when an unexpected error is thrown", async () => {
    mockCreateAssessmentService.mockRejectedValue(new Error("Unexpected"));

    const res = await POST(
      makeRequest({ studentId: "s-1", passageId: "p-1", type: "COMPREHENSION" }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
