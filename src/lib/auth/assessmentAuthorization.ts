import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import type { userType } from "@/generated/prisma/enums";

export type CurrentUser = {
  id: string;
  role: userType;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    role: session.user.role as userType,
  };
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  return currentUser;
}

export async function getCurrentUserId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null;
}

export async function hasAuthenticatedSession(): Promise<boolean> {
  return Boolean(await getCurrentUserId());
}

export async function hasStudentAccess(
  studentId: string,
  currentUserId?: string | null,
): Promise<boolean> {
  const userId = currentUserId ?? (await getCurrentUserId());
  if (!userId) return false;

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      archived: false,
      classRoom: {
        userId,
        archived: false,
      },
    },
    select: { id: true },
  });

  return Boolean(student);
}

export async function hasAssessmentAccess(
  assessmentId: string,
  assessmentToken?: string | null,
  currentUserId?: string | null,
): Promise<boolean> {
  const userId = currentUserId ?? (await getCurrentUserId());

  if (userId) {
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        student: {
          archived: false,
          classRoom: {
            userId,
            archived: false,
          },
        },
      },
      select: { id: true },
    });

    if (assessment) return true;
  }

  if (!assessmentToken) return false;

  const link = await prisma.assessmentLink.findFirst({
    where: {
      token: assessmentToken,
      assessmentId,
      used: false,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  return Boolean(link);
}

export async function hasSessionAccess(
  sessionId: string,
  currentUserId?: string | null,
): Promise<boolean> {
  const userId = currentUserId ?? (await getCurrentUserId());
  if (!userId) return false;

  const session = await prisma.oralFluencyResult.findFirst({
    where: {
      id: sessionId,
      assessment: {
        student: {
          archived: false,
          classRoom: {
            userId,
            archived: false,
          },
        },
      },
    },
    select: { id: true },
  });

  return Boolean(session);
}
