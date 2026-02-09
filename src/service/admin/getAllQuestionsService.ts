import { prisma } from "@/lib/prisma";

interface Question {
  id: string;
  questionText: string;
  passageTitle: string;
  tags: string;
  type: string;
  passageLevel: number;
  language: string;
}

interface GetAllQuestionsResult {
  success: boolean;
  questions?: Question[];
  error?: string;
  code?: "INTERNAL_ERROR";
}

export async function getAllQuestionsService(): Promise<GetAllQuestionsResult> {
  try {
    // Fetch all questions with their related passage info
    const questions = await prisma.question.findMany({
      include: {
        quiz: {
          include: {
            passage: true,
          },
        },
      },
    });

    // Map questions to the desired format
    const formattedQuestions: Question[] = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      passageTitle: q.quiz?.passage?.title || "Unknown Passage",
      tags: q.tags,
      type: q.type,
      passageLevel: q.quiz?.passage?.level || 0,
      language: q.quiz?.passage?.language || "English",
    }));

    return {
      success: true,
      questions: formattedQuestions,
    };
  } catch (error) {
    console.error("Error fetching questions:", error);
    return {
      success: false,
      error: "An internal error occurred while fetching questions.",
      code: "INTERNAL_ERROR",
    };
  }
}