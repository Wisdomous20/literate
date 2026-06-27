import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { AssessmentType } from "@/generated/prisma/enums";

interface GetAssessmentsInput {
  userId?: string;
  studentId?: string;
  type?: AssessmentType;
}

interface GetAssessmentsResult {
  success: boolean;
  assessments?: unknown[];
  error?: string;
  code?: "INTERNAL_ERROR";
}

export async function getAssessmentsByStudentService(
  input: GetAssessmentsInput
): Promise<GetAssessmentsResult> {
  try {
    const where: Prisma.AssessmentWhereInput = {};
    if (input.studentId) where.studentId = input.studentId;
    if (input.type) where.type = input.type;
    if (input.userId) {
      where.student = {
        classRoom: {
          userId: input.userId,
        },
      };
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        passage: {
          select: { id: true, title: true, language: true, level: true, content: true, testType: true },
        },
        oralFluencyResult: {
          include: {
            miscues: true,
            behaviors: true,
          },
        },
        comprehensionResult: {
          include: {
            answers: true,
          },
        },
        oralReadingResult: true,
        student: { select: { id: true, name: true, level: true } },
      },
      orderBy: { dateTaken: "desc" },
    });

    return { success: true, assessments };
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return {
      success: false,
      error: "An internal error occurred while fetching assessments.",
      code: "INTERNAL_ERROR",
    };
  }
}
