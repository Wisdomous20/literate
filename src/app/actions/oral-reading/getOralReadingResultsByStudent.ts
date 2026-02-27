"use server";

import { getOralReadingResultsByStudentService } from "@/service/oral-reading/getOralReadingResultsByStudentService";

export async function getOralReadingResultsByStudent(studentId: string) {
  const result = await getOralReadingResultsByStudentService(studentId);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch oral reading results.");
  }

  return result.oralReadingResult;
}