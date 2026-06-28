import { prisma } from "@/lib/prisma";

interface DeleteQuestionInput {
  id: string;
}

interface DeleteQuestionResult {
  success: boolean;
  question?: {
    id: string;
    questionText: string;
    quizId: string;
  };
  error?: string;
  code?: "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function deleteQuestionService(
  input: DeleteQuestionInput
): Promise<DeleteQuestionResult> {
  const { id } = input;

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
    const deletedQuestion = await prisma.question.delete({
      where: { id },
      select: {
        id: true,
        questionText: true,
        quizId: true,
      },
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

    return { success: true, question: deletedQuestion };
  } catch (error) {
    console.error("Error deleting question:", error);
    return {
      success: false,
      error: "An internal error occurred while deleting the question.",
      code: "INTERNAL_ERROR",
    };
  }
}
