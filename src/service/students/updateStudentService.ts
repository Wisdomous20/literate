import { prisma } from "@/lib/prisma";

interface UpdateStudentInput {
  userId: string;
  studentId: string;
  name?: string;
  level?: number;
}

interface UpdateStudentResult {
  success: boolean;
  student?: {
    id: string;
    name: string;
    classId: string;
    level?: number;
  };
  error?: string;
  code?: "VALIDATION_ERROR" | "STUDENT_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function updateStudentService(
  input: UpdateStudentInput
): Promise<UpdateStudentResult> {
  const { userId, studentId, name, level } = input;

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

  if (name !== undefined && !name.trim()) {
    return {
      success: false,
      error: "If provided, name must not be empty",
      code: "VALIDATION_ERROR",
    };
  }

  if (name === undefined && level === undefined) {
    return {
      success: false,
      error: "Nothing to update",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    // Ensure the student exists and belongs to a class owned by the user
    const existing = await prisma.student.findFirst({
      where: {
        id: studentId,
        class: { userId },
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

    const updateData: { name?: string; level?: number } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (level !== undefined) updateData.level = level;

    const student = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
      select: {
        id: true,
        name: true,
        level: true,
        classId: true,
      },
    });

    return { success: true, student };
  } catch (error) {
    console.error("Failed to update student:", error);
    return {
      success: false,
      error: "Failed to update student",
      code: "INTERNAL_ERROR",
    };
  }
}
