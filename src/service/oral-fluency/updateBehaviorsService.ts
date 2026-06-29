import { OralFluencyBehaviorType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export interface UpdateBehaviorsInput {
  sessionId: string;
  behaviorTypes: OralFluencyBehaviorType[];
  otherObservations?: string;
}

export interface UpdateBehaviorsResult {
  success: boolean;
  error?: string;
  code?: "VALIDATION_ERROR" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR";
  behaviors?: {
    id: string;
    behaviorType: OralFluencyBehaviorType;
  }[];
  otherObservations?: string | null;
}

export async function updateBehaviorsService(
  input: UpdateBehaviorsInput,
  userId?: string,
): Promise<UpdateBehaviorsResult> {
  const sessionId = input.sessionId?.trim();

  if (!sessionId) {
    return {
      success: false,
      error: "sessionId is required.",
      code: "VALIDATION_ERROR",
    };
  }

  const behaviorTypes = [...new Set(input.behaviorTypes)];
  const otherObservations = input.otherObservations?.trim() || null;

  const session = userId
    ? await prisma.oralFluencyResult.findFirst({
        where: {
          id: sessionId,
          assessment: {
            student: {
              class: {
                userId,
              },
            },
          },
        },
        select: { id: true },
      })
    : await prisma.oralFluencyResult.findUnique({
        where: { id: sessionId },
        select: { id: true },
      });

  if (!session) {
    return {
      success: false,
      error: "Oral fluency session not found or access denied.",
      code: userId ? "FORBIDDEN" : "NOT_FOUND",
    };
  }

  try {
    const behaviors = await prisma.$transaction(async (tx) => {
      await tx.oralFluencyResult.update({
        where: { id: sessionId },
        data: { otherObservations },
      });

      await tx.oralFluencyBehavior.deleteMany({
        where: { sessionId },
      });

      if (behaviorTypes.length > 0) {
        await tx.oralFluencyBehavior.createMany({
          data: behaviorTypes.map((behaviorType) => ({
            sessionId,
            behaviorType,
          })),
        });
      }

      return tx.oralFluencyBehavior.findMany({
        where: { sessionId },
        select: { id: true, behaviorType: true },
        orderBy: { createdAt: "asc" },
      });
    });

    return { success: true, behaviors, otherObservations };
  } catch (err) {
    console.error("updateBehaviorsService error:", err);
    return {
      success: false,
      error: "Failed to update reading behaviors.",
      code: "INTERNAL_ERROR",
    };
  }
}
