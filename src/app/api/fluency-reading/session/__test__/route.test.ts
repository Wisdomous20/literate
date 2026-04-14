import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  oralFluencySession: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET } from "../route";

function makeRequest(id?: string) {
  const url = id
    ? `http://localhost/api/fluency-reading/session?id=${id}`
    : "http://localhost/api/fluency-reading/session";
  return new NextRequest(url);
}

const baseSession = {
  id: "session-1",
  assessmentId: "assessment-1",
  status: "COMPLETED",
  miscues: [],
  behaviors: [],
  wordTimestamps: [],
  assessment: { id: "assessment-1" },
};

describe("GET /api/fluency-reading/session", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when id query param is missing", async () => {
    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Missing session id/i);
  });

  it("returns 404 when the session does not exist", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("session-999"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it("returns the session data on success", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue(baseSession);

    const res = await GET(makeRequest("session-1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe("session-1");
    expect(data.assessmentId).toBe("assessment-1");
  });

  it("returns 500 when prisma throws", async () => {
    mockPrisma.oralFluencySession.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest("session-1"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toMatch(/Failed to fetch session/i);
  });
});
