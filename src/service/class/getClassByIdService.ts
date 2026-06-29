import { prisma } from "@/lib/prisma";

interface StudentItem {
  id: string;
  name: string;
  level?: number;
  classId: string;
  deletedAt?: Date | null;
}

interface ClassWithStudents {
  id: string;
  name: string;
  userId: string;
  schoolYear: string;
  archived: boolean;
  createdAt: Date;
  students: StudentItem[];
}

interface GetClassByIdResult {
  success: boolean;
  classItem?: ClassWithStudents;
  error?: string;
  code?: "VALIDATION_ERROR" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getClassByIdService(
  classId: string,
  userId: string,
): Promise<GetClassByIdResult> {
  if (!classId) {
    return { success: false, error: "Class ID is required", code: "VALIDATION_ERROR" };
  }

  if (!userId) {
    return { success: false, error: "User ID is required", code: "VALIDATION_ERROR" };
  }

  try {
    const classItem = await prisma.class.findFirst({
      where: { id: classId, userId },
      select: {
        id: true,
        name: true,
        userId: true,
        schoolYear: true,
        archived: true,
        createdAt: true,
        students: {
          where: { archived: false }, 
          select: {
            id: true,
            name: true,
            level: true,
            classId: true,
            archived: true,
          },
        },
      },
    });

    if (!classItem) {
      return {
        success: false,
        error: "Forbidden",
        code: "FORBIDDEN",
      };
    }

    return { success: true, classItem };
  } catch (error) {
    console.error("Failed to get class by ID:", error);
    return { success: false, error: "Failed to get class by ID", code: "INTERNAL_ERROR" };
  }
}
