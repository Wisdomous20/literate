import { prisma } from "@/lib/prisma";
import { MiscueType, LevelClassification } from "@/generated/prisma/enums";
import { createOralReadingService } from "@/service/oral-reading/createOralReadingService";


function computeOralFluencyScore(
  totalWords: number,
  totalMiscues: number,
): number {
  if (totalWords <= 0) return 0;
  const score = ((totalWords - totalMiscues) / totalWords) * 100;
  return Math.round(score * 10) / 10;
}

function classifyReadingLevel(
  oralFluencyScore: number,
): LevelClassification {
  if (oralFluencyScore >= 97) return "INDEPENDENT";
  if (oralFluencyScore >= 90) return "INSTRUCTIONAL";
  return "FRUSTRATION";
}

// ─── Types ───

export interface UpdateMiscueInput {
  /** The ID of the miscue to update */
  miscueId: string;
  /** "delete" = permanently remove the miscue, "update" = change its type. "approve" is kept for older callers. */
  action: "approve" | "delete" | "update";
  /** Required when action is "update" — the new miscue type */
  newMiscueType?: MiscueType;
  /** Optional when action is "update" — update the captured spoken word */
  newSpokenWord?: string;
}

export interface UpdateMiscueResult {
  success: boolean;
  error?: string;
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
  /** The recalculated session-level metrics after the change */
  updatedMetrics?: {
    totalMiscues: number;
    oralFluencyScore: number;
    classificationLevel: LevelClassification;
    accuracy: number;
  };
}

// ─── Service ───

export async function updateMiscueService(
  input: UpdateMiscueInput,
): Promise<UpdateMiscueResult> {
  const { miscueId, action, newMiscueType, newSpokenWord } = input;

  if (!miscueId) {
    return {
      success: false,
      error: "miscueId is required.",
      code: "VALIDATION_ERROR",
    };
  }

  if (action !== "approve" && action !== "delete" && action !== "update") {
    return {
      success: false,
      error: 'action must be "approve", "delete", or "update".',
      code: "VALIDATION_ERROR",
    };
  }

  if (action === "update" && !newMiscueType && !newSpokenWord) {
    return {
      success: false,
      error:
        "Either newMiscueType or newSpokenWord is required when action is 'update'.",
      code: "VALIDATION_ERROR",
    };
  }

  // 1. Find the miscue and its parent session
  const miscue = await prisma.oralFluencyMiscue.findUnique({
    where: { id: miscueId },
    include: { session: true },
  });

  if (!miscue) {
    return { success: false, error: "Miscue not found.", code: "NOT_FOUND" };
  }

  const sessionId = miscue.sessionId;
  const assessmentId = miscue.session?.assessmentId;

  try {
    // 2. Perform the action + recalculate in a single transaction
    const updatedMetrics = await prisma.$transaction(async (tx) => {
      if (action === "approve" || action === "delete") {
        // Permanently remove the miscue row from the session.
        await tx.oralFluencyMiscue.delete({
          where: { id: miscueId },
        });
      } else {
        // User wants to change the miscue type
        await tx.oralFluencyMiscue.update({
          where: { id: miscueId },
          data: {
            ...(newMiscueType ? { miscueType: newMiscueType } : {}),
            ...(newSpokenWord ? { spokenWord: newSpokenWord } : {}),
          },
        });
      }

      // 3. Recalculate session metrics from remaining miscues
      const remainingMiscues = await tx.oralFluencyMiscue.findMany({
        where: { sessionId },
      });

      const countedMiscues = remainingMiscues.filter(
        (m) => !m.isSelfCorrected,
      ).length;

      const session = await tx.oralFluencySession.findUnique({
        where: { id: sessionId },
        select: { totalWords: true },
      });

      const totalWords = session?.totalWords ?? 0;
      const oralFluencyScore = computeOralFluencyScore(totalWords, countedMiscues);
      const classificationLevel = classifyReadingLevel(oralFluencyScore);
      const accuracy =
        totalWords > 0
          ? Math.round(
              ((totalWords - countedMiscues) / totalWords) * 100 * 10,
            ) / 10
          : 0;

      // 4. Persist recalculated metrics on the session
      await tx.oralFluencySession.update({
        where: { id: sessionId },
        data: {
          totalMiscues: countedMiscues,
          oralFluencyScore,
          classificationLevel,
          accuracy,
        },
      });

      return {
        totalMiscues: countedMiscues,
        oralFluencyScore,
        classificationLevel,
        accuracy,
      };
    });

    if (assessmentId) {
      const oralReadingResult = await createOralReadingService(assessmentId);
      if (!oralReadingResult.success) {
        console.log(
          "[updateMiscueService] Oral reading level not recomputed:",
          oralReadingResult.error,
        );
      }
    }

    return { success: true, updatedMetrics };
  } catch (err) {
    console.error("updateMiscueService error:", err);
    return {
      success: false,
      error: "Failed to update miscue.",
      code: "INTERNAL_ERROR",
    };
  }
}
