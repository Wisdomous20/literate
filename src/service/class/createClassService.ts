import { prisma } from "@/lib/prisma";
import { getSchoolYear } from "@/utils/getSchoolYear";

interface CreateClassInput {
  name: string;
  userId: string;
}

interface CreateClassResult {
  success: boolean;
  class?: {
    id: string;
    name: string;
    userId: string;
    schoolYear: string;
  };
  error?: string;
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function createClassService(
  input: CreateClassInput
): Promise<CreateClassResult> {
  const { name, userId } = input;

  // Validate required fields
  if (!name || !name.trim()) {
    return {
      success: false,
      error: "Class name is required",
      code: "VALIDATION_ERROR",
    };
  }

  if (!userId) {
    return {
      success: false,
      error: "User ID is required",
      code: "VALIDATION_ERROR",
    };
  }

  // Determine the school year based on the current date
  const schoolYear = getSchoolYear();
  try {
    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        userId: userId,
        schoolYear: schoolYear,
      },
      select: {
        id: true,
        name: true,
        userId: true,
        schoolYear: true,
      },
    });

    return { success: true, class: newClass };
  } catch (error) {
    console.error("Failed to create class:", error);
    return {
      success: false,
      error: "Failed to create class",
      code: "INTERNAL_ERROR",
    };
  }
}