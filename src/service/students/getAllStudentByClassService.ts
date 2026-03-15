import { prisma } from "@/lib/prisma";

interface GetStudentsByClassNameResult {
  success: boolean;
  students?: {
    id: string;
    name: string;
    classRoomId: string;
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
        classRoom: {
          name: className,
          userId,
        },
        archived: false, // Only fetch students who are not archived
      },
      select: {
        id: true,
        name: true,
        classRoomId: true,
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