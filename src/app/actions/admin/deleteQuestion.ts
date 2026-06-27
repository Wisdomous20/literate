"use server";

import { deleteQuestionService } from "@/service/admin/deleteQuestionService";
import { deleteQuestionSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requireRole } from "@/utils/roleCheck";

interface DeleteQuestionActionInput {
  id: string;
}

export async function deleteQuestionAction(input: DeleteQuestionActionInput) {
  await requireRole("ADMIN");

  const validationResult = deleteQuestionSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to delete the question
  const result = await deleteQuestionService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to delete question.");
  }

  return { success: true };
}
