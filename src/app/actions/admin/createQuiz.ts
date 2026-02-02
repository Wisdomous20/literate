"use server";

import { createQuizService } from "@/service/admin/createQuizService";

interface CreateQuizActionInput {
  passageId: string;
  totalScore: number;
  questions: {
    questionText: string;
    tags: "Literal" | "Inferential" | "Critical";
    type: "MULTIPLE_CHOICE" | "ESSAY";
    options?: string[]; // Only for MULTIPLE_CHOICE
    correctAnswer?: string; // Only for MULTIPLE_CHOICE
  }[];
}

export async function createQuizAction(input: CreateQuizActionInput) {
  const { passageId, totalScore, questions } = input;

  // Call the service to create the quiz
  const result = await createQuizService({
    passageId,
    totalScore,
    totalNumber: questions.length, // Automatically calculate totalNumber
    questions,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to create quiz.");
  }

  return result.quiz;
}