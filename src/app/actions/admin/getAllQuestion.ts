"use server";

import { getAllQuestionsService } from "@/service/admin/getAllQuestionsService";

export async function getAllQuestionsAction() {
  const result = await getAllQuestionsService();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch questions.");
  }

  return result.questions || [];
}