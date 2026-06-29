import { prisma } from "@/lib/prisma";

export async function getAllComprehensionResultsByStudentIdService(
  studentId: string,
  userId?: string
) {
  const ComprehensionResults = await prisma.comprehensionResult.findMany({
    where: {
      assessment: {
        studentId,
        ...(userId
          ? {
              student: {
                class: {
                  userId,
                },
              },
            }
          : {}),
      },
    },
    include: {
      assessment: {
        include: {
          passage: true,
        },
      },
      answers: true,
    },
    orderBy: {
      assessment: {
        dateTaken: "desc",
      },
    },
  });

  return ComprehensionResults;
}
