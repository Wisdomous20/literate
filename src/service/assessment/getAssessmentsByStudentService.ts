import { prisma } from "@/lib/prisma";

interface GetAssessmentsInput {
  studentId?: string;
  type?: string;
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
    const where: Record<string, unknown> = {};
    if (input.studentId) where.studentId = input.studentId;
    if (input.type) where.type = input.type;

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        passage: {
          select: { id: true, title: true, language: true, level: true },
        },
        oralReading: {
          include: {
            miscues: true,
            behaviors: true,
          },
        },
        comprehension: {
          include: {
            quiz: true,
            answers: {
              include: { question: true },
            },
          },
        },
        student: { select: { id: true, name: true } },
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