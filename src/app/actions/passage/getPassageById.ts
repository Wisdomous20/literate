"use server";

import { getPassageByIdService } from "@/service/admin/getPassageByIdService";
import { getPassageByIdSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

interface GetPassageByIdActionInput {
  id: string;
}

export async function getPassageByIdAction(input: GetPassageByIdActionInput) {
  const validationResult = getPassageByIdSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to fetch the passage by ID
  const result = await getPassageByIdService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch passage.");
  }

  return result.passage;
}
