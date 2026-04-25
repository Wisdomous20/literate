"use server";

import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateBehaviorsSchema } from "@/lib/validation/media";
import {
  updateBehaviorsService,
  type UpdateBehaviorsInput,
} from "@/service/oral-fluency/updateBehaviorsService";

export async function updateBehaviorsAction(input: UpdateBehaviorsInput) {
  const validationResult = updateBehaviorsSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await updateBehaviorsService(validationResult.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    behaviors: result.behaviors,
  };
}
