import { prisma } from "@/lib/prisma";

export async function getComprehensionResultByAssessmentService(
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

  const ComprehensionResult = userId
    ? await prisma.comprehensionResult.findFirst({
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
    : await prisma.comprehensionResult.findUnique({
        where: { assessmentId },
        include,
      });

  if (!ComprehensionResult) {
    throw new Error(
      `ComprehensionResult for assessment ${assessmentId} not found or access denied`
    );
  }

  return ComprehensionResult;
}
