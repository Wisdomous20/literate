"use server";

import { updatePassageService } from "@/service/admin/UpdatePassageService";
import { Tags, testType } from "@/generated/prisma/enums";

interface UpdatePassageActionInput {
  id: string;
  title?: string;
  content?: string;
  language?: string;
  level?: number;
  tags?: Tags;
  testType?: testType;
}

export async function updatePassageAction(input: UpdatePassageActionInput) {
  const { id, title, content, language, level, tags, testType } = input;

  // Call the service to update the passage
  const result = await updatePassageService({
    id,
    title,
    content,
    language,
    level,
    tags,
    testType,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to update passage.");
  }

  return result.passage;
}