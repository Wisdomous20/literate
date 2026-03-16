import { prisma } from "@/lib/prisma";

interface StudentItem {
  id: string;
  name: string;
  level?: number;
  classRoomId: string;
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
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getClassByIdService(
  classRoomId: string
): Promise<GetClassByIdResult> {
  if (!classRoomId) {
    return { success: false, error: "Class ID is required", code: "VALIDATION_ERROR" };
  }

  try {
    const classItem = await prisma.classRoom.findUnique({
      where: { id: classRoomId },
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
            classRoomId: true,
            archived: true,
          },
        },
      },
    });

    if (!classItem) {
      return { success: false, error: "Class not found", code: "NOT_FOUND" };
    }

    return { success: true, classItem };
  } catch (error) {
    console.error("Failed to get class by ID:", error);
    return { success: false, error: "Failed to get class by ID", code: "INTERNAL_ERROR" };
  }
}