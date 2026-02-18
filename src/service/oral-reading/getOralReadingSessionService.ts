import { prisma } from "@/lib/prisma";

interface GetOralReadingSessionResult {
  success: boolean;
  session?: unknown;
  error?: string;
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getOralReadingSessionService(
  sessionId: string
): Promise<GetOralReadingSessionResult> {
  if (!sessionId) {
    return {
      success: false,
      error: "Session ID is required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const session = await prisma.oralReadingSession.findUnique({
      where: { id: sessionId },
      include: {
        miscues: { orderBy: { wordIndex: "asc" } },
        behaviors: true,
        wordTimestamps: { orderBy: { index: "asc" } },
        assessment: true,
      },
    });

    if (!session) {
      return {
        success: false,
        error: "Session not found.",
        code: "NOT_FOUND",
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