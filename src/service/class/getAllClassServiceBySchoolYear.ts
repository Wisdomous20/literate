import { prisma } from "@/lib/prisma";

interface ClassItem {
  id: string;
  name: string;
  userId: string;
  schoolYear: string;
  archived: boolean;
  createdAt: Date;
}

interface GetClassListResult {
  success: boolean;
  classes?: ClassItem[];
  error?: string;
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function getClassListService(
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
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, classes };
  } catch (error) {
    console.error("Failed to get classes:", error);
    return { success: false, error: "Failed to get classes", code: "INTERNAL_ERROR" };
  }
}