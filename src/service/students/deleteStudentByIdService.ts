import { prisma } from "@/lib/prisma";

interface DeleteStudentInput {
  userId: string;
  studentId: string;
}

interface DeleteStudentResult {
  success: boolean;
  student?: {
    id: string;
    name: string;
    classRoomId: string;
    level?: number;
    archived: boolean;
  };
  error?: string;
  code?: "VALIDATION_ERROR" | "STUDENT_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function deleteStudentByIdService(
  input: DeleteStudentInput
): Promise<DeleteStudentResult> {
  const { userId, studentId } = input;

  if (!userId) {
    return {
      success: false,
      error: "User ID is required",
      code: "VALIDATION_ERROR",
    };
  }

  if (!studentId) {
    return {
      success: false,
      error: "Student ID is required",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const existing = await prisma.student.findFirst({
      where: {
        id: studentId,
        classRoom: { userId },
      },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        error: "Student not found or access denied",
        code: "STUDENT_NOT_FOUND",
      };
    }

    const student = await prisma.student.update({
      where: { id: studentId },
      data: { archived: true },
      select: {
        id: true,
        name: true,
        level: true,
        classRoomId: true,
        archived: true,
      },
    });

    return { success: true, student };
  } catch (error) {
    console.error("Failed to delete student:", error);
    return {
      success: false,
      error: "Failed to delete student",
      code: "INTERNAL_ERROR",
    };
  }
}
