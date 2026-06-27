import { prisma } from "@/lib/prisma";
import { LevelClassification } from "@/generated/prisma/enums";
import { classifyOralReadingLevel } from "./classifyOralReadingLevel";

interface OralReadingLevelResult {
  success: boolean;
  oralReadingLevel?: LevelClassification;
  error?: string;
}

export async function createOralReadingService(
  assessmentId: string,
  knownComprehensionLevel?: LevelClassification
): Promise<OralReadingLevelResult> {
  let fluencyLevel: LevelClassification | null | undefined;
  let comprehensionLevel: LevelClassification | null | undefined = knownComprehensionLevel;

  if (knownComprehensionLevel) {
    // Only fetch fluency — comprehension level already known
    const session = await prisma.oralFluencyResult.findUnique({
      where: { assessmentId },
      select: { classificationLevel: true },
    });
    fluencyLevel = session?.classificationLevel;
  } else {
    // Fallback: fetch both from assessment
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        oralFluencyResult: { select: { classificationLevel: true } },
        comprehensionResult: { select: { classificationLevel: true } },
      },
    });

    if (!assessment) {
      return { success: false, error: "Assessment not found." };
    }

    fluencyLevel = assessment.oralFluencyResult?.classificationLevel;
    comprehensionLevel = assessment.comprehensionResult?.classificationLevel;
  }

  if (!fluencyLevel || !comprehensionLevel) {
    return { success: false, error: "Both fluency and comprehension levels are required." };
  }

  const classificationLevel = classifyOralReadingLevel(fluencyLevel, comprehensionLevel);

  await prisma.oralReadingResult.upsert({
    where: { assessmentId },
    create: {
      assessmentId,
      fluencyLevel,
      comprehensionLevel,
      classificationLevel,
    },
    update: {
      fluencyLevel,
      comprehensionLevel,
      classificationLevel,
    },
  });

  return { success: true, oralReadingLevel: classificationLevel };
}