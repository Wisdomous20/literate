import { prisma } from "@/lib/prisma";

interface EditQuizInput {
  id: string;
  totalScore?: number;
  totalNumber?: number;
  questions?: {
    id?: string; // For existing questions
    questionText?: string;
    tags?: "Literal" | "Inferential" | "Critical";
    type?: "MULTIPLE_CHOICE" | "ESSAY";
    options?: string[]; // Only for MULTIPLE_CHOICE
    correctAnswer?: string; // Only for MULTIPLE_CHOICE
  }[];
}

interface EditQuizResult {
  success: boolean;
  quiz?: {
    id: string;
    totalScore: number;
    totalNumber: number;
  };
  error?: string;
  code?: "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function editQuizService(
  input: EditQuizInput
): Promise<EditQuizResult> {
  const { id, totalScore, totalNumber, questions } = input;

  // Validate input
  if (!id) {
    return {
      success: false,
      error: "Quiz ID is required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    // Check if the quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!existingQuiz) {
      return {
        success: false,
        error: "Quiz not found.",
        code: "NOT_FOUND",
      };
    }

    // Update the quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        totalScore,
        totalNumber,
        questions: questions
          ? {
              upsert: questions.map((q) => ({
                where: { id: q.id || "" }, // Update if `id` exists
                create: {
                  questionText: q.questionText!,
                  tags: q.tags!,
                  type: q.type!,
                  options: q.type === "MULTIPLE_CHOICE" ? q.options! : undefined,
                  correctAnswer:
                    q.type === "MULTIPLE_CHOICE" ? q.correctAnswer! : undefined,
                },
                update: {
                  questionText: q.questionText,
                  tags: q.tags,
                  type: q.type,
                  options: q.type === "MULTIPLE_CHOICE" ? q.options : undefined,
                  correctAnswer:
                    q.type === "MULTIPLE_CHOICE" ? q.correctAnswer : undefined,
                },
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        totalScore: true,
        totalNumber: true,
      },
    });

    return {
      success: true,
      quiz: updatedQuiz,
    };
  } catch (error) {
    console.error("Error editing quiz:", error);
    return {
      success: false,
      error: "An internal error occurred while editing the quiz.",
      code: "INTERNAL_ERROR",
    };
  }
}