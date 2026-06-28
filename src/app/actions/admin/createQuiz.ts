"use server";

import { createQuizService } from "@/service/quiz/createQuizService";
import { createQuizSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requirePassageManager } from "@/utils/roleCheck";
import { recordActivityLog } from "@/service/activity/activityLogService";

interface CreateQuizActionInput {
  passageId: string;
  totalScore: number;
  questions: {
    questionText: string;
    tags: "Literal" | "Inferential" | "Critical";
    type: "MULTIPLE_CHOICE" | "ESSAY";
    options?: string[]; // Only for MULTIPLE_CHOICE
    correctAnswer?: string; // Correct MC option or ESSAY guide answer
  }[];
}

export async function createQuizAction(input: CreateQuizActionInput) {
  const session = await requirePassageManager();

  const validationResult = createQuizSchema.safeParse({
    ...input,
    totalNumber: input.questions.length,
  });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to create the quiz
  const result = await createQuizService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to create quiz.");
  }

  if (result.quiz) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "QUIZ_CREATED",
      entityType: "quiz",
      entityId: result.quiz.id,
      entityTitle: `Quiz for passage ${result.quiz.passageId}`,
      metadata: {
        passageId: result.quiz.passageId,
        totalNumber: result.quiz.totalNumber,
        totalScore: result.quiz.totalScore,
      },
    });
  }

  return result.quiz;
}
