"use server";

import { createAssessmentService } from "@/service/assessment/createAssessmentService";

export async function createAssessment(input: {
  studentId: string;
  type: string;
  passageId?: string;
}) {
  const result = await createAssessmentService(input);

  if (!result.success) {
    throw new Error(result.error || "Failed to create assessment.");
  }

  return result.assessment;
}