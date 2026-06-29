import { prisma } from "@/lib/prisma";

export async function getComprehensionResultByIdService(
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

  const ComprehensionResult = userId
    ? await prisma.comprehensionResult.findFirst({
        where: {
          id,
          assessment: {
            student: {
              class: {
                userId,
              },
            },
          },
        },
        include,
      })
    : await prisma.comprehensionResult.findUnique({
        where: { id },
        include,
      });

  if (!ComprehensionResult) {
    throw new Error(`ComprehensionResult with id ${id} not found or access denied`);
  }

  return ComprehensionResult;
}


