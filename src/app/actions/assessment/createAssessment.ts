"use server";

import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import { createAssessmentSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function createAssessmentAction(input: {
  studentId: string;
  type: "ORAL_READING" | "COMPREHENSION" | "READING_FLUENCY";
  passageId: string;
}) {
  const validationResult = createAssessmentSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  const result = await createAssessmentService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to create assessment.");
  }

  return result.assessment;
}
