"use server";

import { getQuestionByIdService } from "@/service/admin/getQuestionByIdService";
import { getQuestionByIdSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

interface GetQuestionByIdActionInput {
  id: string;
}

export async function getQuestionByIdAction(
  input: GetQuestionByIdActionInput,
) {
  const validationResult = getQuestionByIdSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to fetch the question by ID
  const result = await getQuestionByIdService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch question.");
  }

  return result.question;
}
