"use server";

import { getQuizByPassageService } from "@/service/comprehension-test/getQuizByPassageService";
import { getQuizByPassageSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function getQuizByPassageAction(passageId: string) {
  const validationResult = getQuizByPassageSchema.safeParse({ passageId });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await getQuizByPassageService(validationResult.data.passageId);
}
