"use server";

import { updateQuizService } from "@/service/admin/updateQuizService";

interface EditQuizActionInput {
  id: string;
  totalScore?: number;
  questions?: {
    id?: string; // For existing questions
    questionText?: string;
    tags?: "Literal" | "Inferential" | "Critical";
    type?: "MULTIPLE_CHOICE" | "ESSAY";
    options?: string[]; // Only for MULTIPLE_CHOICE
    correctAnswer?: string; // Only for MULTIPLE_CHOICE
  }[];
}

export async function editQuizAction(input: EditQuizActionInput) {
  const { id, totalScore, questions } = input;

  // Call the service to edit the quiz
  const result = await updateQuizService({
    id,
    totalScore,
    questions,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to edit quiz.");
  }

  return result.quiz;
}