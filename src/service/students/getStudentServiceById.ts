import { prisma } from "@/lib/prisma";

interface GetStudentResult {
  success: boolean;
  student?: {
    id: string;
    name: string;
    classId: string;
    level?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assessments?: any[];
  };
  error?: string;
  code?: "STUDENT_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getStudentServiceById(
  userId: string,
  studentId: string
): Promise<GetStudentResult> {
  try {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        class: { userId },
      },
      select: {
        id: true,
        name: true,
        classId: true,
        assessments: true,
        level: true,
      },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found or access denied",
        code: "STUDENT_NOT_FOUND",
      };
    }

    return { success: true, student };
  } catch (error) {
    console.error("Failed to fetch student:", error);
    return {
      success: false,
      error: "Failed to fetch student",
      code: "INTERNAL_ERROR",
    };
  }
}