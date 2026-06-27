"use server";

import { getQuizByPassageService } from "@/service/comprehension-test/getQuizByPassageService";
import { getQuizByPassageSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requireAuth } from "@/utils/roleCheck";

export async function getQuizByPassageAction(passageId: string) {
  await requireAuth();

  const validationResult = getQuizByPassageSchema.safeParse({ passageId });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await getQuizByPassageService(validationResult.data.passageId);
}
