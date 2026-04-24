"use server";

import { updatePassageService } from "@/service/admin/UpdatePassageService";
import {  testType } from "@/generated/prisma/enums";
import { updatePassageSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

interface UpdatePassageActionInput {
  id: string;
  title?: string;
  content?: string;
  language?: string;
  level?: number;
  testType?: testType;
}

export async function updatePassageAction(input: UpdatePassageActionInput) {
  const validationResult = updatePassageSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to update the passage
  const result = await updatePassageService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to update passage.");
  }

  return result.passage;
}
