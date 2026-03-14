import { prisma } from "@/lib/prisma";
import  classifyComprehensionLevel from "./classifyComprehensionLevel";

interface UpdateComprehensionAnswerInput {
  comprehensionAnswerId: string;
  isCorrect: boolean;
}

interface UpdateComprehensionAnswerResult {
  success: boolean;
  answer?: {
    id: string;
    answer: string;
    isCorrect: boolean | null;
  };
  updatedScore?: number;
  updatedLevel?: string;
  error?: string;
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
}


export async function updateComprehensionAnswerService(
  input: UpdateComprehensionAnswerInput
): Promise<UpdateComprehensionAnswerResult> {
  const { comprehensionAnswerId, isCorrect } = input;

  if (!comprehensionAnswerId) {
    return {
      success: false,
      error: "Comprehension answer ID is required.",
      code: "VALIDATION_ERROR",
    };
  }

  if (typeof isCorrect !== "boolean") {
    return {
      success: false,
      error: "isCorrect must be a boolean.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const existingAnswer = await prisma.comprehensionAnswer.findUnique({
      where: { id: comprehensionAnswerId },
      select: { id: true, comprehensionTestId: true },
    });

    if (!existingAnswer) {
      return {
        success: false,
        error: "Comprehension answer not found.",
        code: "NOT_FOUND",
      };
    }

    // Update the answer
    const updatedAnswer = await prisma.comprehensionAnswer.update({
      where: { id: comprehensionAnswerId },
      data: { isCorrect },
      select: { id: true, answer: true, isCorrect: true },
    });

    // Recalculate score for the comprehension test
    const allAnswers = await prisma.comprehensionAnswer.findMany({
      where: { comprehensionTestId: existingAnswer.comprehensionTestId },
      select: { isCorrect: true },
    });

    const totalItems = allAnswers.length;
    const newScore = allAnswers.filter((a) => a.isCorrect === true).length;
    const percentage = totalItems > 0 ? (newScore / totalItems) * 100 : 0;
    const newLevel = classifyComprehensionLevel(percentage);

    // Update the comprehension test score and level
    await prisma.comprehensionTest.update({
      where: { id: existingAnswer.comprehensionTestId },
      data: { score: newScore, classificationLevel: newLevel },
    });

    return {
      success: true,
      answer: updatedAnswer,
      updatedScore: newScore,
      updatedLevel: newLevel,
    };
  } catch (error) {
    console.error("Error updating comprehension answer:", error);
    return {
      success: false,
      error: "Failed to update comprehension answer.",
      code: "INTERNAL_ERROR",
    };
  }
}