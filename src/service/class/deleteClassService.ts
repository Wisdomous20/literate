import { prisma } from "@/lib/prisma";

interface DeleteClassInput {
  userId: string;
  classId: string;
}

interface DeleteClassResult {
  success: boolean;
  id?: string;
  error?: string;
  code?: "VALIDATION_ERROR" | "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function deleteClassService(
  input: DeleteClassInput
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
      return { success: false, error: "Class not found or access denied", code: "CLASS_NOT_FOUND" };
    }

    const deleted = await prisma.class.delete({
      where: { id: classId },
      select: { id: true },
    });

    return { success: true, id: deleted.id };
  } catch (error) {
    console.error("Failed to delete class:", error);
    return { success: false, error: "Failed to delete class", code: "INTERNAL_ERROR" };
  }
}