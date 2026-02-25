"use server";

import { getQuizByPassageService } from "@/service/comprehension-test/getQuizByPassageService";

export async function getQuizByPassageAction(passageId: string) {
  if (!passageId) {
    return { success: false, error: "Passage ID is required" };
  }

  return await getQuizByPassageService(passageId);
}