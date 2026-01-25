import { prisma } from "@/lib/prisma";

interface GetStudentsResult {
  success: boolean;
  students?: {
    id: string;
    name: string;
    classId: string;
  }[];
  error?: string;
  code?: "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getStudentsService(userId: string): Promise<GetStudentsResult> {
  try {
    const userClass = await prisma.class.findUnique({
      where: { userId },
    });

    if (!userClass) {
      return {
        success: false,
        error: "User does not have a class",
        code: "CLASS_NOT_FOUND",
      };
    }

    const students = await prisma.student.findMany({
      where: { classId: userClass.id },
      select: {
        id: true,
        name: true,
        classId: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, students };
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return {
      success: false,
      error: "Failed to fetch students",
      code: "INTERNAL_ERROR",
    };
  }
}