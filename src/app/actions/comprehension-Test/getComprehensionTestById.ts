"use server"

import { getComprehensionTestByIdService } from "@/service/comprehension-test/getComprehensionTestByIdService";
import { assessmentIdSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function fetchComprehensionTestById(id: string) {
  try {
    const validationResult = assessmentIdSchema.safeParse({ assessmentId: id });

    if (!validationResult.success) {
      return {
        success: false,
        error: getFirstZodErrorMessage(validationResult.error),
        data: null,
      };
    }

    const comprehensionTest = await getComprehensionTestByIdService(
      validationResult.data.assessmentId
    );
    return { success: true, data: comprehensionTest };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch comprehension test";
    return { success: false, error: message, data: null };
  }
}
