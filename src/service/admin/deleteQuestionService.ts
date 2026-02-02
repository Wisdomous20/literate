import { prisma } from "@/lib/prisma";

interface DeleteQuestionInput {
  id: string;
}

interface DeleteQuestionResult {
  success: boolean;
  error?: string;
  code?: "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function deleteQuestionService(
  input: DeleteQuestionInput
): Promise<DeleteQuestionResult> {
  const { id } = input;

  // Validate input
  if (!id) {
    return {
      success: false,
      error: "Question ID is required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    // Check if the question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return {
        success: false,
        error: "Question not found.",
        code: "NOT_FOUND",
      };
    }

    // Delete the question
    await prisma.question.delete({
      where: { id },
    });

    // Update the quiz's totalNumber
    await prisma.quiz.update({
      where: { id: existingQuestion.quizId },
      data: {
        totalNumber: {
          decrement: 1,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting question:", error);
    return {
      success: false,
      error: "An internal error occurred while deleting the question.",
      code: "INTERNAL_ERROR",
    };
  }
}