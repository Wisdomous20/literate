"use server";

import { addQuestionService } from "@/service/admin/addQuestionService";
import { addQuestionSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

interface AddQuestionActionInput {
  passageId: string;
  questionText: string;
  tags: "Literal" | "Inferential" | "Critical";
  type: "MULTIPLE_CHOICE" | "ESSAY";
  options?: string[]; // Only for MULTIPLE_CHOICE
  correctAnswer?: string; // Only for MULTIPLE_CHOICE
}

export async function addQuestionAction(input: AddQuestionActionInput) {
  const validationResult = addQuestionSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to add the question
  const result = await addQuestionService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to add question.");
  }

  return result.question;
}
