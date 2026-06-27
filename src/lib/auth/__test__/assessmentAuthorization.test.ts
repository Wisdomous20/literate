import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetServerSession = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  student: { findFirst: vi.fn() },
  assessment: { findFirst: vi.fn() },
  assessmentLink: { findFirst: vi.fn() },
  oralFluencyResult: { findFirst: vi.fn() },
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  hasAssessmentAccess,
  hasSessionAccess,
  hasStudentAccess,
} from "../assessmentAuthorization";

describe("assessment authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies student access when the caller is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(hasStudentAccess("student-1")).resolves.toBe(false);
    expect(mockPrisma.student.findFirst).not.toHaveBeenCalled();
  });

  it("allows a teacher to access a student in their active classroom", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "teacher-1" } });
    mockPrisma.student.findFirst.mockResolvedValue({ id: "student-1" });

    await expect(hasStudentAccess("student-1")).resolves.toBe(true);
    expect(mockPrisma.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "student-1",
          classRoom: expect.objectContaining({ userId: "teacher-1" }),
        }),
      }),
    );
  });

  it("denies a teacher access to a student outside their classroom", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "teacher-1" } });
    mockPrisma.student.findFirst.mockResolvedValue(null);

    await expect(hasStudentAccess("student-2")).resolves.toBe(false);
  });

  it("allows an owner to access their assessment", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "teacher-1" } });
    mockPrisma.assessment.findFirst.mockResolvedValue({ id: "assessment-1" });

    await expect(hasAssessmentAccess("assessment-1")).resolves.toBe(true);
    expect(mockPrisma.assessmentLink.findFirst).not.toHaveBeenCalled();
  });

  it("allows a valid share token only for its linked assessment", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockPrisma.assessmentLink.findFirst.mockResolvedValue({ id: "link-1" });

    await expect(
      hasAssessmentAccess("assessment-1", "share-token"),
    ).resolves.toBe(true);
    expect(mockPrisma.assessmentLink.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          token: "share-token",
          assessmentId: "assessment-1",
          used: false,
          expiresAt: { gt: expect.any(Date) },
        }),
      }),
    );
  });

  it("denies an expired, used, or mismatched share token", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockPrisma.assessmentLink.findFirst.mockResolvedValue(null);

    await expect(
      hasAssessmentAccess("assessment-2", "share-token"),
    ).resolves.toBe(false);
  });

  it("denies session access outside the authenticated teacher's classroom", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "teacher-1" } });
    mockPrisma.oralFluencyResult.findFirst.mockResolvedValue(null);

    await expect(hasSessionAccess("session-2")).resolves.toBe(false);
  });
});
