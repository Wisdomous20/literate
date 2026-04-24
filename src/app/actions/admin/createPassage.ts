"use server";

import { createPassageService } from "@/service/admin/createPassageService";
import {  testType } from "@/generated/prisma/enums";
import { createPassageSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

interface CreatePassageActionInput {
  title: string;
  content: string;
  language: string;
  level: number;

  testType: testType;
}

export async function createPassageAction(input: CreatePassageActionInput) {
  const validationResult = createPassageSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to create the passage
  const result = await createPassageService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to create passage.");
  }

  return result.passage;
}
