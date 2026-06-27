"use server";

import { getAssessmentsByStudentService } from "@/service/assessment/getAssessmentsByStudentService";
import { getAssessmentsByStudentSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requireAuth } from "@/utils/roleCheck";

export async function getAssessmentsByStudent(
  studentId?: string,
  type?: string
) {
  const session = await requireAuth();
  const validationResult = getAssessmentsByStudentSchema.safeParse({
    studentId,
    type,
  });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  const result = await getAssessmentsByStudentService({
    ...validationResult.data,
    userId: session.user.id,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assessments.");
  }

  return result.assessments;
}
