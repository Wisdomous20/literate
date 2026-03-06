"use server";

import { getAssessmentComprehensionService } from "@/service/assessment/getAssessmentComprehensionService"

export async function getAssessmentComprehension(assessmentId: string) {
  const result = await getAssessmentComprehensionService(assessmentId);
  return result;
}