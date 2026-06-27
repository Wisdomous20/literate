"use server";

import { getAssessmentComprehensionService } from "@/service/assessment/getAssessmentComprehensionService"
import { assessmentIdSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requireAuth } from "@/utils/roleCheck";

export async function getAssessmentComprehension(assessmentId: string) {
  const session = await requireAuth();
  const validationResult = assessmentIdSchema.safeParse({ assessmentId });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await getAssessmentComprehensionService(
    validationResult.data.assessmentId,
    session.user.id
  );
  return result;
}
