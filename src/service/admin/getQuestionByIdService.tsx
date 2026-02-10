import { prisma } from "@/lib/prisma";

interface GetQuestionByIdInput {
  id: string;
}

interface GetQuestionByIdResult {
  success: boolean;
  question?: {
    id: string;
    quizId: string;
    questionText: string;
    tags: string;
    type: string;
    options?: string[];
    correctAnswer?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
  code?: "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getQuestionByIdService(
  input: GetQuestionByIdInput,
): Promise<GetQuestionByIdResult> {
  const { id } = input;

  // Validate input
  if (!id) {
    return {
      success: false,
      error: "Question ID is required.",
      code: "NOT_FOUND",
    };
  }

  try {
    // Fetch the question by ID
    const question = await prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        quizId: true,
        questionText: true,
        tags: true,
        type: true,
        options: true,
        correctAnswer: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!question) {
      return {
        success: false,
        error: "Question not found.",
        code: "NOT_FOUND",
      };
    }

    return {
      success: true,
      question: {
        id: question.id,
        quizId: question.quizId,
        questionText: question.questionText,
        tags: question.tags,
        type: question.type,
        options: question.options ? (question.options as string[]) : undefined,
        correctAnswer: question.correctAnswer ?? undefined,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error fetching question:", error);
    return {
      success: false,
      error: "An internal error occurred while fetching the question.",
      code: "INTERNAL_ERROR",
    };
  }
}