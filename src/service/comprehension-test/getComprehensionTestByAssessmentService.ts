import { prisma } from "@/lib/prisma";

export async function getComprehensionTestByAssessmentService(assessmentId: string) {
  const comprehensionTest = await prisma.comprehensionTest.findUnique({
    where: { assessmentId },
    include: {
      assessment: {
        include: {
          student: true,
          passage: true,
        },
      },
      quiz: {
        include: {
          questions: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
  });

  if (!comprehensionTest) {
    throw new Error(`ComprehensionTest for assessment ${assessmentId} not found`);
  }

  return comprehensionTest;
}