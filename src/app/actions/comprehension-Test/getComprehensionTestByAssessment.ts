"use server";

import { getComprehensionResultByAssessmentService } from "@/service/comprehension-test/getComprehensionResultByAssessmentService";
import { assessmentIdSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requireAuth } from "@/utils/roleCheck";

export async function fetchComprehensionResultByAssessmentId(assessmentId: string) {
  try {
    const session = await requireAuth();
    const validationResult = assessmentIdSchema.safeParse({ assessmentId });

    if (!validationResult.success) {
      return {
        success: false,
        error: getFirstZodErrorMessage(validationResult.error),
        data: null,
      };
    }

    const ComprehensionResult = await getComprehensionResultByAssessmentService(
      validationResult.data.assessmentId,
      session.user.id
    );
    return { success: true, data: ComprehensionResult };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch comprehension test";
    return { success: false, error: message, data: null };
  }
}
