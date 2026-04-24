"use server";

import { getAssessmentByIdService } from "@/service/assessment/getAssessmentByIdService";
import { getAssessmentByIdSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function getAssessmentByIdAction(id: string) {
  const validationResult = getAssessmentByIdSchema.safeParse({ id });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  const result = await getAssessmentByIdService(validationResult.data.id);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assessment.");
  }

  return result.assessment;
}
