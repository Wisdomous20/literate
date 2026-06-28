"use server";

import { deleteQuestionService } from "@/service/question/deleteQuestionService";
import { deleteQuestionSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requirePassageManager } from "@/utils/roleCheck";
import { recordActivityLog } from "@/service/activity/activityLogService";

interface DeleteQuestionActionInput {
  id: string;
}

export async function deleteQuestionAction(input: DeleteQuestionActionInput) {
  const session = await requirePassageManager();

  const validationResult = deleteQuestionSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to delete the question
  const result = await deleteQuestionService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to delete question.");
  }

  if (result.question) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "QUESTION_DELETED",
      entityType: "question",
      entityId: result.question.id,
      entityTitle: result.question.questionText,
      metadata: { quizId: result.question.quizId },
    });
  }

  return { success: true };
}
