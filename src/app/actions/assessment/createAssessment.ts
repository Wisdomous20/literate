"use server";

import { createAssessmentService } from "@/service/assessment/createAssessmentService";

export async function createAssessmentAction(input: {
  studentId: string;
  type: "ORAL_READING" | "COMPREHENSION" | "READING_FLUENCY";
  passageId: string;
}) {
  const result = await createAssessmentService(input);

  if (!result.success) {
    throw new Error(result.error || "Failed to create assessment.");
  }

  return result.assessment;
}