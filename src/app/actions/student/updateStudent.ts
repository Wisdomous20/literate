"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { updateStudentService } from "@/service/students/updateStudentService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateStudentSchema } from "@/lib/validation/classroom";
import { revalidatePath } from "next/cache";

export async function updateStudent(
  studentId: string,
  name?: string,
  level?: number
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = updateStudentSchema.safeParse({
    userId: session.user.id,
    studentId,
    name,
    level,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await updateStudentService(validationResult.data);

  if (result.success) {
    revalidatePath("/students");
  }

  return result;
}
