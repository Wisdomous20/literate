"use server";

import { getOralReadingResultByIdService } from "@/service/oral-reading/getOralReadingResultByIdService";

export async function getOralReadingResultById(oralReadingResultId: string) {
  const result = await getOralReadingResultByIdService(oralReadingResultId);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch oral reading result.");
  }

  return result.oralReadingResult;
}