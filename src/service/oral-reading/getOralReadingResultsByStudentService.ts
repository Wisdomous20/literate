import { prisma } from "@/lib/prisma";
import { OralReadingResultData, OralReadingList } from "@/types/oral-reading-result";

export async function getOralReadingResultsByStudentService(
  studentId: string
): Promise<OralReadingList> {
  if (!studentId) {
    return {
      success: false,
      error: "Student ID is required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const oralReadingResults = await prisma.oralReadingResult.findMany({
      where: {
        assessment: {
          studentId: studentId,
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
                answers: { include: { question: true } },
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
        error: "No oral reading results found for this student.",
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