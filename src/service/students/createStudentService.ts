import { prisma } from "@/lib/prisma";

interface CreateStudentInput {
  name: string;
  userId: string;
}

interface CreateStudentResult {
  success: boolean;
  student?: {
    id: string;
    name: string;
    classId: string;
  };
  error?: string;
  code?: "VALIDATION_ERROR" | "CLASS_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function createStudentService(
  input: CreateStudentInput
): Promise<CreateStudentResult> {
  const { name, userId } = input;

  // Validate required fields
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

  try {
    // Find the user's class
    const userClass = await prisma.class.findUnique({
      where: { userId },
    });

    if (!userClass) {
      return {
        success: false,
        error: "User does not have a class",
        code: "CLASS_NOT_FOUND",
      };
    }

    // Create student
    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        classId: userClass.id,
      },
      select: {
        id: true,
        name: true,
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