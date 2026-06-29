import { prisma } from "@/lib/prisma";

interface ArchivedStudentItem {
  id: string;
  name: string;
  level?: number;
  classId: string;
  archived: boolean;
}

interface GetArchivedStudentsByClassIdInput {
  userId: string;
  classId: string;
}

interface GetArchivedStudentsByClassIdResult {
  success: boolean;
  students?: ArchivedStudentItem[];
  error?: string;
  code?: "VALIDATION_ERROR" | "FORBIDDEN" | "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getArchivedStudentsByClassIdService(
  input: GetArchivedStudentsByClassIdInput,
): Promise<GetArchivedStudentsByClassIdResult> {
  const { userId, classId } = input;

  if (!userId || !classId) {
    return {
      success: false,
      error: "User ID and class ID are required",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        userId,
      },
      select: { id: true },
    });

    if (!classExists) {
      return {
        success: false,
        error: "Forbidden",
        code: "FORBIDDEN",
      };
    }

    const students = await prisma.student.findMany({
      where: {
        classId,
        archived: true,
      },
      select: {
        id: true,
        name: true,
        level: true,
        classId: true,
        archived: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      students,
    };
  } catch (error) {
    console.error("Failed to fetch archived students:", error);
    return {
      success: false,
      error: "Failed to fetch archived students",
      code: "INTERNAL_ERROR",
    };
  }
}
