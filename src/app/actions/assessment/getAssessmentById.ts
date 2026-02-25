"use server";

import { getAssessmentByIdService } from "@/service/assessment/getAssessmentByIdService";

export async function getAssessmentByIdAction(id: string) {
  const result = await getAssessmentByIdService(id);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assessment.");
  }

  return result.assessment;
}