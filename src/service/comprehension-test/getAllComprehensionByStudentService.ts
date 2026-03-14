import { prisma } from "@/lib/prisma";

export async function getAllComprehensionTestsByStudentIdService(studentId: string) {
  const comprehensionTests = await prisma.comprehensionTest.findMany({
    where: {
      assessment: {
        studentId,
      },
    },
    include: {
      assessment: {
        include: {
          passage: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
    orderBy: {
      assessment: {
        dateTaken: "desc",
      },
    },
  });

  return comprehensionTests;
}