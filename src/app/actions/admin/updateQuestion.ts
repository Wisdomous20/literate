"use server";

import { updateQuestionService } from "@/service/question/updateQuestionService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateQuestionSchema } from "@/lib/validation/admin";
import { requirePassageManager } from "@/utils/roleCheck";
import { recordActivityLog } from "@/service/activity/activityLogService";

interface UpdateQuestionActionInput {
  id: string;
  questionText?: string;
  tags?: "Literal" | "Inferential" | "Critical";
  type?: "MULTIPLE_CHOICE" | "ESSAY";
  options?: string[];
  correctAnswer?: string;
}

export async function updateQuestionAction(
  input: UpdateQuestionActionInput,
) {
  const session = await requirePassageManager();

  const validationResult = updateQuestionSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to update the question
  const result = await updateQuestionService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to update question.");
  }

  if (result.question) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "QUESTION_UPDATED",
      entityType: "question",
      entityId: result.question.id,
      entityTitle: result.question.questionText,
      metadata: validationResult.data,
    });
  }

  return result.question;
}
