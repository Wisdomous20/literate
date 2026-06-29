import { prisma } from "@/lib/prisma";

export async function getAssessmentComprehensionService(
  assessmentId: string,
  userId?: string
) {
  if (!assessmentId) {
    return { success: false, error: "ID required." };
  }

  try {
    const select = {
        id: true,
        // Only pull what the comprehension page actually needs
        oralFluencyResult: { select: { classificationLevel: true } },
        comprehensionResult: {
          select: {
            id: true,
            score: true,
            totalItems: true,
            classificationLevel: true,
            answers: {
              select: {
                question:true,
                answer: true,
                isCorrect: true,
                tag: true,
              },
            },
          },
        },
      } as const;

    const assessment = userId
      ? await prisma.assessment.findFirst({
          where: {
            id: assessmentId,
            student: {
              class: {
                userId,
              },
            },
          },
          select,
        })
      : await prisma.assessment.findUnique({
          where: { id: assessmentId },
          select,
        });

    if (!assessment) {
      return {
        success: false,
        error: userId ? "Forbidden" : "Not found or access denied.",
        code: userId ? "FORBIDDEN" : "NOT_FOUND",
      };
    }
    return { success: true, assessment };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Internal error." };
  }
}
