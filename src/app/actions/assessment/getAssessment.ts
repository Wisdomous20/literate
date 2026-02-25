"use server";

import { getAssessmentsByStudentService } from "@/service/assessment/getAssessmentsByStudentService";

export async function getAssessmentsByStudent(
  studentId?: string,
  type?: string
) {
  const result = await getAssessmentsByStudentService({ studentId, type });

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assessments.");
  }

  return result.assessments;
}