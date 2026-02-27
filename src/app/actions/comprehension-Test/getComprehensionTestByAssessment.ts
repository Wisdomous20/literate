"use server";

import { getComprehensionTestByAssessmentService } from "@/service/comprehension-test/getComprehensionTestByAssessmentService";

export async function fetchComprehensionTestByAssessmentId(assessmentId: string) {
  try {
    const comprehensionTest = await getComprehensionTestByAssessmentService(assessmentId);
    return { success: true, data: comprehensionTest };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch comprehension test";
    return { success: false, error: message, data: null };
  }
}