import { prisma } from "@/lib/prisma";

interface GetAssessmentByIdResult {
  success: boolean;
  assessment?: unknown;
  error?: string;
  code?: "VALIDATION_ERROR" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getAssessmentByIdService(
  id: string,
  userId?: string
): Promise<GetAssessmentByIdResult> {
  if (!id) {
    return {
      success: false,
      error: "Assessment ID is required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const include = {
        passage: true,
        oralFluencyResult: {
          include: {
            miscues: { orderBy: { wordIndex: "asc" } },
            behaviors: true,
            wordTimestamps: { orderBy: { index: "asc" } },
          },
        },
        comprehensionResult: {
          include: {
            answers:true,
          },
        },
        oralReadingResult: true,
        student: { select: { id: true, name: true } },
      } as const;

    const assessment = userId
      ? await prisma.assessment.findFirst({
          where: {
            id,
            student: {
              class: {
                userId,
              },
            },
          },
          include,
        })
      : await prisma.assessment.findUnique({
          where: { id },
          include,
        });

    if (!assessment) {
      return {
        success: false,
        error: "Assessment not found or access denied.",
        code: userId ? "FORBIDDEN" : "NOT_FOUND",
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
