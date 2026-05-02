import { prisma } from "@/lib/prisma";

interface GetAssessmentSummariesByClassResult {
  success: boolean;
  assessments?: {
    id: string;
    studentId: string;
    dateTaken: Date;
    type: "ORAL_READING" | "COMPREHENSION" | "READING_FLUENCY";
    oralFluency?: { classificationLevel: "INDEPENDENT" | "INSTRUCTIONAL" | "FRUSTRATION" | null } | null;
    comprehension?: { classificationLevel: "INDEPENDENT" | "INSTRUCTIONAL" | "FRUSTRATION" } | null;
    oralReadingResult?: { classificationLevel: "INDEPENDENT" | "INSTRUCTIONAL" | "FRUSTRATION" } | null;
  }[];
  error?: string;
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function getAssessmentSummariesByClassService(
  classRoomId: string,
  userId: string,
): Promise<GetAssessmentSummariesByClassResult> {
  if (!classRoomId) {
    return { success: false, error: "Class ID is required", code: "VALIDATION_ERROR" };
  }

  if (!userId) {
    return { success: false, error: "Unauthorized", code: "VALIDATION_ERROR" };
  }

  try {
    const assessments = await prisma.assessment.findMany({
      where: {
        student: {
          archived: false,
          classRoomId,
          classRoom: {
            userId,
          },
        },
      },
      select: {
        id: true,
        studentId: true,
        dateTaken: true,
        type: true,
        oralFluency: {
          select: {
            classificationLevel: true,
          },
        },
        comprehension: {
          select: {
            classificationLevel: true,
          },
        },
        oralReadingResult: {
          select: {
            classificationLevel: true,
          },
        },
      },
      orderBy: [{ studentId: "asc" }, { dateTaken: "desc" }],
    });

    return { success: true, assessments };
  } catch (error) {
    console.error("Error fetching class assessment summaries:", error);
    return {
      success: false,
      error: "An internal error occurred while fetching class assessments.",
      code: "INTERNAL_ERROR",
    };
  }
}
