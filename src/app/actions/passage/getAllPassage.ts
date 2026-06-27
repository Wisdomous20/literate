"use server";

import { getAllPassageService } from "@/service/passage/getAllPassageService";
import { requireAuth } from "@/utils/roleCheck";

export async function getAllPassagesAction() {
  await requireAuth();

  const result = await getAllPassageService();

  if (!result.success) {
    return { success: false, error: result.error || "Failed to fetch passages." };
  }

  return { success: true, passages: result.passages };
}
