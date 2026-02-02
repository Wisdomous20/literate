import { prisma } from "@/lib/prisma";
import { Tags } from "@/generated/prisma/enums";
import { testType } from "@/generated/prisma/enums";

interface CreatePassageInput {
  title: string;
  content: string;
  language: string;
  level: number;
  tags: Tags;
  testType: testType;
}

interface CreatePassageResult {
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
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function createPassageService(
  input: CreatePassageInput
): Promise<CreatePassageResult> {
  const { title, content, language, level, tags, testType } = input;

  // Validate input
  if (!title || !content || !language || !level || !tags || !testType) {
    return {
      success: false,
      error: "All fields are required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    // Create the passage in the database
    const passage = await prisma.passage.create({
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
        id: passage.id,
        title: passage.title,
        content: passage.content,
        language: passage.language,
        level: passage.level, 
        tags: passage.tags,
        testType: passage.testType,
      },
    };
  } catch (error) {
    console.error("Error creating passage:", error);
    return {
      success: false,
      error: "An internal error occurred while creating the passage.",
      code: "INTERNAL_ERROR",
    };
  }
}