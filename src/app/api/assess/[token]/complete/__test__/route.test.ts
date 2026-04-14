import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  assessmentLink: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { POST } from "../route";

function makeRequest(token: string) {
  return new NextRequest(`http://localhost/api/assess/${token}/complete`, {
    method: "POST",
  });
}

describe("POST /api/assess/[token]/complete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when the link does not exist", async () => {
    mockPrisma.assessmentLink.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("bad-token"), {
      params: Promise.resolve({ token: "bad-token" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it("returns 200 with already-used message when link is already marked used", async () => {
    mockPrisma.assessmentLink.findUnique.mockResolvedValue({
      id: "link-1",
      used: true,
    });

    const res = await POST(makeRequest("used-token"), {
      params: Promise.resolve({ token: "used-token" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.assessmentLink.update).not.toHaveBeenCalled();
  });

  it("marks link as used and returns success", async () => {
    mockPrisma.assessmentLink.findUnique.mockResolvedValue({
      id: "link-1",
      used: false,
    });
    mockPrisma.assessmentLink.update.mockResolvedValue({});

    const res = await POST(makeRequest("valid-token"), {
      params: Promise.resolve({ token: "valid-token" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.assessmentLink.update).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: { used: true },
    });
  });

  it("returns 500 when prisma throws", async () => {
    mockPrisma.assessmentLink.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await POST(makeRequest("valid-token"), {
      params: Promise.resolve({ token: "valid-token" }),
    });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
