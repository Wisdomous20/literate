import { prisma } from "@/lib/prisma";

interface ClassStudent {
  id: string;
  name: string;
  level?: number;
  classId: string;
  deletedAt?: Date | null;
}

interface GetClassListResult {
  success: boolean;
  students?: ClassStudent[];
  error?: string;
  code?: "VALIDATION_ERROR" | "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getClassListService(
  userId: string
): Promise<GetClassListResult> {
  if (!userId) {
    return { success: false, error: "User ID is required", code: "VALIDATION_ERROR" };
  }

  try {
    // single query: get the class owned by the user and include non-deleted students
    const cls = await prisma.class.findUnique({
      where: { userId },
      include: {
        students: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            level: true,
            classId: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!cls) {
      return { success: false, error: "Class not found", code: "CLASS_NOT_FOUND" };
    }

    return { success: true, students: cls.students };
  } catch (error) {
    console.error("Failed to get class student list:", error);
    return { success: false, error: "Failed to get students", code: "INTERNAL_ERROR" };
  }
}