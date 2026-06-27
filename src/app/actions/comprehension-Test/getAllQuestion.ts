"use server";

import { getAllQuestionsService } from "@/service/admin/getAllQuestionsService";
import { requireRole } from "@/utils/roleCheck";

export async function getAllQuestionsAction() {
  await requireRole("ADMIN");

  const result = await getAllQuestionsService();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch questions.");
  }

  return result.questions || [];
}
