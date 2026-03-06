// src/app/actions/dashboard/getRecentAssessments.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getRecentAssessmentsService } from "@/service/assessment/getRecentAssessmentsService";
import { getSchoolYear } from "@/utils/getSchoolYear";

export async function getRecentAssessments() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return getRecentAssessmentsService(session.user.id, getSchoolYear());
}