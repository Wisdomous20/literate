import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

interface AddQuestionInput {
  quizId: string;
  questionText: string;
  tags: "Literal" | "Inferential" | "Critical";
  type: "MULTIPLE_CHOICE" | "ESSAY";
  options?: string[]; // Only for MULTIPLE_CHOICE
  correctAnswer?: string; // Only for MULTIPLE_CHOICE
}

interface AddQuestionResult {
  success: boolean;
  question?: {
    id: string;
    quizId: string;
    questionText: string;
    tags: string;
    type: string;
  };
  error?: string;
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function addQuestionService(
  input: AddQuestionInput
): Promise<AddQuestionResult> {
  const { quizId, questionText, tags, type, options, correctAnswer } = input;

  // Validate input
  if (!quizId || !questionText || !tags || !type) {
    return {
      success: false,
      error: "All required fields must be provided.",
      code: "VALIDATION_ERROR",
    };
  }

  if (type === "MULTIPLE_CHOICE" && (!options || !correctAnswer)) {
    return {
      success: false,
      error: "Options and correct answer are required for multiple choice questions.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    // Add the question to the database
    const question = await prisma.question.create({
      data: {
        quizId,
        questionText,
        tags,
        type,
        options: type === "MULTIPLE_CHOICE" ? options : Prisma.JsonNull,
        correctAnswer: type === "MULTIPLE_CHOICE" ? correctAnswer : null,
      },
    });

    // Increment the total number of questions in the quiz
    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        totalNumber: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      question: {
        id: question.id,
        quizId: question.quizId,
        questionText: question.questionText,
        tags: question.tags,
        type: question.type,
      },
    };
  } catch (error) {
    console.error("Error adding question:", error);
    return {
      success: false,
      error: "An internal error occurred while adding the question.",
      code: "INTERNAL_ERROR",
    };
  }
}