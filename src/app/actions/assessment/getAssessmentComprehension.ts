"use server";

import { getAssessmentComprehensionService } from "@/service/assessment/getAssessmentComprehensionService"
import { assessmentIdSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function getAssessmentComprehension(assessmentId: string) {
  const validationResult = assessmentIdSchema.safeParse({ assessmentId });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await getAssessmentComprehensionService(
    validationResult.data.assessmentId
  );
  return result;
}
