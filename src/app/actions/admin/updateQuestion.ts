"use server";

import { updateQuestionService } from "@/service/admin/updateQuestionService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateQuestionSchema } from "@/lib/validation/admin";

interface UpdateQuestionActionInput {
  id: string;
  questionText?: string;
  tags?: "Literal" | "Inferential" | "Critical";
  type?: "MULTIPLE_CHOICE" | "ESSAY";
  options?: string[];
  correctAnswer?: string;
}

export async function updateQuestionAction(
  input: UpdateQuestionActionInput,
) {
  const validationResult = updateQuestionSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to update the question
  const result = await updateQuestionService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to update question.");
  }

  return result.question;
}
