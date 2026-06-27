import { prisma } from "@/lib/prisma";

export async function getComprehensionTestByAssessmentService(
  assessmentId: string,
  userId?: string
) {
  const include = {
      assessment: {
        include: {
          student: true,
          passage: true,
        },
      },
      answers: true,
    } as const;

  const comprehensionTest = userId
    ? await prisma.comprehensionTest.findFirst({
        where: {
          assessmentId,
          assessment: {
            student: {
              classRoom: {
                userId,
              },
            },
          },
        },
        include,
      })
    : await prisma.comprehensionTest.findUnique({
        where: { assessmentId },
        include,
      });

  if (!comprehensionTest) {
    throw new Error(
      `ComprehensionTest for assessment ${assessmentId} not found or access denied`
    );
  }

  return comprehensionTest;
}
