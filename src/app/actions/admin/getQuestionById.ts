"use server";

import { getQuestionByIdService } from "@/service/admin/getQuestionByIdService";

interface GetQuestionByIdActionInput {
  id: string;
}

export async function getQuestionByIdAction(
  input: GetQuestionByIdActionInput,
) {
  const { id } = input;

  // Call the service to fetch the question by ID
  const result = await getQuestionByIdService({ id });

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch question.");
  }

  return result.question;
}