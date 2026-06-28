"use server";

import { createPassageService } from "@/service/passage/createPassageService";
import {  testType } from "@/generated/prisma/enums";
import { createPassageSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requirePassageManager } from "@/utils/roleCheck";
import { recordActivityLog } from "@/service/activity/activityLogService";

interface CreatePassageActionInput {
  title: string;
  content: string;
  language: string;
  level: number;

  testType: testType;
}

export async function createPassageAction(input: CreatePassageActionInput) {
  const session = await requirePassageManager();

  const validationResult = createPassageSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to create the passage
  const result = await createPassageService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to create passage.");
  }

  if (result.passage) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "PASSAGE_CREATED",
      entityType: "passage",
      entityId: result.passage.id,
      entityTitle: result.passage.title,
      metadata: {
        language: result.passage.language,
        level: result.passage.level,
        testType: result.passage.testType,
      },
    });
  }

  return result.passage;
}
