"use server";

import { getAllQuestionsService } from "@/service/question/getAllQuestionsService";
import { requirePassageManager } from "@/utils/roleCheck";

export async function getAllQuestionsAction() {
  await requirePassageManager();

  const result = await getAllQuestionsService();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch questions.");
  }

  return result.questions || [];
}
