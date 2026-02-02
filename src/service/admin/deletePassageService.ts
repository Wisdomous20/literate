import { prisma } from "@/lib/prisma";

interface DeletePassageInput {
  id: string;
}

interface DeletePassageResult {
  success: boolean;
  error?: string;
  code?: "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function deletePassageService(
  input: DeletePassageInput
): Promise<DeletePassageResult> {
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
    // Check if the passage exists
    const existingPassage = await prisma.passage.findUnique({
      where: { id },
    });

    if (!existingPassage) {
      return {
        success: false,
        error: "Passage not found.",
        code: "NOT_FOUND",
      };
    }

    // Delete the passage
    await prisma.passage.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting passage:", error);
    return {
      success: false,
      error: "An internal error occurred while deleting the passage.",
      code: "INTERNAL_ERROR",
    };
  }
}