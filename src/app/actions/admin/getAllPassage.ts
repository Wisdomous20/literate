"use server";

import { getAllPassageService } from "@/service/admin/getAllPassageService";

export async function getAllPassageAction() {
  // Call the service to fetch all passages
  const result = await getAllPassageService();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch passages.");
  }

  return result.passages;
}