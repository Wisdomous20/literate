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

export interface UpdateMiscueInput {
  miscueId?: string;
  action: "approve" | "delete" | "update" | "create";
  sessionId?: string;
  newMiscueType?: MiscueType;
  newSpokenWord?: string;
  expectedWord?: string;
  spokenWord?: string | null;
  wordIndex?: number;
  timestamp?: number | null;
  isSelfCorrected?: boolean;
}

export interface UpdateMiscueResult {
  success: boolean;
  error?: string;
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
  miscueId?: string;
  updatedMetrics?: {
    totalMiscues: number;
    oralFluencyScore: number;
    classificationLevel: LevelClassification;
    accuracy: number;
  };
}

export async function updateMiscueService(
  input: UpdateMiscueInput,
): Promise<UpdateMiscueResult> {
  const {
    miscueId,
    action,
    sessionId,
    newMiscueType,
    newSpokenWord,
    expectedWord,
    spokenWord,
    wordIndex,
    timestamp,
    isSelfCorrected,
  } = input;

  if (
    action !== "approve" &&
    action !== "delete" &&
    action !== "update" &&
    action !== "create"
  ) {
    return {
      success: false,
      error: 'action must be "approve", "delete", "update", or "create".',
      code: "VALIDATION_ERROR",
    };
  }

  if (action !== "create" && !miscueId) {
    return {
      success: false,
      error: "miscueId is required.",
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

  if (action === "create" && (!sessionId || !newMiscueType || !expectedWord || wordIndex === undefined)) {
    return {
      success: false,
      error:
        "sessionId, newMiscueType, expectedWord, and wordIndex are required when action is 'create'.",
      code: "VALIDATION_ERROR",
    };
  }

  const existingMiscue =
    action === "create"
      ? null
      : await prisma.oralFluencyMiscue.findUnique({
          where: { id: miscueId! },
          include: { session: true },
        });

  if (action !== "create" && !existingMiscue) {
    return { success: false, error: "Miscue not found.", code: "NOT_FOUND" };
  }

  const targetSessionId =
    action === "create" ? sessionId! : existingMiscue!.sessionId;
  const assessmentId =
    action === "create"
      ? (
          await prisma.oralFluencySession.findUnique({
            where: { id: sessionId! },
            select: { assessmentId: true },
          })
        )?.assessmentId ?? null
      : existingMiscue!.session?.assessmentId ?? null;

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      let createdMiscueId: string | undefined;

      if (action === "approve" || action === "delete") {
        await tx.oralFluencyMiscue.delete({
          where: { id: miscueId! },
        });
      } else if (action === "create") {
        const createdMiscue = await tx.oralFluencyMiscue.create({
          data: {
            sessionId: targetSessionId,
            miscueType: newMiscueType!,
            expectedWord: expectedWord!,
            spokenWord: spokenWord ?? null,
            wordIndex: wordIndex!,
            timestamp: timestamp ?? null,
            isSelfCorrected:
              isSelfCorrected ?? newMiscueType === "SELF_CORRECTION",
          },
        });
        createdMiscueId = createdMiscue.id;
      } else {
        await tx.oralFluencyMiscue.update({
          where: { id: miscueId! },
          data: {
            ...(newMiscueType ? { miscueType: newMiscueType } : {}),
            ...(newSpokenWord ? { spokenWord: newSpokenWord } : {}),
          },
        });
      }

      const remainingMiscues = await tx.oralFluencyMiscue.findMany({
        where: { sessionId: targetSessionId },
      });

      const countedMiscues = remainingMiscues.filter(
        (miscue) => !miscue.isSelfCorrected,
      ).length;

      const session = await tx.oralFluencySession.findUnique({
        where: { id: targetSessionId },
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

      await tx.oralFluencySession.update({
        where: { id: targetSessionId },
        data: {
          totalMiscues: countedMiscues,
          oralFluencyScore,
          classificationLevel,
          accuracy,
        },
      });

      return {
        miscueId: createdMiscueId,
        updatedMetrics: {
          totalMiscues: countedMiscues,
          oralFluencyScore,
          classificationLevel,
          accuracy,
        },
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

    return {
      success: true,
      miscueId: transactionResult.miscueId,
      updatedMetrics: transactionResult.updatedMetrics,
    };
  } catch (err) {
    console.error("updateMiscueService error:", err);
    return {
      success: false,
      error: "Failed to update miscue.",
      code: "INTERNAL_ERROR",
    };
  }
}
