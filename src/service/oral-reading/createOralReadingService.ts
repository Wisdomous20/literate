import { prisma } from "@/lib/prisma";
import { LevelClassification } from "@/generated/prisma/enums";
import { classifyOralReadingLevel } from "./classifyOralReadingLevel";

interface OralReadingLevelResult {
  success: boolean;
  oralReadingLevel?: LevelClassification;
  error?: string;
}

export async function createOralReadingService(assessmentId: string): Promise<OralReadingLevelResult> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      oralFluency: { select: { classificationLevel: true } },
      comprehension: { select: { classificationLevel: true } },
    },
  });

  if (!assessment) {
    return { success: false, error: "Assessment not found." };
  }

  const fluencyLevel = assessment.oralFluency?.classificationLevel;
  const comprehensionLevel = assessment.comprehension?.classificationLevel;

  if (!fluencyLevel || !comprehensionLevel) {
    return { success: false, error: "Both fluency and comprehension levels are required." };
  }

  const oralReadingLevel = classifyOralReadingLevel(fluencyLevel, comprehensionLevel);

  await prisma.oralReadingResult.upsert({
    where: { assessmentId },
    create: {
      assessmentId,
      fluencyLevel,
      comprehensionLevel,
      oralReadingLevel,
    },
    update: {
      fluencyLevel,
      comprehensionLevel,
      oralReadingLevel,
    },
  });

  return { success: true, oralReadingLevel };
}