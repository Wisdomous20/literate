"use server";

import { getAllComprehensionTestsByStudentIdService } from "@/service/comprehension-test/getAllComprehensionByStudentService";

export async function fetchComprehensionTestsByStudentId(studentId: string) {
  try {
    const comprehensionTests = await getAllComprehensionTestsByStudentIdService(studentId);
    return { success: true, data: comprehensionTests };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch comprehension tests for student";
    return { success: false, error: message, data: null };
  }
}