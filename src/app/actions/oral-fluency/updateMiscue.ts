"use server";

import {
  updateMiscueService,
  type UpdateMiscueInput,
} from "@/service/oral-fluency/updateMiscueService";

export async function updateMiscueAction(input: UpdateMiscueInput) {
  const result = await updateMiscueService(input);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    updatedMetrics: result.updatedMetrics,
  };
}