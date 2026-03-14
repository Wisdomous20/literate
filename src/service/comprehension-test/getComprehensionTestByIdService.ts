import { prisma } from "@/lib/prisma";

export async function getComprehensionTestByIdService(id: string) {
  const comprehensionTest = await prisma.comprehensionTest.findUnique({
    where: { id },
    include: {
      assessment: {
        include: {
          student: true,
          passage: true,
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
    throw new Error(`ComprehensionTest with id ${id} not found`);
  }

  return comprehensionTest;
}


