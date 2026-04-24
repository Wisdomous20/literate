"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createStudentService } from "@/service/students/createStudentService"; 
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { createStudentSchema } from "@/lib/validation/classroom";
import { revalidatePath } from "next/cache";
import { getSchoolYear } from "@/utils/getSchoolYear";

export async function createStudent(name: string, level: number, className: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = createStudentSchema.safeParse({
    name,
    level,
    userId: session.user.id,
    className,
    schoolYear: getSchoolYear(),
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await createStudentService(validationResult.data);

  if (result.success) {
    revalidatePath("/students");
  }

  return result;
}
