"use server";

import {
  updateMiscueService,
  type UpdateMiscueInput,
} from "@/service/oral-fluency/updateMiscueService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateMiscueSchema } from "@/lib/validation/media";

export async function updateMiscueAction(input: UpdateMiscueInput) {
  const validationResult = updateMiscueSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await updateMiscueService(validationResult.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    updatedMetrics: result.updatedMetrics,
  };
}
