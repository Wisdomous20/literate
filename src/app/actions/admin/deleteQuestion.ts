"use server";

import { deleteQuestionService } from "@/service/admin/deleteQuestionService";

interface DeleteQuestionActionInput {
  id: string;
}

export async function deleteQuestionAction(input: DeleteQuestionActionInput) {
  const { id } = input;

  // Call the service to delete the question
  const result = await deleteQuestionService({ id });

  if (!result.success) {
    throw new Error(result.error || "Failed to delete question.");
  }

  return { success: true };
}