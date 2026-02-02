"use server";

import { deletePassageService } from "@/service/admin/deletePassageService";

interface DeletePassageActionInput {
  id: string;
}

export async function deletePassageAction(input: DeletePassageActionInput) {
  const { id } = input;

  // Call the service to delete the passage
  const result = await deletePassageService({ id });

  if (!result.success) {
    throw new Error(result.error || "Failed to delete passage.");
  }

  return { success: true };
}