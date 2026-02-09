"use server";

import { getAllPassageService } from "@/service/admin/getAllPassageService";

export async function getAllPassagesAction() {
  const result = await getAllPassageService();

  if (!result.success) {
    return { success: false, error: result.error || "Failed to fetch passages." };
  }

  return { success: true, passages: result.passages };
}