import { prisma } from "@/lib/prisma";

interface GetPassageByIdInput {
  id: string;
}

interface GetPassageByIdResult {
  success: boolean;
  passage?: {
    id: string;
    title: string;
    content: string;
    language: string;
    level: number;
    tags: string;
    testType: string;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
  code?: "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getPassageByIdService(
  input: GetPassageByIdInput
): Promise<GetPassageByIdResult> {
  const { id } = input;

  // Validate input
  if (!id) {
    return {
      success: false,
      error: "Passage ID is required.",
      code: "NOT_FOUND",
    };
  }

  try {
    // Fetch the passage by ID
    const passage = await prisma.passage.findUnique({
      where: { id },
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

    if (!passage) {
      return {
        success: false,
        error: "Passage not found.",
        code: "NOT_FOUND",
      };
    }

    return {
      success: true,
      passage,
    };
  } catch (error) {
    console.error("Error fetching passage by ID:", error);
    return {
      success: false,
      error: "An internal error occurred while fetching the passage.",
      code: "INTERNAL_ERROR",
    };
  }
}