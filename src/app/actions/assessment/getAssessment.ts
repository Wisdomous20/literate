"use server";

import { getAssessmentsByStudentService } from "@/service/assessment/getAssessmentsByStudentService";
import { getAssessmentsByStudentSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function getAssessmentsByStudent(
  studentId?: string,
  type?: string
) {
  const validationResult = getAssessmentsByStudentSchema.safeParse({
    studentId,
    type,
  });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  const result = await getAssessmentsByStudentService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assessments.");
  }

  return result.assessments;
}
