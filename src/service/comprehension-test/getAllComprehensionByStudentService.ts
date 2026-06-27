import { prisma } from "@/lib/prisma";

export async function getAllComprehensionTestsByStudentIdService(
  studentId: string,
  userId?: string
) {
  const comprehensionTests = await prisma.comprehensionTest.findMany({
    where: {
      assessment: {
        studentId,
        ...(userId
          ? {
              student: {
                classRoom: {
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

  return comprehensionTests;
}
