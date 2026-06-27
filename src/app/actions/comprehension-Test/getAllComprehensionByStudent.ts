"use server";

import { getAllComprehensionResultsByStudentIdService } from "@/service/comprehension-test/getAllComprehensionByStudentService";
import { studentAssessmentIdSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requireAuth } from "@/utils/roleCheck";

export async function fetchComprehensionResultsByStudentId(studentId: string) {
  try {
    const session = await requireAuth();
    const validationResult = studentAssessmentIdSchema.safeParse({ studentId });

    if (!validationResult.success) {
      return {
        success: false,
        error: getFirstZodErrorMessage(validationResult.error),
        data: null,
      };
    }

    const ComprehensionResults = await getAllComprehensionResultsByStudentIdService(
      validationResult.data.studentId,
      session.user.id
    );
    return { success: true, data: ComprehensionResults };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch comprehension tests for student";
    return { success: false, error: message, data: null };
  }
}
