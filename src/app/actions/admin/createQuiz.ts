"use server";

import { createQuizService } from "@/service/admin/createQuizService";
import { createQuizSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

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
  const validationResult = createQuizSchema.safeParse({
    ...input,
    totalNumber: input.questions.length,
  });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to create the quiz
  const result = await createQuizService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to create quiz.");
  }

  return result.quiz;
}
