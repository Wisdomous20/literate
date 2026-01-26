"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { deleteStudentByIdService } from "@/service/students/deleteStudentByIdService";
import { revalidatePath } from "next/cache";

export async function deleteStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await deleteStudentByIdService({
    userId: session.user.id,
    studentId,
  });

  if (result.success) {
    revalidatePath("/students");
  }
  return result;
}
