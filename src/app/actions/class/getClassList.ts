"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getAllClassServiceBySchoolYear } from "@/service/class/getAllClassServiceBySchoolYear";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { getClassListSchema } from "@/lib/validation/classroom";

export async function getClassListBySchoolYear(schoolYear: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = getClassListSchema.safeParse({
    userId: session.user.id,
    schoolYear,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await getAllClassServiceBySchoolYear(
    validationResult.data.userId,
    validationResult.data.schoolYear
  );
}
