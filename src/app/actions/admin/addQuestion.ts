"use server";

import { addQuestionService } from "@/service/admin/addQuestionService";

interface AddQuestionActionInput {
  quizId: string;
  questionText: string;
  tags: "Literal" | "Inferential" | "Critical";
  type: "MULTIPLE_CHOICE" | "ESSAY";
  options?: string[]; // Only for MULTIPLE_CHOICE
  correctAnswer?: string; // Only for MULTIPLE_CHOICE
}

export async function addQuestionAction(input: AddQuestionActionInput) {
  const { quizId, questionText, tags, type, options, correctAnswer } = input;

  // Call the service to add the question
  const result = await addQuestionService({
    quizId,
    questionText,
    tags,
    type,
    options,
    correctAnswer,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to add question.");
  }

  return result.question;
}