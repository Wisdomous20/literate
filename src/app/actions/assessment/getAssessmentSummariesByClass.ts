"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { getAssessmentsByClassSchema } from "@/lib/validation/assessment";
import { getAssessmentSummariesByClassService } from "@/service/assessment/getAssessmentSummariesByClassService";

export async function getAssessmentSummariesByClass(classRoomId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validationResult = getAssessmentsByClassSchema.safeParse({
    classRoomId,
  });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  const result = await getAssessmentSummariesByClassService(
    validationResult.data.classRoomId,
    session.user.id,
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch class assessment summaries.");
  }

  return result.assessments;
}
