import { prisma } from "@/lib/prisma";

interface DeleteClassInput {
  userId: string;
  classId: string;
}

interface DeleteClassResult {
  success: boolean;
  id?: string;
  error?: string;
  code?: "VALIDATION_ERROR" | "FORBIDDEN" | "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function deleteClassService(
  input: DeleteClassInput,
): Promise<DeleteClassResult> {
  const { userId, classId } = input;

  if (!userId) {
    return { success: false, error: "User ID is required", code: "VALIDATION_ERROR" };
  }

  if (!classId) {
    return { success: false, error: "Class ID is required", code: "VALIDATION_ERROR" };
  }

  try {
    const existing = await prisma.class.findFirst({
      where: { id: classId, userId },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        error: "Forbidden",
        code: "FORBIDDEN",
      };
    }

    const archived = await prisma.class.update({
      where: { id: classId },
      data: { archived: true },
      select: { id: true },
    });

    return { success: true, id: archived.id };
  } catch (error) {
    console.error("Failed to archive class:", error);
    return { success: false, error: "Failed to archive class", code: "INTERNAL_ERROR" };
  }
}
