import { prisma } from "@/lib/prisma";

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
    classId: string;
  };
  error?: string;
  code?: "VALIDATION_ERROR" | "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function createStudentService(
  input: CreateStudentInput
): Promise<CreateStudentResult> {
  const { name, level, userId, className, schoolYear } = input;

  if (!name || !name.trim()) {
    return {
      success: false,
      error: "Student name is required",
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

  if (!className || !className.trim()) {
    return {
      success: false,
      error: "Class name is required",
      code: "VALIDATION_ERROR",
    };
  }

  if (!schoolYear || !schoolYear.trim()) {
    return {
      success: false,
      error: "School year is required to disambiguate classes",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const userClass = await prisma.class.findFirst({
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
        classId: userClass.id,
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
        classId: userClass.id,
      },
      select: {
        id: true,
        name: true,
        level: true,
        classId: true,
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
