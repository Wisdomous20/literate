import { prisma } from "@/lib/prisma";
import { OralReadingResultData, OralReading } from "@/types/oral-reading-result";

export async function getOralReadingResultByIdService(
  oralReadingResultId: string,
  userId?: string
): Promise<OralReading> {
  try {
    const include = {
        assessment: {
          include: {
            student: { select: { id: true, name: true } },
            passage: {
              select: { id: true, title: true, language: true, level: true },
            },
            oralFluencyResult: {
              include: {
                miscues: { orderBy: { wordIndex: "asc" } },
                behaviors: true,
                wordTimestamps: { orderBy: { index: "asc" } },
              },
            },
            comprehensionResult: {
              include: {
                answers: true,
              },
            },
          },
        },
      } as const;

    const oralReadingResult = userId
      ? await prisma.oralReadingResult.findFirst({
          where: {
            id: oralReadingResultId,
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
      : await prisma.oralReadingResult.findUnique({
          where: { id: oralReadingResultId },
          include,
        });

    if (!oralReadingResult) {
      return {
        success: false,
        error: "Oral Reading Result not found or access denied.",
        code: "NOT_FOUND",
      };
    }

    return {
      success: true,
      oralReadingResult: oralReadingResult as unknown as OralReadingResultData,
    };
  } catch (error) {
    console.error("Error fetching oral reading result by ID:", error);
    return {
      success: false,
      error: "An internal error occurred.",
      code: "INTERNAL_ERROR",
    };
  }
}
