"use server";

import { addQuestionService } from "@/service/question/addQuestionService";
import { addQuestionSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requirePassageManager } from "@/utils/roleCheck";
import { recordActivityLog } from "@/service/activity/activityLogService";

interface AddQuestionActionInput {
  passageId: string;
  questionText: string;
  tags: "Literal" | "Inferential" | "Critical";
  type: "MULTIPLE_CHOICE" | "ESSAY";
  options?: string[]; // Only for MULTIPLE_CHOICE
  correctAnswer?: string; // Correct MC option or ESSAY guide answer
}

export async function addQuestionAction(input: AddQuestionActionInput) {
  const session = await requirePassageManager();

  const validationResult = addQuestionSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to add the question
  const result = await addQuestionService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to add question.");
  }

  if (result.question) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "QUESTION_CREATED",
      entityType: "question",
      entityId: result.question.id,
      entityTitle: result.question.questionText,
      metadata: {
        passageId: validationResult.data.passageId,
        quizId: result.question.quizId,
        type: result.question.type,
        tags: result.question.tags,
      },
    });
  }

  return result.question;
}
