import { prisma } from "@/lib/prisma";

interface GetAllPassagesResult {
  success: boolean;
  passages?: {
    id: string;
    title: string;
    content: string;
    language: string;
    level: number;
    tags: string;
    testType: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  error?: string;
  code?: "INTERNAL_ERROR";
}

export async function getAllPassageService(): Promise<GetAllPassagesResult> {
  try {
    // Fetch all passages from the database
    const passages = await prisma.passage.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        language: true,
        level: true,
        tags: true,
        testType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      passages,
    };
  } catch (error) {
    console.error("Error fetching passages:", error);
    return {
      success: false,
      error: "An internal error occurred while fetching passages.",
      code: "INTERNAL_ERROR",
    };
  }
}