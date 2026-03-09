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
  input: DeleteClassInput,
): Promise<DeleteClassResult> {
  const { userId, classId } = input;

  if (!userId) {
    return {
      success: false,
      error: "User ID is required",
      code: "VALIDATION_ERROR",
    };
  }

  if (!classId) {
    return {
      success: false,
      error: "Class ID is required",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const existing = await prisma.class.findFirst({
      where: { id: classId, userId },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        error: "Class not found or access denied",
        code: "CLASS_NOT_FOUND",
      };
    }

    // Delete in a transaction to handle FK constraints that lack onDelete: Cascade
    // Chain: Class → Students → Assessments → OralReadingResult (no cascade)
    const deleted = await prisma.$transaction(async (tx) => {
      // Find all students in this class
      const students = await tx.student.findMany({
        where: { classId },
        select: { id: true },
      });
      const studentIds = students.map((s) => s.id);

      if (studentIds.length > 0) {
        // Find all assessments for these students
        const assessments = await tx.assessment.findMany({
          where: { studentId: { in: studentIds } },
          select: { id: true },
        });
        const assessmentIds = assessments.map((a) => a.id);

        if (assessmentIds.length > 0) {
          // Delete OralReadingResults (missing cascade in schema)
          await tx.oralReadingResult.deleteMany({
            where: { assessmentId: { in: assessmentIds } },
          });
        }
      }

      // Now the class can be deleted — other relations have onDelete: Cascade
      return tx.class.delete({
        where: { id: classId },
        select: { id: true },
      });
    });

    return { success: true, id: deleted.id };
  } catch (error) {
    console.error("Failed to delete class:", error);
    return {
      success: false,
      error: "Failed to delete class",
      code: "INTERNAL_ERROR",
    };
  }
}
