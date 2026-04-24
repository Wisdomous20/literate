"use server";

import { getAllComprehensionTestsByStudentIdService } from "@/service/comprehension-test/getAllComprehensionByStudentService";
import { studentAssessmentIdSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function fetchComprehensionTestsByStudentId(studentId: string) {
  try {
    const validationResult = studentAssessmentIdSchema.safeParse({ studentId });

    if (!validationResult.success) {
      return {
        success: false,
        error: getFirstZodErrorMessage(validationResult.error),
        data: null,
      };
    }

    const comprehensionTests = await getAllComprehensionTestsByStudentIdService(
      validationResult.data.studentId
    );
    return { success: true, data: comprehensionTests };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch comprehension tests for student";
    return { success: false, error: message, data: null };
  }
}
