"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { deleteStudentByIdService } from "@/service/students/deleteStudentByIdService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { deleteStudentSchema } from "@/lib/validation/classroom";
import { revalidatePath } from "next/cache";

export async function deleteStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = deleteStudentSchema.safeParse({
    userId: session.user.id,
    studentId,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await deleteStudentByIdService(validationResult.data);

  if (result.success) {
    revalidatePath("/students");
  }
  return result;
}
