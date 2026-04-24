"use server";

import { getOralReadingResultByIdService } from "@/service/oral-reading/getOralReadingResultByIdService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { oralReadingResultIdSchema } from "@/lib/validation/assessment";

export async function getOralReadingResultById(oralReadingResultId: string) {
  const validationResult = oralReadingResultIdSchema.safeParse({
    oralReadingResultId,
  });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  const result = await getOralReadingResultByIdService(
    validationResult.data.oralReadingResultId
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch oral reading result.");
  }

  return result.oralReadingResult;
}
