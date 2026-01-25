"user server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { updateStudentService } from "@/service/students/updateStudentService";
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

  const result = await updateStudentService({
    userId: session.user.id,
    studentId,
    name,
    level,
  });

    if (result.success) {
    revalidatePath("/students");
  }

    return result;
}  