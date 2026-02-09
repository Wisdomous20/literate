"use server";

import { updateQuestionService } from "@/service/admin/updateQuestionService";

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
  const { id, questionText, tags, type, options, correctAnswer } = input;

  // Call the service to update the question
  const result = await updateQuestionService({
    id,
    questionText,
    tags,
    type,
    options,
    correctAnswer,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to update question.");
  }

  return result.question;
}