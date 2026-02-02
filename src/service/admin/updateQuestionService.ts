import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client"; // Import from your generated client path

interface UpdateQuestionInput {
  id: string;
  questionText?: string;
  tags?: "Literal" | "Inferential" | "Critical";
  type?: "MULTIPLE_CHOICE" | "ESSAY";
  options?: string[];
  correctAnswer?: string;
}

interface UpdateQuestionResult {
  success: boolean;
  question?: {
    id: string;
    quizId: string;
    questionText: string;
    tags: string;
    type: string;
  };
  error?: string;
  code?: "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function updateQuestionService(
  input: UpdateQuestionInput
): Promise<UpdateQuestionResult> {
  const { id, questionText, tags, type, options, correctAnswer } = input;

  // Validate input
  if (!id) {
    return {
      success: false,
      error: "Question ID is required.",
      code: "VALIDATION_ERROR",
    };
  }

  // Validate MULTIPLE_CHOICE requirements
  if (type === "MULTIPLE_CHOICE" && (!options || !correctAnswer)) {
    return {
      success: false,
      error: "Options and correct answer are required for multiple choice questions.",
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

    // Determine the final type (use existing if not provided)
    const finalType = type || existingQuestion.type;

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        questionText,
        tags,
        type,
        options: finalType === "MULTIPLE_CHOICE" 
          ? options 
          : Prisma.JsonNull, // Use Prisma.JsonNull instead
        correctAnswer: finalType === "MULTIPLE_CHOICE" 
          ? correctAnswer 
          : null,
      },
    });

    return {
      success: true,
      question: {
        id: updatedQuestion.id,
        quizId: updatedQuestion.quizId,
        questionText: updatedQuestion.questionText,
        tags: updatedQuestion.tags,
        type: updatedQuestion.type,
      },
    };
  } catch (error) {
    console.error("Error updating question:", error);
    return {
      success: false,
      error: "An internal error occurred while updating the question.",
      code: "INTERNAL_ERROR",
    };
  }
}