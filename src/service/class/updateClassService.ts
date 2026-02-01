import { prisma } from "@/lib/prisma";

interface UpdateClassInput {
  userId: string;
  classId: string;
  name?: string;
  archived?: boolean;
}

interface UpdateClassResult {
  success: boolean;
  class?: {
    id: string;
    name: string;
    userId: string;
    schoolYear: string;
    archived: boolean;
  };
  error?: string;
  code?: "VALIDATION_ERROR" | "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function updateClassService(
  input: UpdateClassInput
): Promise<UpdateClassResult> {
  const { userId, classId, name, archived } = input;

  if (!userId) {
    return { success: false, error: "User ID is required", code: "VALIDATION_ERROR" };
  }

  if (!classId) {
    return { success: false, error: "Class ID is required", code: "VALIDATION_ERROR" };
  }

  if (name !== undefined && !name.trim()) {
    return { success: false, error: "If provided, name must not be empty", code: "VALIDATION_ERROR" };
  }

  if (name === undefined && archived === undefined) {
    return { success: false, error: "Nothing to update", code: "VALIDATION_ERROR" };
  }

  try {
    const existing = await prisma.class.findFirst({
      where: { id: classId, userId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Class not found or access denied", code: "CLASS_NOT_FOUND" };
    }

    const updateData: { name?: string; archived?: boolean } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (archived !== undefined) updateData.archived = archived;

    const updated = await prisma.class.update({
      where: { id: classId },
      data: updateData,
      select: { id: true, name: true, userId: true, schoolYear: true, archived: true },
    });

    return { success: true, class: updated };
  } catch (error) {
    console.error("Failed to update class:", error);
    return { success: false, error: "Failed to update class", code: "INTERNAL_ERROR" };
  }
}