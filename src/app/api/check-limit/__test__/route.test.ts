import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.hoisted(() => vi.fn());
const mockGetDailyLimitStatus = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));
vi.mock("@/service/assessment/checkDailyLimitService", () => ({
  getDailyLimitStatus: mockGetDailyLimitStatus,
}));

import { GET } from "../route";

function makeRequest() {
  return new NextRequest("http://localhost/api/check-limit");
}

describe("GET /api/check-limit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when there is no active session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 when the session has no user id", async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns the daily limit status for a free user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDailyLimitStatus.mockResolvedValue({
      isFreeUser: true,
      usage: { ORAL_READING: 1, COMPREHENSION: 0, READING_FLUENCY: 0 },
      limits: { ORAL_READING: 3, COMPREHENSION: 3, READING_FLUENCY: 3 },
      remaining: { ORAL_READING: 2, COMPREHENSION: 3, READING_FLUENCY: 3 },
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isFreeUser).toBe(true);
    expect(data.usage.ORAL_READING).toBe(1);
    expect(data.limits.ORAL_READING).toBe(3);
    expect(data.remaining.ORAL_READING).toBe(2);
  });

  it("serializes Infinity limits as -1 for paid users", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDailyLimitStatus.mockResolvedValue({
      isFreeUser: false,
      usage: { ORAL_READING: 5, COMPREHENSION: 2, READING_FLUENCY: 1 },
      limits: {
        ORAL_READING: Infinity,
        COMPREHENSION: Infinity,
        READING_FLUENCY: Infinity,
      },
      remaining: {
        ORAL_READING: Infinity,
        COMPREHENSION: Infinity,
        READING_FLUENCY: Infinity,
      },
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.limits.ORAL_READING).toBe(-1);
    expect(data.limits.COMPREHENSION).toBe(-1);
    expect(data.remaining.READING_FLUENCY).toBe(-1);
  });

  it("returns 500 when the service throws", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDailyLimitStatus.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
