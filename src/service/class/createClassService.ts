import { prisma } from "@/lib/prisma";
import { createClassSchema } from "@/lib/validation/classroom";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
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
  const validationResult = createClassSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
      code: "VALIDATION_ERROR",
    };
  }
  const { name, userId } = validationResult.data;

  // Determine the school year based on the current date
  const schoolYear = getSchoolYear();
  try {
    const newClass = await prisma.classRoom.create({
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
