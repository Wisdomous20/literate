import { prisma } from "@/lib/prisma";

interface ArchivedStudentItem {
  id: string;
  name: string;
  level?: number;
  classRoomId: string;
  archived: boolean;
}

interface GetArchivedStudentsByClassIdInput {
  userId: string;
  classRoomId: string;
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
  const { userId, classRoomId } = input;

  if (!userId || !classRoomId) {
    return {
      success: false,
      error: "User ID and class ID are required",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const classExists = await prisma.classRoom.findFirst({
      where: {
        id: classRoomId,
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
        classRoomId,
        archived: true,
      },
      select: {
        id: true,
        name: true,
        level: true,
        classRoomId: true,
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
