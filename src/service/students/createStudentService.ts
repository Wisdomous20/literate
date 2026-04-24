import { prisma } from "@/lib/prisma";
import { createStudentSchema } from "@/lib/validation/classroom";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

interface CreateStudentInput {
  name: string;
  level: number;
  userId: string;
  className: string;
  schoolYear: string;
}

interface CreateStudentResult {
  success: boolean;
  student?: {
    id: string;
    name: string;
    level: number;
    classRoomId: string;
  };
  error?: string;
  code?: "VALIDATION_ERROR" | "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function createStudentService(
  input: CreateStudentInput
): Promise<CreateStudentResult> {
  const validationResult = createStudentSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
      code: "VALIDATION_ERROR",
    };
  }
  const { name, level, userId, className, schoolYear } = validationResult.data;

  try {
    const userClass = await prisma.classRoom.findFirst({
      where: { userId, name: className.trim(), schoolYear: schoolYear.trim() },
    });

    if (!userClass) {
      return {
        success: false,
        error: "Class not found for the given name and school year",
        code: "CLASS_NOT_FOUND",
      };
    }

    // Prevent duplicate student in the same class (same school year)
    const existingStudent = await prisma.student.findFirst({
      where: {
        name: name.trim(),
        classRoomId: userClass.id,
      },
      select: { id: true },
    });

    if (existingStudent) {
      return {
        success: false,
        error: "Student already exists in this class for the specified school year",
        code: "VALIDATION_ERROR",
      };
    }

    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        level,
        classRoomId: userClass.id,
      },
      select: {
        id: true,
        name: true,
        level: true,
        classRoomId: true,
      },
    });

    return { success: true, student };
  } catch (error) {
    console.error("Failed to create student:", error);
    return {
      success: false,
      error: "Failed to create student",
      code: "INTERNAL_ERROR",
    };
  }
}
