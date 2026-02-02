import { prisma } from "@/lib/prisma";

interface CreateQuizInput {
  passageId: string;
  totalScore: number;
  totalNumber: number;
  questions: {
    questionText: string;
    tags: "Literal" | "Inferential" | "Critical";
    type: "MULTIPLE_CHOICE" | "ESSAY";
    options?: string[]; 
    correctAnswer?: string; 
  }[];
}

interface CreateQuizResult {
  success: boolean;
  quiz?: {
    id: string;
    passageId: string;
    totalScore: number;
    totalNumber: number;
  };
  error?: string;
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function createQuizService(
  input: CreateQuizInput
): Promise<CreateQuizResult> {
  const { passageId, totalScore, totalNumber, questions } = input;

  // Validate required fields
  if (!passageId) {
    return {
      success: false,
      error: "Passage ID is required",
      code: "VALIDATION_ERROR",
    };
  }

  if (!totalScore || totalScore <= 0) {
    return {
      success: false,
      error: "Total score must be greater than 0",
      code: "VALIDATION_ERROR",
    };
  }

  if (!totalNumber || totalNumber <= 0) {
    return {
      success: false,
      error: "Total number of questions must be greater than 0",
      code: "VALIDATION_ERROR",
    };
  }

  if (!questions || questions.length === 0) {
    return {
      success: false,
      error: "At least one question is required",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    // Create the quiz
    const quiz = await prisma.quiz.create({
      data: {
        passageId,
        totalScore,
        totalNumber: totalNumber,
        questions: {
          create: questions.map((q) => ({
            questionText: q.questionText,
            tags: q.tags,
            type: q.type,
            options: q.type === "MULTIPLE_CHOICE" ? q.options : undefined,
            correctAnswer: q.type === "MULTIPLE_CHOICE" ? q.correctAnswer : undefined,
          })),
        },
      },
      select: {
        id: true,
        passageId: true,
        totalScore: true,
        totalNumber: true,
      },
    });

    return { success: true, quiz };
  } catch (error) {
    console.error("Failed to create quiz:", error);
    return {
      success: false,
      error: "Failed to create quiz",
      code: "INTERNAL_ERROR",
    };
  }
}