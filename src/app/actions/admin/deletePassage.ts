"use server";

import { deletePassageService } from "@/service/admin/deletePassageService";
import { deletePassageSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

interface DeletePassageActionInput {
  id: string;
}

export async function deletePassageAction(input: DeletePassageActionInput) {
  const validationResult = deletePassageSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to delete the passage
  const result = await deletePassageService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to delete passage.");
  }

  return { success: true };
}
