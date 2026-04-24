"use server";

import { getOralReadingResultsByStudentService } from "@/service/oral-reading/getOralReadingResultsByStudentService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { studentAssessmentIdSchema } from "@/lib/validation/assessment";

export async function getOralReadingResultsByStudent(studentId: string) {
  const validationResult = studentAssessmentIdSchema.safeParse({ studentId });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  const result = await getOralReadingResultsByStudentService(
    validationResult.data.studentId
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch oral reading results.");
  }

  return result.oralReadingResults;
}
