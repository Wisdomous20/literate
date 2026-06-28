import { prisma } from "@/lib/prisma";

interface GetOralFluencyResultResult {
  success: boolean;
  session?: unknown;
  error?: string;
  code?: "VALIDATION_ERROR" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getOralFluencyResultService(
  sessionId: string,
  userId?: string
): Promise<GetOralFluencyResultResult> {
  if (!sessionId) {
    return {
      success: false,
      error: "Session ID is required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const include = {
        miscues: { orderBy: { wordIndex: "asc" } },
        behaviors: true,
        wordTimestamps: { orderBy: { index: "asc" } },
        assessment: true,
      } as const;

    const session = userId
      ? await prisma.oralFluencyResult.findFirst({
          where: {
            id: sessionId,
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
      : await prisma.oralFluencyResult.findUnique({
          where: { id: sessionId },
          include,
        });

    if (!session) {
      return {
        success: false,
        error: "Session not found or access denied.",
        code: userId ? "FORBIDDEN" : "NOT_FOUND",
      };
    }

    return { success: true, session };
  } catch (error) {
    console.error("Error fetching oral reading session:", error);
    return {
      success: false,
      error: "An internal error occurred.",
      code: "INTERNAL_ERROR",
    };
  }
}
