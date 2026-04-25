"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getStudentsByClassNameService } from "@/service/students/getAllStudentByClassService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { getStudentsByClassNameSchema } from "@/lib/validation/classroom";

export async function getStudentsByClassName(className: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const validationResult = getStudentsByClassNameSchema.safeParse({
      userId: session.user.id,
      className,
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: getFirstZodErrorMessage(validationResult.error),
        code: "VALIDATION_ERROR",
      };
    }

    const result = await getStudentsByClassNameService(
      validationResult.data.userId,
      validationResult.data.className
    );
    return result;
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return {
      success: false,
      error: "Failed to fetch students",
      code: "INTERNAL_ERROR",
    };
  }
}
