import { prisma } from "@/lib/prisma";

interface GetStudentsByClassNameResult {
  success: boolean;
  students?: {
    id: string;
    name: string;
    classId: string;
    level?: number;
  }[];
  error?: string;
  code?: "UNAUTHORIZED" | "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getStudentsByClassNameService(
  userId: string,
  className: string
): Promise<GetStudentsByClassNameResult> {
  try {
    const students = await prisma.student.findMany({
      where: {
        class: {
          name: className,
          userId,
        },
      },
      select: {
        id: true,
        name: true,
        classId: true,
        level: true,
      },
    });

    return { success: true, students };
  } catch (error) {
    console.error("Failed to fetch students by class name:", error);
    return {
      success: false,
      error: "Failed to fetch students",
      code: "INTERNAL_ERROR",
    };
  }
}