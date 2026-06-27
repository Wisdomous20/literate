import { prisma } from "@/lib/prisma";

export async function getComprehensionTestByIdService(
  id: string,
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
          id,
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
        where: { id },
        include,
      });

  if (!comprehensionTest) {
    throw new Error(`ComprehensionTest with id ${id} not found or access denied`);
  }

  return comprehensionTest;
}


