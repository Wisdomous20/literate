import { prisma } from "@/lib/prisma";

interface GetAssessmentByIdResult {
  success: boolean;
  assessment?: unknown;
  error?: string;
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getAssessmentByIdService(
  id: string
): Promise<GetAssessmentByIdResult> {
  if (!id) {
    return {
      success: false,
      error: "Assessment ID is required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        passage: true,
        oralReading: {
          include: {
            miscues: { orderBy: { wordIndex: "asc" } },
            behaviors: true,
            wordTimestamps: { orderBy: { index: "asc" } },
          },
        },
        comprehension: {
          include: {
            quiz: true,
            answers: { include: { question: true } },
          },
        },
        student: { select: { id: true, name: true } },
      },
    });

    if (!assessment) {
      return {
        success: false,
        error: "Assessment not found.",
        code: "NOT_FOUND",
      };
    }

    return { success: true, assessment };
  } catch (error) {
    console.error("Error fetching assessment by ID:", error);
    return {
      success: false,
      error: "An internal error occurred.",
      code: "INTERNAL_ERROR",
    };
  }
}