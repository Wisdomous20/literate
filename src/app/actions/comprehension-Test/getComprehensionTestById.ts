"use server"

import { getComprehensionTestByIdService } from "@/service/comprehension-test/getComprehensionTestByIdService";

export async function fetchComprehensionTestById(id: string) {
  try {
    const comprehensionTest = await getComprehensionTestByIdService(id);
    return { success: true, data: comprehensionTest };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch comprehension test";
    return { success: false, error: message, data: null };
  }
}