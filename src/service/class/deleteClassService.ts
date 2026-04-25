import { prisma } from "@/lib/prisma";

interface DeleteClassInput {
  userId: string;
  classRoomId: string;
}

interface DeleteClassResult {
  success: boolean;
  id?: string;
  error?: string;
  code?: "VALIDATION_ERROR" | "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function deleteClassService(
  input: DeleteClassInput,
): Promise<DeleteClassResult> {
  const { userId, classRoomId } = input;

  if (!userId) {
    return { success: false, error: "User ID is required", code: "VALIDATION_ERROR" };
  }

  if (!classRoomId) {
    return { success: false, error: "Class ID is required", code: "VALIDATION_ERROR" };
  }

  try {
    const existing = await prisma.classRoom.findFirst({
      where: { id: classRoomId, userId },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        error: "Class not found or access denied",
        code: "CLASS_NOT_FOUND",
      };
    }

    const archived = await prisma.classRoom.update({
      where: { id: classRoomId },
      data: { archived: true },
      select: { id: true },
    });

    return { success: true, id: archived.id };
  } catch (error) {
    console.error("Failed to archive class:", error);
    return { success: false, error: "Failed to archive class", code: "INTERNAL_ERROR" };
  }
}
