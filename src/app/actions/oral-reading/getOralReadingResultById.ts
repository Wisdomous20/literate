"use server";

import { getOralReadingResultByIdService } from "@/service/oral-reading/getOralReadingResultByIdService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { oralReadingResultIdSchema } from "@/lib/validation/assessment";
import { requireAuth } from "@/utils/roleCheck";

export async function getOralReadingResultById(oralReadingResultId: string) {
  const session = await requireAuth();
  const validationResult = oralReadingResultIdSchema.safeParse({
    oralReadingResultId,
  });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  const result = await getOralReadingResultByIdService(
    validationResult.data.oralReadingResultId,
    session.user.id
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch oral reading result.");
  }

  return result.oralReadingResult;
}
