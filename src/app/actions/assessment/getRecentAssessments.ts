"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getRecentAssessmentsService } from "@/service/assessment/getRecentAssessmentsService";
import { getSchoolYear } from "@/utils/getSchoolYear";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { recentAssessmentsSchema } from "@/lib/validation/assessment";

export async function getRecentAssessments(schoolYear?: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = recentAssessmentsSchema.safeParse({
    schoolYear: schoolYear || getSchoolYear(),
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return getRecentAssessmentsService(
    session.user.id,
    validationResult.data.schoolYear || getSchoolYear()
  );
}
