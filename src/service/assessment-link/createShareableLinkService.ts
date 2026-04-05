import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/utils/subscriptionCheck";
import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import type { AssessmentType } from "@/generated/prisma/enums";

interface CreateShareableLinkInput {
  teacherId: string;
  studentId: string;
  passageId: string;
  type: AssessmentType;
  expiresAt?: string; // ISO string. Defaults to 24h from now.
}

export async function createShareableLinkService(
  input: CreateShareableLinkInput
) {
  const { teacherId, studentId, passageId, type, expiresAt } = input;

  // Premium-only
  const isPaid = await hasActiveSubscription(teacherId);
  if (!isPaid) {
    return {
      success: false as const,
      error:
        "Shareable assessment links are available on paid plans only. Please upgrade to unlock this feature.",
      code: "PREMIUM_REQUIRED" as const,
    };
  }

  // Validate student belongs to this teacher
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { classRoom: { select: { userId: true } } },
  });

  if (!student) {
    return { success: false as const, error: "Student not found." };
  }

  if (student.classRoom.userId !== teacherId) {
    return {
      success: false as const,
      error: "Student does not belong to your class.",
    };
  }

  // Validate passage
  const passage = await prisma.passage.findUnique({
    where: { id: passageId },
    include: {
      quiz: { select: { questions: { select: { id: true } } } },
    },
  });

  if (!passage) {
    return { success: false as const, error: "Passage not found." };
  }

  if (type === "COMPREHENSION" || type === "ORAL_READING") {
    if (!passage.quiz || passage.quiz.questions.length === 0) {
      return {
        success: false as const,
        error:
          "This passage has no quiz questions. Please add questions first.",
      };
    }
  }

  // Calculate deadline
  const deadline = expiresAt
    ? new Date(expiresAt)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (deadline <= new Date()) {
    return {
      success: false as const,
      error: "Deadline must be in the future.",
    };
  }

  // Create assessment via existing service
  const assessmentResult = await createAssessmentService({
    studentId,
    passageId,
    type,
  });

  if (!assessmentResult.success || !assessmentResult.assessment) {
    return {
      success: false as const,
      error: assessmentResult.error || "Failed to create assessment.",
    };
  }

  // Create the link
  const token = crypto.randomBytes(16).toString("base64url");

  const link = await prisma.assessmentLink.create({
    data: {
      token,
      assessmentId: assessmentResult.assessment.id,
      expiresAt: deadline,
    },
    select: {
      id: true,
      token: true,
      expiresAt: true,
      createdAt: true,
      assessment: {
        select: {
          id: true,
          type: true,
          student: { select: { id: true, name: true, level: true } },
          passage: {
            select: { id: true, title: true, level: true, testType: true },
          },
        },
      },
    },
  });

  return { success: true as const, link };
}