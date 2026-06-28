"use server";

import { updateQuizService } from "@/service/quiz/updateQuizService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateQuizSchema } from "@/lib/validation/admin";
import { requirePassageManager } from "@/utils/roleCheck";
import { recordActivityLog } from "@/service/activity/activityLogService";

interface EditQuizActionInput {
  id: string;
  totalScore?: number;
  questions?: {
    id?: string; // For existing questions
    questionText?: string;
    tags?: "Literal" | "Inferential" | "Critical";
    type?: "MULTIPLE_CHOICE" | "ESSAY";
    options?: string[]; // Only for MULTIPLE_CHOICE
    correctAnswer?: string; // Correct MC option or ESSAY guide answer
  }[];
}

export async function editQuizAction(input: EditQuizActionInput) {
  const session = await requirePassageManager();

  const validationResult = updateQuizSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to edit the quiz
  const result = await updateQuizService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to edit quiz.");
  }

  if (result.quiz) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "QUIZ_UPDATED",
      entityType: "quiz",
      entityId: result.quiz.id,
      entityTitle: `Quiz ${result.quiz.id}`,
      metadata: validationResult.data,
    });
  }

  return result.quiz;
}
