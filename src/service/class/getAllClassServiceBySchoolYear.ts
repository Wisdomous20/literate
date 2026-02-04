// import { prisma } from "@/lib/prisma";

// interface ClassItem {
//   id: string;
//   name: string;
//   userId: string;
//   schoolYear: string;
//   archived: boolean;
//   createdAt: Date;
// }

// interface GetClassListResult {
//   success: boolean;
//   classes?: ClassItem[];
//   error?: string;
//   code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
// }

// export async function getAllClassServiceBySchoolYear(
//   userId: string,
//   schoolYear: string
// ): Promise<GetClassListResult> {
//   if (!userId) {
//     return { success: false, error: "User ID is required", code: "VALIDATION_ERROR" };
//   }

//   if (!schoolYear) {
//     return { success: false, error: "School year is required", code: "VALIDATION_ERROR" };
//   }

//   try {
//     const classes = await prisma.class.findMany({
//       where: { 
//         userId, 
//         schoolYear, 
//         archived: false 
//       },
//       select: {
//         id: true,
//         name: true,
//         userId: true,
//         schoolYear: true,
//         archived: true,
//         createdAt: true,
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     return { success: true, classes };
//   } catch (error) {
//     console.error("Failed to get classes:", error);
//     return { success: false, error: "Failed to get classes", code: "INTERNAL_ERROR" };
//   }
// }

import { prisma } from "@/lib/prisma";

interface ClassItem {
  id: string;
  name: string;
  userId: string;
  schoolYear: string;
  archived: boolean;
  createdAt: Date;
  studentCount: number;
}

interface GetClassListResult {
  success: boolean;
  classes?: ClassItem[];
  error?: string;
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function getAllClassServiceBySchoolYear(
  userId: string,
  schoolYear: string
): Promise<GetClassListResult> {
  if (!userId) {
    return { success: false, error: "User ID is required", code: "VALIDATION_ERROR" };
  }

  if (!schoolYear) {
    return { success: false, error: "School year is required", code: "VALIDATION_ERROR" };
  }

  try {
    const classes = await prisma.class.findMany({
      where: { 
        userId, 
        schoolYear, 
        archived: false 
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
            students: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const classesWithCount = classes.map((c) => ({
      id: c.id,
      name: c.name,
      userId: c.userId,
      schoolYear: c.schoolYear,
      archived: c.archived,
      createdAt: c.createdAt,
      studentCount: c._count.students,
    }));

    return { success: true, classes: classesWithCount };
  } catch (error) {
    console.error("Failed to get classes:", error);
    return { success: false, error: "Failed to get classes", code: "INTERNAL_ERROR" };
  }
}