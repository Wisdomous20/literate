import { prisma } from "@/lib/prisma";

export async function getAssessmentComprehensionService(assessmentId: string) {
  if (!assessmentId) {
    return { success: false, error: "ID required." };
  }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        // Only pull what the comprehension page actually needs
        oralFluency: { select: { classificationLevel: true } },
        comprehension: {
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
      },
    });

    if (!assessment) return { success: false, error: "Not found." };
    return { success: true, assessment };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Internal error." };
  }
}
