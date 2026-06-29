import { prisma } from "@/lib/prisma";

interface ArchivedClassItem {
  id: string;
  name: string;
  userId: string;
  schoolYear: string;
  archived: boolean;
  createdAt: Date;
  studentCount: number;
}

interface GetArchivedClassListResult {
  success: boolean;
  classes?: ArchivedClassItem[];
  error?: string;
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function getArchivedClassServiceBySchoolYear(
  userId: string,
  schoolYear: string,
): Promise<GetArchivedClassListResult> {
  if (!userId) {
    return { success: false, error: "User ID is required", code: "VALIDATION_ERROR" };
  }

  if (!schoolYear) {
    return {
      success: false,
      error: "School year is required",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const classes = await prisma.class.findMany({
      where: {
        userId,
        schoolYear,
        archived: true,
      },
      select: {
        id: true,
        name: true,
        userId: true,
        schoolYear: true,
        archived: true,
        createdAt: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      classes: classes.map((classItem) => ({
        id: classItem.id,
        name: classItem.name,
        userId: classItem.userId,
        schoolYear: classItem.schoolYear,
        archived: classItem.archived,
        createdAt: classItem.createdAt,
        studentCount: classItem._count.students,
      })),
    };
  } catch (error) {
    console.error("Failed to get archived classes:", error);
    return {
      success: false,
      error: "Failed to get archived classes",
      code: "INTERNAL_ERROR",
    };
  }
}
