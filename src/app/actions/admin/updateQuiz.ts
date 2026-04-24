"use server";

import { updateQuizService } from "@/service/admin/updateQuizService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateQuizSchema } from "@/lib/validation/admin";

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
  const validationResult = updateQuizSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to edit the quiz
  const result = await updateQuizService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to edit quiz.");
  }

  return result.quiz;
}
