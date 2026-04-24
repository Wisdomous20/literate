"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getStudentServiceById } from "@/service/students/getStudentServiceById";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { getStudentByIdSchema } from "@/lib/validation/classroom";

export async function getStudentAction(studentId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = getStudentByIdSchema.safeParse({
    userId: session.user.id,
    studentId,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await getStudentServiceById(
    validationResult.data.userId,
    validationResult.data.studentId
  );
}
