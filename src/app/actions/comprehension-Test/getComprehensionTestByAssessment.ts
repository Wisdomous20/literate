"use server";

import { getComprehensionTestByAssessmentService } from "@/service/comprehension-test/getComprehensionTestByAssessmentService";
import { assessmentIdSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function fetchComprehensionTestByAssessmentId(assessmentId: string) {
  try {
    const validationResult = assessmentIdSchema.safeParse({ assessmentId });

    if (!validationResult.success) {
      return {
        success: false,
        error: getFirstZodErrorMessage(validationResult.error),
        data: null,
      };
    }

    const comprehensionTest = await getComprehensionTestByAssessmentService(
      validationResult.data.assessmentId
    );
    return { success: true, data: comprehensionTest };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch comprehension test";
    return { success: false, error: message, data: null };
  }
}
