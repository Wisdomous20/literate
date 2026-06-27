import { prisma } from "@/lib/prisma";
import { OralReadingResultData, OralReadingList } from "@/types/oral-reading-result";

export async function getOralReadingResultsByStudentService(
  studentId: string,
  userId?: string
): Promise<OralReadingList> {
  try {
    const oralReadingResults = await prisma.oralReadingResult.findMany({
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
            student: { select: { id: true, name: true } },
            passage: {
              select: { id: true, title: true, language: true, level: true },
            },
            oralFluency: {
              include: {
                miscues: { orderBy: { wordIndex: "asc" } },
                behaviors: true,
                wordTimestamps: { orderBy: { index: "asc" } },
              },
            },
            comprehension: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!oralReadingResults || oralReadingResults.length === 0) {
      return {
        success: false,
        error: "No oral reading results found for this student or access denied.",
        code: "NOT_FOUND",
      };
    }

    return {
      success: true,
      oralReadingResults: oralReadingResults as unknown as OralReadingResultData[],
    };
  } catch (error) {
    console.error("Error fetching oral reading results by student:", error);
    return {
      success: false,
      error: "An internal error occurred.",
      code: "INTERNAL_ERROR",
    };
  }
}
