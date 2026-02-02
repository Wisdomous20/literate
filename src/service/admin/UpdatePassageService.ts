import { prisma } from "@/lib/prisma";
import { Tags, testType } from "@/generated/prisma/enums";

interface UpdatePassageInput {
  id: string;
  title?: string;
  content?: string;
  language?: string;
  level?: number;
  tags?: Tags;
  testType?: testType;
}

interface UpdatePassageResult {
  success: boolean;
  passage?: {
    id: string;
    title: string;
    content: string;
    language: string;
    level: number;
    tags: Tags;
    testType: testType;
  };
  error?: string;
  code?: "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function updatePassageService(
  input: UpdatePassageInput
): Promise<UpdatePassageResult> {
  const { id, title, content, language, level, tags, testType } = input;

  // Validate input
  if (!id) {
    return {
      success: false,
      error: "Passage ID is required.",
      code: "VALIDATION_ERROR",
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

    // Update the passage
    const updatedPassage = await prisma.passage.update({
      where: { id },
      data: {
        title,
        content,
        language,
        level,
        tags,
        testType,
      },
    });

    return {
      success: true,
      passage: {
        id: updatedPassage.id,
        title: updatedPassage.title,
        content: updatedPassage.content,
        language: updatedPassage.language,
        level: updatedPassage.level,
        tags: updatedPassage.tags,
        testType: updatedPassage.testType,
      },
    };
  } catch (error) {
    console.error("Error updating passage:", error);
    return {
      success: false,
      error: "An internal error occurred while updating the passage.",
      code: "INTERNAL_ERROR",
    };
  }
}