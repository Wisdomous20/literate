"use server";

import { createPassageService } from "@/service/admin/createPassageService";
import {  testType } from "@/generated/prisma/enums";

interface CreatePassageActionInput {
  title: string;
  content: string;
  language: string;
  level: number;

  testType: testType;
}

export async function createPassageAction(input: CreatePassageActionInput) {
  const { title, content, language, level, testType } = input;

  // Call the service to create the passage
  const result = await createPassageService({
    title,
    content,
    language,
    level,
    testType,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to create passage.");
  }

  return result.passage;
}