"use server";

import {
  updateMiscueService,
  type UpdateMiscueInput,
} from "@/service/oral-fluency/updateMiscueService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateMiscueSchema } from "@/lib/validation/media";
import { requireAuth } from "@/utils/roleCheck";

export async function updateMiscueAction(input: UpdateMiscueInput) {
  const session = await requireAuth();
  const validationResult = updateMiscueSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await updateMiscueService(
    validationResult.data,
    session.user.id
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    miscueId: result.miscueId,
    updatedMetrics: result.updatedMetrics,
  };
}
